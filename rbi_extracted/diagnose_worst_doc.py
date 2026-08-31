"""
Diagnose why rbi:md:10202 has only 17.2% clause-text coverage — the worst
in the whole database. Prints the full processed source text (after
trim_front_matter + markdown-strip, exactly what the chunker sees) next to
every clause it actually produced, so we can see exactly what's being lost.

Usage:
    python diagnose_worst_doc.py
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
DOC_ID = "rbi:md:10202"


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    row = conn.execute("SELECT title, body FROM documents WHERE id = ?", (DOC_ID,)).fetchone()
    if not row:
        raise SystemExit(f"No document found with id {DOC_ID}")

    print(f"DOC: {row['title']}\n")
    body = row["body"] or ""
    print(f"Raw body length: {len(body)}\n")

    processed = chunk_mod.normalise_breaks(
        chunk_mod.trim_front_matter(chunk_mod.strip_markdown(body))
    )
    print(f"Processed (post-trim) length: {len(processed)}\n")
    print("=" * 100)
    print("FULL PROCESSED TEXT (what the chunker actually sees):")
    print("=" * 100)
    print(processed)

    print(f"\n{'=' * 100}")
    print("CLAUSES ACTUALLY PRODUCED:")
    print("=" * 100)
    clauses = conn.execute(
        "SELECT clause_label, chapter, seq, text, needs_review "
        "FROM clauses WHERE doc_id = ? ORDER BY seq",
        (DOC_ID,),
    ).fetchall()
    for c in clauses:
        flag = " [NEEDS REVIEW]" if c["needs_review"] else ""
        print(f"\n--- Clause {c['clause_label']}{flag} ---")
        print(c["text"])

    conn.close()


if __name__ == "__main__":
    main()
