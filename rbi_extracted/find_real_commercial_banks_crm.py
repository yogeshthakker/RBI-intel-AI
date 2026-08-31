"""
Find the actual "(Commercial Banks - Credit Risk Management) Directions"
document in the DB — distinct from the NBFC one we accidentally grabbed
earlier — and show its id, title, institution_type, and status so we can
confirm before re-downloading.

Usage:
    python find_real_commercial_banks_crm.py
"""
import os
import sqlite3
from pathlib import Path

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, title, institution_type, status, "
        "COALESCE(applicability_override, applicability) AS effective_applic, pdf_url "
        "FROM documents WHERE title LIKE '%Credit Risk Management%' ORDER BY date DESC"
    ).fetchall()

    if not rows:
        print("No documents found with 'Credit Risk Management' in the title at all.")
        return

    print(f"Found {len(rows)} document(s) with 'Credit Risk Management' in the title:\n")
    for r in rows:
        print(f"id={r['id']}")
        print(f"  title:            {r['title']}")
        print(f"  institution_type: {r['institution_type']}")
        print(f"  status:           {r['status']}")
        print(f"  applicability:    {r['effective_applic']}")
        print(f"  pdf_url:          {r['pdf_url']}")
        print()

    conn.close()


if __name__ == "__main__":
    main()
