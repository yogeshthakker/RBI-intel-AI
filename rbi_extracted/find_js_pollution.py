"""
Find rows in the DB whose title/body (or other text columns) contain leaked
JavaScript from the RBI site's "floating TOP link" widget — a scraping bug
where inline <script> text got captured as part of a link's text content.

Usage:
    python find_js_pollution.py
"""
import os
import sqlite3

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)

MARKER = "floating TOP link"


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    tables = [r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()]
    print(f"Tables in DB: {tables}\n")

    for table in tables:
        cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
        text_cols = [c for c in cols if c.lower() in
                     ("title", "body", "name", "text", "description", "subject")]
        if not text_cols:
            continue
        for col in text_cols:
            try:
                rows = conn.execute(
                    f"SELECT COUNT(*) FROM {table} WHERE {col} LIKE ?",
                    (f"%{MARKER}%",),
                ).fetchone()[0]
            except sqlite3.OperationalError:
                continue
            if rows:
                print(f"{table}.{col}: {rows} row(s) contain {MARKER!r}")
                sample = conn.execute(
                    f"SELECT * FROM {table} WHERE {col} LIKE ? LIMIT 3",
                    (f"%{MARKER}%",),
                ).fetchall()
                for s in sample:
                    print(f"  {dict(s)}")
                print()

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
