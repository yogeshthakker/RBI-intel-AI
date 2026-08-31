"""
Final 3-way comparison for the 3 test documents:
  - Unstructured Platform (the 'ff97b6fa' node output — chunked, no
    embeddings bloat) — total chars across all elements' "text" field
  - Gemini (gemini_output/*.md) — chars in the extracted markdown
  - Our own pipeline: documents.body (scraped from rbi.org.in HTML) run
    through the SAME chunk.py processing used in coverage_check.py, both
    the processed-source length and the total clause-text length actually
    stored in the DB.

This tells us, per document: does Unstructured or Gemini extract
meaningfully MORE text (e.g. tables) from the original PDF than our
HTML-scrape + chunker currently captures? A big gap flags a document worth
re-ingesting from the PDF instead of the HTML scrape.

Usage:
    python compare_parsers.py
"""
import json
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

UNSTRUCTURED_DIR = ROOT / "unstructured_output"
GEMINI_DIR = ROOT / "gemini_output"

# Map each test PDF (by a stable substring of its unstructured_input/
# filename) to what we search for in the documents.title column to find
# its DB row.
DOC_TITLE_MATCHES = [
    ("Capital-Adequacy", "Capital Adequacy"),
    ("Credit-Risk-Management", "Credit Risk Management"),
    ("Cybersecurity", "Cybersecurity"),
]


def find_unstructured_file(name_fragment: str) -> Path | None:
    for f in UNSTRUCTURED_DIR.glob("ff97b6fa-*.json"):
        if name_fragment in f.name:
            return f
    return None


def find_gemini_file(name_fragment: str) -> Path | None:
    for f in GEMINI_DIR.glob("*.md"):
        if name_fragment.replace("-", " ") in f.name or name_fragment in f.name.replace(" ", "-"):
            return f
    # fallback: loose match
    frag_words = re.sub(r"[-_]", " ", name_fragment).lower().split()
    for f in GEMINI_DIR.glob("*.md"):
        fname = f.name.lower()
        if all(w in fname for w in frag_words):
            return f
    return None


def unstructured_text_len(path: Path) -> int:
    data = json.loads(path.read_text(encoding="utf-8"))
    return sum(len(item.get("text", "") or "") for item in data if isinstance(item, dict))


def find_db_doc(conn, title_fragment: str):
    rows = conn.execute(
        "SELECT id, title, body FROM documents WHERE doc_type IN ('master_direction','master_circular') "
        "AND title LIKE ? AND title LIKE '%Commercial Banks%'",
        (f"%{title_fragment}%",),
    ).fetchall()
    # Prefer active status if multiple match
    return rows


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print(f"{'=' * 110}")
    print(f"{'Document':<28} {'Unstructured':>14} {'Gemini':>10} {'Local source':>14} {'Local clauses':>14}")
    print(f"{'=' * 110}")

    for name_fragment, title_fragment in DOC_TITLE_MATCHES:
        u_path = find_unstructured_file(name_fragment)
        g_path = find_gemini_file(name_fragment)

        u_len = unstructured_text_len(u_path) if u_path else None
        g_len = len(g_path.read_text(encoding="utf-8")) if g_path else None

        rows = find_db_doc(conn, title_fragment)
        if not rows:
            print(f"{title_fragment:<28} {'??':>14} {'??':>10} {'NO DB MATCH':>14} {'':>14}")
            continue

        # If multiple rows match, show all of them.
        for row in rows:
            doc_id = row["id"]
            body = row["body"] or ""
            processed = chunk_mod.normalise_breaks(
                chunk_mod.trim_front_matter(chunk_mod.strip_markdown(body))
            )
            source_len = len(processed)
            clause_rows = conn.execute(
                "SELECT text FROM clauses WHERE doc_id = ?", (doc_id,)
            ).fetchall()
            clause_len = sum(len(c["text"] or "") for c in clause_rows)

            label = f"{title_fragment} ({doc_id})"
            u_str = f"{u_len:,}" if u_len is not None else "??"
            g_str = f"{g_len:,}" if g_len is not None else "??"
            print(f"{label:<28} {u_str:>14} {g_str:>10} {source_len:>14,} {clause_len:>14,}")

    print(f"{'=' * 110}")
    print("\nNote: 'Local source' = our processed documents.body length (what chunk.py sees).")
    print("'Local clauses' = total chars actually stored as clauses after chunking.")
    print("Unstructured/Gemini numbers come from parsing the ORIGINAL PDF directly —")
    print("a much bigger number than 'Local source' may mean our HTML scrape is missing")
    print("content (e.g. tables) that the PDF has.")

    conn.close()


if __name__ == "__main__":
    main()
