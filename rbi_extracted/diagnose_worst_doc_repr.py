"""
Same as diagnose_worst_doc.py but prints the processed text via repr() so
real newlines are visible as \\n and we can't be fooled by terminal
word-wrapping. Also prints each individual line the chunker actually sees,
numbered, so we can see exactly which lines matched a clause boundary and
which didn't.

Usage:
    python diagnose_worst_doc_repr.py
"""
import os
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "python"))

from rbi_intel import chunk as chunk_mod  # noqa: E402

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
DOC_ID = "rbi:md:10202"


def main():
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT body FROM documents WHERE id = ?", (DOC_ID,)).fetchone()
    if not row:
        raise SystemExit(f"No document found with id {DOC_ID}")

    body = row[0] or ""
    processed = chunk_mod.normalise_breaks(
        chunk_mod.trim_front_matter(chunk_mod.strip_markdown(body))
    )

    print("=" * 100)
    print("REPR of full processed text (real newlines visible as \\n):")
    print("=" * 100)
    print(repr(processed))

    print(f"\n{'=' * 100}")
    print("Each line, numbered, with boundary-match result:")
    print("=" * 100)
    for i, line in enumerate(processed.splitlines()):
        stripped = line.strip()
        if not stripped:
            print(f"[{i:>3}] (blank)")
            continue
        matched = None
        for name, pat in (("DEEP", chunk_mod.RE_DEEP), ("DOTTED", chunk_mod.RE_DOTTED),
                           ("BARE", chunk_mod.RE_BARE), ("PAREN", chunk_mod.RE_PAREN)):
            if pat.match(stripped):
                matched = name
                break
        tag = f"MATCH:{matched}" if matched else "no-match"
        print(f"[{i:>3}] ({tag:>12}) {stripped!r}")

    conn.close()


if __name__ == "__main__":
    main()
