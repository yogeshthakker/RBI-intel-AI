"""
Find the exact raw text around the spurious chapter-tag jump in rbi:md:13140
and rbi:md:13156 (e.g. "CHI...CHVIII...CHII" or "CHI...CHIV...CHII") to
confirm whether an inline cross-reference like "...in Chapter VIII of these
Directions..." is being misread as a real chapter heading.

Usage:
    python find_chapter_anomaly.py
"""
import os
import re
import sys
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "python"))

from rbi_intel import chunk as chunk_mod  # noqa: E402

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
DOC_IDS = ["rbi:md:13140", "rbi:md:13156"]


def main():
    conn = sqlite3.connect(DB_PATH)
    for doc_id in DOC_IDS:
        row = conn.execute("SELECT body FROM documents WHERE id = ?", (doc_id,)).fetchone()
        if not row or not row[0]:
            print(f"[warn] no body for {doc_id}")
            continue

        processed = chunk_mod.normalise_breaks(
            chunk_mod.trim_front_matter(chunk_mod.strip_markdown(row[0]))
        )
        lines = processed.splitlines()

        print(f"\n{'=' * 100}\nDOC: {doc_id}\n{'=' * 100}")

        # Find every line that matches the CHAPTER pattern, with context.
        for i, line in enumerate(lines):
            if chunk_mod.RE_CHAPTER.match(line.strip()):
                start = max(0, i - 2)
                end = min(len(lines), i + 3)
                print(f"\n--- CHAPTER marker at line {i} ---")
                for j in range(start, end):
                    marker = ">> " if j == i else "   "
                    print(f"{marker}{lines[j]!r}")

    conn.close()


if __name__ == "__main__":
    main()
