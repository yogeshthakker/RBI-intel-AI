"""
Chunk-quality comparison for ONE document (Credit Risk Management — the
smallest of the 3 test docs, easiest to eyeball) across 3 sources:
  1. Our local chunker (DB clauses table, after all 3 fixes)
  2. Unstructured Platform's own "chunked" node output (ff97b6fa file)
  3. Gemini's extracted markdown, chunked with our SAME chunk.py logic
     (so we're comparing "our chunker on different source text", isolating
     source-text quality from chunking-logic quality)

Prints all 3 side-by-side-ish (one after another) so we can manually spot:
  - missing clauses (e.g. clause 1/2/3 dropped)
  - garbled/merged clauses
  - table handling differences

Usage:
    python compare_chunk_quality.py
"""
import json
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
DOC_ID = "rbi:md:13153"

UNSTRUCTURED_DIR = ROOT / "unstructured_output"
GEMINI_DIR = ROOT / "gemini_output"


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # 1. Our local clauses
    print("=" * 100)
    print("1. OUR LOCAL CHUNKER (DB clauses)")
    print("=" * 100)
    clauses = conn.execute(
        "SELECT clause_label, chapter, seq, text FROM clauses WHERE doc_id = ? ORDER BY seq",
        (DOC_ID,),
    ).fetchall()
    print(f"Total clauses: {len(clauses)}\n")
    for c in clauses[:8]:
        print(f"  [{c['clause_label']}] {c['text'][:100]!r}")
    print("  ...")
    for c in clauses[-3:]:
        print(f"  [{c['clause_label']}] {c['text'][:100]!r}")

    # 2. Unstructured's own chunked output
    print(f"\n{'=' * 100}")
    print("2. UNSTRUCTURED PLATFORM (its own chunking, ff97b6fa node)")
    print("=" * 100)
    u_files = list(UNSTRUCTURED_DIR.glob("ff97b6fa-*Credit-Risk-Management*.json"))
    if not u_files:
        print("  No matching file found.")
    else:
        data = json.loads(u_files[0].read_text(encoding="utf-8"))
        print(f"Total elements: {len(data)}\n")
        for item in data[:8]:
            print(f"  [{item.get('type')}] {(item.get('text') or '')[:100]!r}")
        print("  ...")
        for item in data[-3:]:
            print(f"  [{item.get('type')}] {(item.get('text') or '')[:100]!r}")

    # 3. Gemini text, chunked with OUR chunk.py logic
    print(f"\n{'=' * 100}")
    print("3. GEMINI TEXT + OUR CHUNKER (isolates source-text quality)")
    print("=" * 100)
    g_files = list(GEMINI_DIR.glob("*Credit-Risk-Management*.md")) or [
        f for f in GEMINI_DIR.glob("*.md") if "Credit" in f.name and "Risk" in f.name
    ]
    if not g_files:
        print("  No matching Gemini file found.")
    else:
        gemini_text = g_files[0].read_text(encoding="utf-8")
        gemini_chunks = chunk_mod.chunk_text(gemini_text)
        print(f"Total chunks: {len(gemini_chunks)}\n")
        for c in gemini_chunks[:8]:
            print(f"  [{c.label}] {c.text[:100]!r}")
        print("  ...")
        for c in gemini_chunks[-3:]:
            print(f"  [{c.label}] {c.text[:100]!r}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
