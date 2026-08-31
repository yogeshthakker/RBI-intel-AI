import sqlite3, os, re
from collections import Counter

c = sqlite3.connect(os.path.expanduser(r"~\.rbi-intel\regdata.db"))
rows = c.execute(
    "SELECT title FROM documents WHERE primary_topic = 'Unclassified' ORDER BY date DESC"
).fetchall()

print(f"Total unclassified: {len(rows)}\n")

# Pull out the "subject" between the institution-name parenthesis and the
# trailing "Directions/Guidelines, YYYY" — e.g.
#   "Reserve Bank of India (Commercial Banks - Statutory Audit) Directions, 2026"
#   -> subject = "Statutory Audit"
RE_SUBJECT = re.compile(
    r"\(([^)]+)\)\s*(?:Supervisory\s+)?(?:Directions|Guidelines)",
    re.I,
)

subjects = Counter()
unmatched = []
for (title,) in rows:
    m = RE_SUBJECT.search(title or "")
    if not m:
        unmatched.append(title)
        continue
    inside = m.group(1)
    # inside is like "Commercial Banks - Statutory Audit" or "Commercial Banks – Statutory Audit"
    parts = re.split(r"[-–—]", inside, maxsplit=1)
    subject = parts[1].strip() if len(parts) > 1 else inside.strip()
    subjects[subject] += 1

print("=== Subject frequency (institution name stripped) ===")
for subject, n in subjects.most_common(60):
    print(f"  {n:>4}  {subject}")

print(f"\n=== {len(unmatched)} titles that didn't match the subject pattern (showing first 20) ===")
for t in unmatched[:20]:
    print(" ", t)
