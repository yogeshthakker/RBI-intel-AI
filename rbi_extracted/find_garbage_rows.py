import sqlite3, os

c = sqlite3.connect(os.path.expanduser(r"~\.rbi-intel\regdata.db"))
c.row_factory = sqlite3.Row

titles = [
    "Banker and Debt Manager to Government",
    "Banker to Banks",
    "Banker to Governments and Banks",
    "Co-operative Banking",
    "Commercial Banking",
    "Financial Market",
    "Issuer of Currency",
    "Non-banking",
    "Payment and Settlement System",
]

for t in titles:
    rows = c.execute(
        "SELECT id, title, doc_type, date, category, source_url, pdf_url, status FROM documents WHERE title = ?",
        (t,),
    ).fetchall()
    print(f"\n=== '{t}' ({len(rows)} row(s)) ===")
    for r in rows:
        print(dict(r))
