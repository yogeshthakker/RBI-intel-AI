"""
Print the first ~4000 characters of documents.body for rbi:md:13153 so we can
see exactly how "Introduction", "Chapter I - Preliminary", and clauses 1-3
are actually represented in the stored text (Markdown from the HTML scrape,
not the PDF's visual layout) — needed to diagnose why the chunker drops them.

Usage:
    python dump_body_start.py
"""
import os
import sqlite3

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
DOC_ID = "rbi:md:13153"


def main():
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT body FROM documents WHERE id = ?", (DOC_ID,)).fetchone()
    if not row or not row[0]:
        raise SystemExit(f"No body found for {DOC_ID}")
    body = row[0]
    print(f"Total body length: {len(body)}\n")
    print("=" * 100)
    print("FIRST 4000 CHARACTERS (repr'd so whitespace/newlines are visible):")
    print("=" * 100)
    print(repr(body[:4000]))
    conn.close()


if __name__ == "__main__":
    main()
