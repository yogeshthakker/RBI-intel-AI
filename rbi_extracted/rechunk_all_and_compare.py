"""
Re-chunk every document that `python rbi.py chunk --all-master-directions`
would touch, using the SAME selection criteria, and report the before/after
clause-count delta per document — to measure how many documents were
affected by the "escaped period" chunking bug fixed in chunk.py.

Usage:
    python rechunk_all_and_compare.py
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

# WIDENED scope: ALL master_direction/master_circular docs with real body
# text, no applicability filter. Chunking is regex-only (no AI cost), so a
# chunking bug affects "Not Applicable" docs identically — this audit checks
# all ~437, not just the 154 the production extract pipeline touches.
SELECT_SQL = """
    SELECT id FROM documents WHERE doc_type IN ('master_direction','master_circular')
    AND body IS NOT NULL AND LENGTH(body) > 2000
"""


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    doc_ids = [r["id"] for r in conn.execute(SELECT_SQL).fetchall()]
    print(f"Re-chunking {len(doc_ids)} document(s)...\n")

    before_counts = {}
    for doc_id in doc_ids:
        n = conn.execute("SELECT COUNT(*) FROM clauses WHERE doc_id = ?", (doc_id,)).fetchone()[0]
        before_counts[doc_id] = n

    changed = []
    total_before = 0
    total_after = 0
    errors = 0

    for i, doc_id in enumerate(doc_ids, start=1):
        try:
            result = chunk_mod.chunk_document(conn, doc_id)
        except Exception as e:
            errors += 1
            print(f"[{i}/{len(doc_ids)}] ERROR on {doc_id}: {e}")
            continue

        after_n = result["clauses"]
        before_n = before_counts.get(doc_id, 0)
        total_before += before_n
        total_after += after_n

        if after_n != before_n:
            changed.append((doc_id, result["title"], before_n, after_n))

        if i % 100 == 0:
            print(f"  ...{i}/{len(doc_ids)} done")

    print(f"\n{'=' * 100}")
    print(f"Documents processed:     {len(doc_ids)}")
    print(f"Errors:                  {errors}")
    print(f"Total clauses BEFORE:    {total_before}")
    print(f"Total clauses AFTER:     {total_after}")
    print(f"Net change:              {total_after - total_before:+d}")
    print(f"Documents with a CHANGED clause count: {len(changed)}")
    print("=" * 100)

    if changed:
        changed.sort(key=lambda x: x[3] - x[2], reverse=True)
        print("\nTop 20 documents by clause-count increase:")
        for doc_id, title, before_n, after_n in changed[:20]:
            print(f"  {before_n:>4} -> {after_n:<4}  ({after_n - before_n:+d})  {doc_id}  {title[:80]}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
