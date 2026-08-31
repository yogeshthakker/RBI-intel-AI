"""
Two things:
1. Count ALL master_direction/master_circular documents (no applicability
   filter) vs. the 154 that --all-master-directions / coverage_check.py
   actually covers, to see how many are excluded and why.
2. Scan for "old cover-letter format" documents — the "To, / All ... /
   Madam/Sir, / <unnumbered intro>, / 2. ..." style (like rbi:md:10202) —
   by looking for the salutation markers directly in body text, across
   ALL master_direction/master_circular docs regardless of applicability.

Usage:
    python scan_old_format_docs.py
"""
import os
import re
import sqlite3

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)

SALUTATION_RE = re.compile(
    r"(Madam\s*/\s*Sir|Dear\s+(Sir|Madam)|Madam\s*,?\s*$)", re.I | re.M
)


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    total_all = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE doc_type IN ('master_direction','master_circular')"
    ).fetchone()[0]

    total_in_scope = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE doc_type IN ('master_direction','master_circular') "
        "AND body IS NOT NULL AND LENGTH(body) > 2000 "
        "AND COALESCE(applicability_override, applicability, 'Likely Applicable') <> 'Not Applicable'"
    ).fetchone()[0]

    excluded_no_body = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE doc_type IN ('master_direction','master_circular') "
        "AND (body IS NULL OR LENGTH(body) <= 2000)"
    ).fetchone()[0]

    excluded_not_applicable = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE doc_type IN ('master_direction','master_circular') "
        "AND body IS NOT NULL AND LENGTH(body) > 2000 "
        "AND COALESCE(applicability_override, applicability, 'Likely Applicable') = 'Not Applicable'"
    ).fetchone()[0]

    print("=" * 100)
    print("SCOPE: why 154, not all MD/MC")
    print("=" * 100)
    print(f"Total master_direction/master_circular documents: {total_all}")
    print(f"  Excluded — no/short body (<=2000 chars):         {excluded_no_body}")
    print(f"  Excluded — effective applicability = Not Applicable: {excluded_not_applicable}")
    print(f"  In scope (what --all-master-directions covers):  {total_in_scope}")
    print()
    print("The applicability filter is deliberate (see __main__.py comment): it keeps")
    print("documents irrelevant to Sber India out of the AI-backed extract/scaffold")
    print("pipeline. But chunking itself is a pure regex/offline step with no AI cost —")
    print("it doesn't need to respect that filter, and a chunking bug would affect")
    print("'Not Applicable' docs identically. Worth widening the AUDIT (not the")
    print("production extract scope) to every MD/MC with real body text.")

    print(f"\n{'=' * 100}")
    print("OLD COVER-LETTER FORMAT SCAN (all MD/MC, no applicability filter)")
    print("=" * 100)
    rows = conn.execute(
        "SELECT id, title, body FROM documents WHERE doc_type IN ('master_direction','master_circular') "
        "AND body IS NOT NULL AND LENGTH(body) > 200"
    ).fetchall()

    old_format = []
    for row in rows:
        # Only check the first ~1500 chars — the salutation, if present, is
        # always near the top, right after the reference number/date block.
        head = row["body"][:1500]
        if SALUTATION_RE.search(head):
            old_format.append((row["id"], row["title"]))

    print(f"Checked {len(rows)} documents with body text.")
    print(f"Old cover-letter-format documents found: {len(old_format)}\n")
    for doc_id, title in old_format:
        print(f"  {doc_id}  {title[:90]}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
