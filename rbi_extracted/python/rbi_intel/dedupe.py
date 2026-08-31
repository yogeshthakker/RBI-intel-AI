"""Collapse duplicate document rows caused by double ingestion.

RBI lists the same Master Direction / Master Circular on more than one page
of its site (the Master Directions listing AND the Notifications listing,
sometimes both Master Circular pages too). The Node sync layer ingests every
listing it scrapes, so the *same* document ends up stored twice under two
different ids that share RBI's own numeric id but differ in prefix, e.g.

    rbi:md:13640   "... Internal Audit Function) Directions, 2026"
    rbi:nt:13640   "... Internal Audit Function) Directions, 2026"   (duplicate)

This is not cosmetic. `relations.py` resolves references partly by title-token
overlap, and it only skips a reference when the resolved id is *literally* the
same as the source document's own id. Two duplicate rows with near-identical
title tokens don't trip that guard, so the relations builder can construct a
edge from one copy of a document to its own sibling copy — and because that
edge's dst_id differs from the source id, it survives the self-reference
filter and can flip the sibling's status to 'repealed'/'superseded' even
though nothing genuinely repealed it. That is the bug this module exists to
remove at the source, rather than patch around in relations.py.

Strategy
--------
1. Group documents by (title.strip(), date). Any group with >1 row is a
   duplicate set.
2. Pick one canonical id per group: prefer doc_type in
   ("master_direction", "master_circular") over anything else; among ties,
   prefer whichever id sorts first by a fixed prefix priority (md > mc > sc >
   amd > gn > nt), which favours the more "official" listing.
3. For every non-canonical id in the group:
     - delete its rows in clauses / document_revisions / requirements /
       md_categories (the canonical copy either already has these or will
       get them next time chunk/enrich runs — duplicating them onto the
       canonical id would just create a second copy of the same clauses)
     - repoint relations.src_id / relations.dst_id from the duplicate id to
       the canonical id
     - drop any relations row that becomes self-referential (src_id ==
       dst_id) once repointed — that is exactly the false edge described
       above
     - delete the duplicate's own row from documents
4. Leave `documents.status` alone here — rerun `python rbi.py relations`
   immediately afterwards to re-derive status from the now-corrected edge
   set (its own logic already resets non-withdrawn documents to 'active'
   before reapplying edges, so no manual status fix-up is needed here).

Dry-run by default: `run(conn)` reports what it *would* do without writing.
Pass `apply=True` to actually perform the deletes/repoints inside one
transaction.
"""
from __future__ import annotations

import sqlite3
from dataclasses import dataclass, field

# Prefix priority: lower index = preferred as canonical when doc_type ties.
PREFIX_PRIORITY = ["md", "mc", "sc", "amd", "gn", "nt"]

DOC_ID_TABLES = ["clauses", "document_revisions", "requirements", "md_categories"]


def _prefix(doc_id: str) -> str:
    parts = doc_id.split(":")
    return parts[1] if len(parts) > 1 else ""


def _prefix_rank(doc_id: str) -> int:
    p = _prefix(doc_id)
    return PREFIX_PRIORITY.index(p) if p in PREFIX_PRIORITY else len(PREFIX_PRIORITY)


def choose_canonical(rows: list[sqlite3.Row]) -> str:
    """Pick the canonical id among a duplicate group."""
    def key(r: sqlite3.Row) -> tuple[int, int, str]:
        is_md = 0 if r["doc_type"] in ("master_direction", "master_circular") else 1
        return (is_md, _prefix_rank(r["id"]), r["id"])
    return sorted(rows, key=key)[0]["id"]


@dataclass
class DedupeStats:
    groups_found: int = 0
    duplicate_rows: int = 0
    relations_repointed: int = 0
    relations_dropped_self: int = 0
    relations_dropped_exact_dupe: int = 0
    child_rows_deleted: dict[str, int] = field(default_factory=dict)
    documents_deleted: int = 0
    examples: list[dict] = field(default_factory=list)


