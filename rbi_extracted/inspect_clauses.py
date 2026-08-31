"""
Chunk the 3 test MDs (if not already chunked) and print every clause so you
can manually eyeball the breakdown before trusting `extract` on top of it.

Uses the same rbi_intel.chunk.chunk_document() function the real
`python rbi.py chunk` command calls, so results match exactly what the
pipeline would produce — this script just also prints the clauses instead of
only a summary count.

Usage:
    python inspect_clauses.py
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

# Distinctive substrings identifying the 3 test documents.
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


def main():
    if not Path(DB_PATH).is_file():
        raise SystemExit(f"Database not found at {DB_PATH}. Set RBI_INTEL_DB if it's elsewhere.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    docs = find_doc_ids(conn)

    if not docs:
        raise SystemExit("None of the 3 test documents were found in the database.")

    for doc in docs:
        print(f"\n{'=' * 100}")
        print(f"DOC: {doc['title']}")
        print(f"ID:  {doc['id']}")
        print("=" * 100)

        result = chunk_mod.chunk_document(conn, doc["id"])
        print(f"[chunk] {result['clauses']} clause(s), {result['needs_review']} flagged needs_review")

        rows = conn.execute(
            "SELECT clause_label, chapter, seq, text, needs_review "
            "FROM clauses WHERE doc_id = ? ORDER BY seq",
            (doc["id"],),
        ).fetchall()

        for r in rows:
            flag = " [NEEDS REVIEW]" if r["needs_review"] else ""
            chapter = f" ({r['chapter']})" if r["chapter"] else ""
            preview = (r["text"] or "").strip().replace("\n", " ")
            if len(preview) > 220:
                preview = preview[:220] + "…"
            print(f"\n  Clause {r['clause_label']}{chapter}{flag}")
            print(f"    {preview}")

    conn.close()
    print(f"\n{'=' * 100}\nDone. Review the clauses above for correctness.")


if __name__ == "__main__":
    main()
