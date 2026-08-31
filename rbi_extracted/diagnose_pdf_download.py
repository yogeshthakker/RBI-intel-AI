"""
Diagnose why the 3 test PDFs downloaded as small HTML pages instead of real
PDFs. Prints the pdf_url for each test document, then fetches it with a
couple of different header combinations to see which one (if any) actually
gets a real PDF back.

Usage:
    python diagnose_pdf_download.py
"""
import os
import sqlite3
import urllib.request
from pathlib import Path

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)

TITLE_SUBSTRINGS = [
    "Prudential Norms on Capital Adequacy) Directions, 2025",
    "Credit Risk Management) Directions, 2025",
    "Cybersecurity, Technology",
]

HEADER_SETS = [
    ("plain Mozilla UA only", {"User-Agent": "Mozilla/5.0"}),
    ("scraper's real UA + Accept + Referer", {
        "User-Agent": "rbi-intel/2.0 (regulatory research indexer; contact via repository) Mozilla/5.0 (compatible)",
        "Accept": "text/html,application/xhtml+xml,application/pdf,*/*",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://www.rbi.org.in/",
    }),
    ("no headers at all", {}),
]


def find_docs(conn: sqlite3.Connection) -> list[dict]:
    docs = []
    for sub in TITLE_SUBSTRINGS:
        row = conn.execute(
            "SELECT id, title, pdf_url, source_url FROM documents WHERE title LIKE ? "
            "ORDER BY date DESC LIMIT 1",
            (f"%{sub}%",),
        ).fetchone()
        if row:
            docs.append(dict(row))
    return docs


def try_fetch(url: str, headers: dict) -> tuple[int, str, int, bytes]:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
        return resp.status, resp.headers.get("Content-Type", ""), len(body), body[:20]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    docs = find_docs(conn)
    conn.close()

    if not docs:
        raise SystemExit("None of the 3 test documents were found in the database.")

    for doc in docs:
        print(f"\n{'=' * 100}")
        print(f"DOC: {doc['title']}")
        print(f"pdf_url:    {doc['pdf_url']}")
        print(f"source_url: {doc['source_url']}")
        print("=" * 100)

        for label, headers in HEADER_SETS:
            try:
                status, ctype, size, first_bytes = try_fetch(doc["pdf_url"], headers)
                is_pdf = first_bytes.startswith(b"%PDF")
                print(f"  [{label}] status={status} content-type={ctype!r} "
                      f"size={size} starts_with_PDF={is_pdf} first_bytes={first_bytes!r}")
            except Exception as e:
                print(f"  [{label}] FAILED: {e}")


if __name__ == "__main__":
    main()
