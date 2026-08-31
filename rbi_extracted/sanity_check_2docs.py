"""
Sanity-check 2 of the top clause-count-gain documents after the chunking
fix: rbi:md:13140 (Responsible Business Conduct, +428) and rbi:md:13156
(Credit Facilities, +348). Prints pdf_url plus every clause label (label
only, not full text — too long) so we can spot-check structure against the
real PDF.

Usage:
    python sanity_check_2docs.py
"""
import os
import sqlite3

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
DOC_IDS = ["rbi:md:13140", "rbi:md:13156"]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    for doc_id in DOC_IDS:
        row = conn.execute(
            "SELECT title, pdf_url FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()
        if not row:
            print(f"[warn] {doc_id} not found")
            continue

        print(f"\n{'=' * 100}")
        print(f"DOC: {row['title']}")
        print(f"ID:  {doc_id}")
        print(f"pdf_url: {row['pdf_url']}")
        print("=" * 100)

        clauses = conn.execute(
            "SELECT clause_label, chapter, seq, needs_review "
            "FROM clauses WHERE doc_id = ? ORDER BY seq",
            (doc_id,),
        ).fetchall()
        print(f"Total clauses: {len(clauses)}\n")
        for c in clauses:
            flag = " [NEEDS REVIEW]" if c["needs_review"] else ""
            print(f"  [{c['seq']:>4}] {c['clause_label']}{flag}")

    conn.close()


if __name__ == "__main__":
    main()
