"""
For the 3 test MDs specifically: snapshot the clauses ALREADY in the
database, re-run chunk_document() (the same function `python rbi.py chunk`
calls) on each, then compare the fresh output to the snapshot to confirm
chunking is consistent (deterministic) — same clause count, same labels in
the same order, same text per clause.

Usage:
    python verify_chunk_consistency.py
"""
import os
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "python"))

from rbi_intel import chunk as chunk_mod  # noqa: E402

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)

TITLE_SUBSTRINGS = [
    "Prudential Norms on Capital Adequacy) Directions, 2025",
    "Credit Risk Management) Directions, 2025",
    "Cybersecurity, Technology",
]


def find_doc_ids(conn: sqlite3.Connection) -> list[dict]:
    docs = []
    for sub in TITLE_SUBSTRINGS:
        row = conn.execute(
            "SELECT id, title FROM documents WHERE title LIKE ? ORDER BY date DESC LIMIT 1",
            (f"%{sub}%",),
        ).fetchone()
        if row:
            docs.append({"id": row[0], "title": row[1]})
        else:
            print(f"[warn] no document found matching: {sub}")
    return docs


def fetch_clauses(conn: sqlite3.Connection, doc_id: str) -> list[dict]:
    rows = conn.execute(
        "SELECT clause_label, chapter, seq, text, needs_review "
        "FROM clauses WHERE doc_id = ? ORDER BY seq",
        (doc_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def compare(before: list[dict], after: list[dict]) -> list[str]:
    problems = []
    if len(before) != len(after):
        problems.append(f"clause COUNT changed: {len(before)} -> {len(after)}")

    before_by_label = {b["clause_label"]: b for b in before}
    after_by_label = {a["clause_label"]: a for a in after}

    missing = set(before_by_label) - set(after_by_label)
    added = set(after_by_label) - set(before_by_label)
    if missing:
        problems.append(f"labels present BEFORE but missing AFTER: {sorted(missing)}")
    if added:
        problems.append(f"labels present AFTER but not BEFORE: {sorted(added)}")

    for label in sorted(set(before_by_label) & set(after_by_label)):
        b, a = before_by_label[label], after_by_label[label]
        if b["text"] != a["text"]:
            problems.append(f"clause {label}: TEXT differs (len {len(b['text'] or '')} -> {len(a['text'] or '')})")
        if b["chapter"] != a["chapter"]:
            problems.append(f"clause {label}: chapter differs ({b['chapter']!r} -> {a['chapter']!r})")
        if bool(b["needs_review"]) != bool(a["needs_review"]):
            problems.append(f"clause {label}: needs_review differs ({b['needs_review']} -> {a['needs_review']})")

    order_before = [b["clause_label"] for b in before]
    order_after = [a["clause_label"] for a in after]
    common = [l for l in order_before if l in after_by_label]
    common_after = [l for l in order_after if l in before_by_label]
    if common != common_after:
        problems.append("clause ORDER differs for labels common to both runs")

    return problems


def main():
    if not Path(DB_PATH).is_file():
        raise SystemExit(f"Database not found at {DB_PATH}. Set RBI_INTEL_DB if it's elsewhere.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    docs = find_doc_ids(conn)

    if not docs:
        raise SystemExit("None of the 3 test documents were found in the database.")

    any_problem = False
    for doc in docs:
        print(f"\n{'=' * 100}")
        print(f"DOC: {doc['title']}")
        print(f"ID:  {doc['id']}")
        print("=" * 100)

        before = fetch_clauses(conn, doc["id"])
        print(f"[before] {len(before)} clause(s) already in DB")

        result = chunk_mod.chunk_document(conn, doc["id"])
        after = fetch_clauses(conn, doc["id"])
        print(f"[after]  {len(after)} clause(s) after re-chunking "
              f"({result['needs_review']} flagged needs_review)")

        problems = compare(before, after)
        if problems:
            any_problem = True
            print(f"\n  MISMATCH ({len(problems)} issue(s)):")
            for p in problems:
                print(f"    - {p}")
        else:
            print("\n  MATCH — re-chunking produced identical clauses (consistent).")

    print(f"\n{'=' * 100}")
    if any_problem:
        print("RESULT: at least one document's chunking was NOT consistent — see mismatches above.")
    else:
        print("RESULT: all 3 documents re-chunked identically. Chunking is consistent.")


if __name__ == "__main__":
    main()