def find_duplicate_groups(conn: sqlite3.Connection) -> list[list[sqlite3.Row]]:
    rows = conn.execute("SELECT id, title, date, doc_type FROM documents").fetchall()
    groups: dict[tuple[str, str], list[sqlite3.Row]] = {}
    for r in rows:
        key = ((r["title"] or "").strip(), r["date"] or "")
        groups.setdefault(key, []).append(r)
    return [v for v in groups.values() if len(v) > 1]


def run(conn: sqlite3.Connection, apply: bool = False, verbose: bool = True) -> DedupeStats:
    stats = DedupeStats()
    groups = find_duplicate_groups(conn)
    stats.groups_found = len(groups)

    for group in groups:
        canonical = choose_canonical(group)
        dupes = [r["id"] for r in group if r["id"] != canonical]
        stats.duplicate_rows += len(dupes)
        if len(stats.examples) < 10:
            stats.examples.append({
                "title": group[0]["title"],
                "date": group[0]["date"],
                "canonical": canonical,
                "dropped": dupes,
            })

        if not apply:
            continue

        for dup_id in dupes:
            for table in DOC_ID_TABLES:
                cur = conn.execute(f"DELETE FROM {table} WHERE doc_id = ?", (dup_id,))
                stats.child_rows_deleted[table] = stats.child_rows_deleted.get(table, 0) + cur.rowcount

            # OR IGNORE: relations has a UNIQUE(src_id, rel_type, dst_id, dst_ref_text)
            # index, so repointing can collide with an edge the canonical id
            # already has. IGNORE just drops the now-redundant duplicate row
            # instead of erroring; the exact-dupe sweep below cleans up any
            # that INSERT-level dedup didn't already resolve.
            conn.execute("UPDATE OR IGNORE relations SET src_id = ? WHERE src_id = ?", (canonical, dup_id))
            conn.execute("UPDATE OR IGNORE relations SET dst_id = ? WHERE dst_id = ?", (canonical, dup_id))
            # Anything left still pointing at the duplicate id lost the race
            # against the unique index above and must be removed explicitly.
            conn.execute("DELETE FROM relations WHERE src_id = ? OR dst_id = ?", (dup_id, dup_id))

        # Drop edges that became self-referential after repointing.
        cur = conn.execute("DELETE FROM relations WHERE src_id = dst_id")
        stats.relations_dropped_self += cur.rowcount

        # Drop exact-duplicate relation rows left behind by repointing two
        # different original edges onto the same (src, dst, rel_type) triple.
        cur = conn.execute(
            """
            DELETE FROM relations
            WHERE rowid NOT IN (
              SELECT MIN(rowid) FROM relations
              GROUP BY src_id, dst_id, rel_type
            )
            """
        )
        stats.relations_dropped_exact_dupe += cur.rowcount

        for dup_id in dupes:
            cur = conn.execute("DELETE FROM documents WHERE id = ?", (dup_id,))
            stats.documents_deleted += cur.rowcount

    if apply:
        conn.commit()

    if verbose:
        mode = "APPLIED" if apply else "DRY RUN"
        print(f"[dedupe] {mode}")
        print(f"  duplicate groups found : {stats.groups_found}")
        print(f"  duplicate rows         : {stats.duplicate_rows}"
              f"{'' if apply else '  (would be removed)'}")
        if apply:
            print(f"  documents deleted      : {stats.documents_deleted}")
            print(f"  relations dropped (self-ref)   : {stats.relations_dropped_self}")
            print(f"  relations dropped (exact dupe) : {stats.relations_dropped_exact_dupe}")
            for t, n in stats.child_rows_deleted.items():
                print(f"  {t:<20} rows deleted : {n}")
        print("  sample groups:")
        for ex in stats.examples:
            print(f"    {ex['date']} · {ex['title'][:70]}")
            print(f"      keep:  {ex['canonical']}")
            print(f"      drop:  {', '.join(ex['dropped'])}")
        if not apply:
            print()
            print("  Nothing was changed. Re-run with --apply to perform the cleanup,")
            print("  then run `python rbi.py relations` to re-derive document status.")

    return stats
