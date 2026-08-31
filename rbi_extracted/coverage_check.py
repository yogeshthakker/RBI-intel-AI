"""
Coverage check: for every chunked document, compare the total character
length of its clause text against the source text AFTER the intentional
trim_front_matter/markdown-strip step (not the raw body — ToC and preamble
are deliberately dropped, that's not data loss).

ratio = sum(len(clause.text)) / len(processed_source_text) * 100

A ratio near 100% is expected (a few points lost to short structural lines
like "Chapter I - Preliminary" that never become clause text). A ratio well
below that is a real signal that content is being silently dropped —
exactly the kind of bug just fixed twice in chunk.py. This script doesn't
fix anything; it just measures, so we can pick a sensible alert threshold
from real numbers instead of guessing.

Usage:
    python coverage_check.py
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

# WIDENED: all MD/MC with real body, no applicability filter (see
# rechunk_all_and_compare.py for why).
SELECT_SQL = """
    SELECT id, title, body FROM documents WHERE doc_type IN ('master_direction','master_circular')
    AND body IS NOT NULL AND LENGTH(body) > 2000
"""


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    rows = conn.execute(SELECT_SQL).fetchall()
    print(f"Checking {len(rows)} document(s)...\n")

    results = []
    for row in rows:
        doc_id = row["id"]
        body = row["body"] or ""
        processed = chunk_mod.normalise_breaks(
            chunk_mod.trim_front_matter(chunk_mod.strip_markdown(body))
        )
        source_len = len(processed)

        clause_rows = conn.execute(
            "SELECT text FROM clauses WHERE doc_id = ?", (doc_id,)
        ).fetchall()
        clause_len = sum(len(c["text"] or "") for c in clause_rows)

        ratio = (clause_len / source_len * 100) if source_len else 0.0
        results.append((doc_id, row["title"], source_len, clause_len, ratio))

    results.sort(key=lambda r: r[4])  # worst ratio first

    ratios = [r[4] for r in results]
    print(f"{'=' * 100}")
    print(f"Documents checked: {len(results)}")
    print(f"Average coverage ratio: {sum(ratios)/len(ratios):.1f}%")
    print(f"Median coverage ratio:  {sorted(ratios)[len(ratios)//2]:.1f}%")
    print(f"Worst ratio: {ratios[0]:.1f}%   Best ratio: {ratios[-1]:.1f}%")
    print("=" * 100)

    print("\nWorst 25 documents by coverage ratio (lowest = most suspicious):")
    for doc_id, title, source_len, clause_len, ratio in results[:25]:
        print(f"  {ratio:5.1f}%  ({clause_len:>6}/{source_len:<6} chars)  {doc_id}  {title[:70]}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
