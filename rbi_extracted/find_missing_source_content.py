"""
Check whether our HTML-scraped documents.body is missing real content that
actually exists in the PDF — by taking Gemini's PDF-extracted text (treated
as closer to ground truth), splitting it into paragraphs, and checking
whether each paragraph's content is findable in our local processed source
text. Paragraphs that are NOT found are flagged as likely missing from our
scrape.

Runs this check for all 3 test documents.

Uses a lenient check (first 60 normalized chars of each paragraph) since
whitespace/formatting differs between sources — this is a coarse signal,
not gospel, but flags real gaps in the DOZENS-of-chars range, not the
one-word-different-due-to-markdown-cleanup kind of noise.

Usage:
    python find_missing_source_content.py
"""
import os
import re
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "python"))

from rbi_intel import chunk as chunk_mod  # noqa: E402

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
GEMINI_DIR = ROOT / "gemini_output"

# (doc_id, substring to find the right gemini_output/*.md file)
DOCS = [
    ("rbi:md:13159", "Capital"),
    ("rbi:md:13153", "Credit-Risk-Management"),
    ("rbi:md:13643", "Cybersecurity"),
]


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def check_one(conn, doc_id: str, name_fragment: str):
    row = conn.execute("SELECT title, body FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not row:
        print(f"  No document found for {doc_id}")
        return

    local_processed = chunk_mod.normalise_breaks(
        chunk_mod.trim_front_matter(chunk_mod.strip_markdown(row[1] or ""))
    )
    local_norm = normalize(local_processed)

    g_files = [f for f in GEMINI_DIR.glob("*.md") if name_fragment.replace("-", "") in f.name.replace(" ", "").replace("-", "")]
    if not g_files:
        # fallback: loose word match
        frag_words = re.sub(r"[-_]", " ", name_fragment).lower().split()
        g_files = [f for f in GEMINI_DIR.glob("*.md") if all(w in f.name.lower() for w in frag_words)]
    if not g_files:
        print(f"  No matching Gemini output file found for {name_fragment}")
        return
    gemini_text = g_files[0].read_text(encoding="utf-8")

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", gemini_text) if p.strip()]

    missing = []
    for p in paragraphs:
        probe = normalize(p)[:60]
        if len(probe) < 20:
            continue
        if probe not in local_norm:
            missing.append(p)

    print(f"  Doc: {row['title'][:80]}")
    print(f"  Gemini paragraphs checked: {len(paragraphs)}")
    print(f"  Paragraphs NOT found in local source: {len(missing)}")
    for i, p in enumerate(missing, start=1):
        print(f"\n    --- Missing candidate #{i} ---")
        print(f"    {p[:400]}")


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    for doc_id, name_fragment in DOCS:
        print("=" * 100)
        print(f"{doc_id}")
        print("=" * 100)
        check_one(conn, doc_id, name_fragment)
        print()

    conn.close()
    print("Done.")


if __name__ == "__main__":
    main()
