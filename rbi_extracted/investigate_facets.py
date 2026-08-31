import sqlite3, os
from collections import Counter

c = sqlite3.connect(os.path.expanduser(r"~\.rbi-intel\regdata.db"))
c.row_factory = sqlite3.Row

# 1. Cross-Institution / Generic sample titles
rows = c.execute(
    "SELECT title FROM documents WHERE institution_type = 'Cross-Institution / Generic' ORDER BY date DESC"
).fetchall()
print(f"Total 'Cross-Institution / Generic': {len(rows)}\n")
print("=== Sample titles (first 30) ===")
for r in rows[:30]:
    print(" ", r["title"])

# 2. Category value counts (to find "Amendment by DOR" and see full list)
print("\n=== Category value counts ===")
cats = c.execute(
    "SELECT category, COUNT(*) AS n FROM documents WHERE category IS NOT NULL "
    "GROUP BY category ORDER BY n DESC"
).fetchall()
for r in cats:
    print(f"  {r['n']:>4}  {r['category']}")
