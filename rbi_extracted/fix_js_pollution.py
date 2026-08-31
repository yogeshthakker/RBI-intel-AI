"""
Delete the 3 JS-polluted documents from the DB.
IDs: rbi:mc:_did_334, rbi:mc:_370, rbi:mc:_386
(category-index pages mistakenly stored as documents before the ?did= skip was added)
"""
import sqlite3, os, sys

DB_PATH = os.environ.get("RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db"))
print(f"DB: {DB_PATH}")
con = sqlite3.connect(DB_PATH)
cur = con.cursor()

# Auto-detect polluted docs: body is huge JS/HTML, not real regulatory text
cur.execute("""
    SELECT id, title, length(body) as blen FROM documents
    WHERE body LIKE '%function%'
      AND body LIKE '%var %'
      AND body LIKE '%<script%'
      AND length(body) > 30000
    ORDER BY blen DESC
""")
rows = cur.fetchall()
if not rows:
    print("No JS-polluted documents found. Nothing to do.")
    sys.exit(0)

BAD_IDS = []
print("Polluted documents detected:")
for doc_id, title, blen in rows:
    print(f"  {doc_id} | body_len={blen} | {title[:60]}")
    BAD_IDS.append(doc_id)

print("\nProceed with deletion? [y/N]: ", end="")
if input().strip().lower() != "y":
    print("Aborted.")
    sys.exit(0)

tables = ["clauses", "documents_fts", "document_revisions", "documents"]
for doc_id in BAD_IDS:
    for table in tables:
        if table == "documents_fts":
            cur.execute(f"DELETE FROM {table} WHERE id=?", (doc_id,))
        elif table == "clauses":
            cur.execute(f"DELETE FROM {table} WHERE doc_id=?", (doc_id,))
        elif table == "document_revisions":
            cur.execute(f"DELETE FROM {table} WHERE doc_id=?", (doc_id,))
        else:
            cur.execute(f"DELETE FROM {table} WHERE id=?", (doc_id,))
        print(f"  Deleted from {table}: {cur.rowcount} row(s)")

con.commit()
con.close()
print("\nDone. Run `python rbi.py validate` to confirm.")
