"""
Runs `rbi.py extract <doc_id>` for Master Directions only, one doc at a time.
Skips Master Circulars, Circulars, Notifications, etc.

Usage (pass through any extract flags after --):
  python extract_mds_only.py
  python extract_mds_only.py --provider gemini --sleep 2
  python extract_mds_only.py --limit 5      # test batch per doc

Ctrl+C is safe to stop between docs.
"""
import os
import sqlite3
import subprocess
import sys
from pathlib import Path

def get_db_path():
    env = os.environ.get("RBI_INTEL_DB")
    if env:
        return env
    return str(Path.home() / ".rbi-intel" / "regdata.db")

def get_md_doc_ids():
    db_path = get_db_path()
    if not Path(db_path).exists():
        print(f"!! DB not found at {db_path}")
        sys.exit(1)
    conn = sqlite3.connect(db_path)
    rows = conn.execute(
        "SELECT id FROM documents WHERE doc_type = 'master_direction' ORDER BY id"
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]

def main():
    extra_args = sys.argv[1:]  # forwarded straight to `rbi.py extract`
    doc_ids = get_md_doc_ids()
    if not doc_ids:
        print("!! No documents found with doc_type = 'master_direction'. Check the value with:")
        print("   sqlite3 <db> \"SELECT DISTINCT doc_type FROM documents\"")
        sys.exit(1)

    print(f"Found {len(doc_ids)} Master Directions. Extracting one at a time...\n")

    for i, doc_id in enumerate(doc_ids, 1):
        print(f"=== [{i}/{len(doc_ids)}] {doc_id} ===")
        cmd = [sys.executable, "rbi.py", "extract", doc_id] + extra_args
        result = subprocess.run(cmd)
        if result.returncode != 0:
            print(f"!! extract failed on {doc_id} (exit {result.returncode}). Stopping so you can check it.")
            sys.exit(result.returncode)

    print("\nDone — all Master Directions processed.")

if __name__ == "__main__":
    main()
