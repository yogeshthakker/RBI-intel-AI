"""
Print every clause (full text, not truncated) for the Credit Risk Management
test document (rbi:md:12954).

Usage:
    python show_credit_risk_clauses.py
"""
import os
import sqlite3
from pathlib import Path

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
DOC_ID = "rbi:md:12954"


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT clause_label, chapter, seq, text, needs_review "
        "FROM clauses WHERE doc_id = ? ORDER BY seq",
        (DOC_ID,),
    ).fetchall()

    if not rows:
        raise SystemExit(f"No clauses found for {DOC_ID} — run chunk on it first.")

    for r in rows:
        flag = " [NEEDS REVIEW]" if r["needs_review"] else ""
        chapter = f" ({r['chapter']})" if r["chapter"] else ""
        print(f"\n--- Clause {r['clause_label']}{chapter}{flag} ---")
        print((r["text"] or "").strip())

    print(f"\n\nTotal: {len(rows)} clause(s).")
    conn.close()


if __name__ == "__main__":
    main()
