import sqlite3, os

c = sqlite3.connect(os.path.expanduser(r"~\.rbi-intel\regdata.db"))
rows = c.execute(
    "SELECT title FROM documents WHERE primary_topic = 'Unclassified' ORDER BY date DESC"
).fetchall()

out_path = "unclassified_all.txt"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(f"Total unclassified: {len(rows)}\n\n")
    for (title,) in rows:
        f.write((title or "") + "\n")

print(f"Wrote {len(rows)} titles to {out_path}")
