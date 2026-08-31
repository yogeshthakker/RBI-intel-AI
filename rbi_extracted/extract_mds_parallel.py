"""
Parallel version of extract_mds_only.py — runs `rbi.py extract <doc_id>`
for Master Directions only, several docs at a time.

Usage:
  python extract_mds_parallel.py
  python extract_mds_parallel.py --workers 4
  python extract_mds_parallel.py --workers 4 --limit 5      # test batch per doc
  python extract_mds_parallel.py --workers 3 --provider gemini --sleep 2

Any flag NOT recognized here (--limit, --provider, --sleep, --force,
--include-flagged) is passed straight through to `rbi.py extract`.

Safe to Ctrl+C between docs. Failed docs are reported at the end, not fatal
to the rest of the batch (unlike the sequential version).
"""
import argparse
import os
import sqlite3
import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

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

def run_one(doc_id, extra_args):
    cmd = [sys.executable, "rbi.py", "extract", doc_id] + extra_args
    result = subprocess.run(cmd, capture_output=True, text=True)
    return doc_id, result.returncode, result.stdout[-2000:], result.stderr[-2000:]

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--workers", type=int, default=3, help="concurrent docs at a time (default 3, safe for paid tier)")
    args, extra_args = p.parse_known_args()

    doc_ids = get_md_doc_ids()
    if not doc_ids:
        print("!! No documents found with doc_type = 'master_direction'.")
        sys.exit(1)

    print(f"Found {len(doc_ids)} Master Directions. Running with {args.workers} parallel workers...\n")

    failures = []
    done = 0

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(run_one, doc_id, extra_args): doc_id for doc_id in doc_ids}
        for future in as_completed(futures):
            doc_id, rc, out, err = future.result()
            done += 1
            status = "OK" if rc == 0 else "FAILED"
            print(f"[{done}/{len(doc_ids)}] {doc_id} -> {status}")
            if rc != 0:
                failures.append((doc_id, err.strip().splitlines()[-1] if err.strip() else "(no stderr)"))

    print("\n=== DONE ===")
    print(f"{len(doc_ids) - len(failures)}/{len(doc_ids)} succeeded")
    if failures:
        print(f"{len(failures)} failed:")
        for doc_id, last_line in failures:
            print(f"  {doc_id}: {last_line}")
        print("\nRe-run this script again — it's safe, docs already fully extracted are skipped by rbi.py's own dedupe logic (unless you passed --force).")

if __name__ == "__main__":
    main()
