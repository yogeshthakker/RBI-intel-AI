"""
Chunk rbi:md:13153 (the real "Commercial Banks - Credit Risk Management
Directions, 2025") and print every clause, full text, for manual review.

Usage:
    python show_clauses_13153.py
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
DOC_ID = "rbi:md:13153"


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    row = conn.execute("SELECT title, status FROM documents WHERE id = ?", (DOC_ID,)).fetchone()
    if not row:
        raise SystemExit(f"No document found with id {DOC_ID}.")
    print(f"DOC: {row['title']}")
    print(f"status in DB: {row['status']}\n")

    result = chunk_mod.chunk_document(conn, DOC_ID)
    print(f"[chunk] {result['clauses']} clause(s), {result['needs_review']} flagged needs_review\n")

    rows = conn.execute(
        "SELECT clause_label, chapter, seq, text, needs_review "
        "FROM clauses WHERE doc_id = ? ORDER BY seq",
        (DOC_ID,),
    ).fetchall()

    for r in rows:
        flag = " [NEEDS REVIEW]" if r["needs_review"] else ""
        chapter = f" ({r['chapter']})" if r["chapter"] else ""
        print(f"\n--- Clause {r['clause_label']}{chapter}{flag} ---")
        print((r["text"] or "").strip())

    print(f"\n\nTotal: {len(rows)} clause(s).")
    conn.close()


if __name__ == "__main__":
    main()
