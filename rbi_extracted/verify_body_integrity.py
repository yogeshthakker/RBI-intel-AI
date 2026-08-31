"""
Check whether the SAME "blocked headers → HTML instead of PDF" problem we
found for manual test downloads also affected the real sync/ingest pipeline
that populates documents.body (the text chunk/extract/scaffold all run on).

Node's extractPdfText() (src/scrapers/pdf.ts) fetches the PDF via
politeFetch(), which always sends a custom User-Agent/Accept/Referer — the
exact header combo we just proved gets blocked by rbidocs.rbi.org.in. If
pdf-parse then fails on the HTML it got instead of a PDF, extractPdfText()
catches the error and returns "" (empty string), logging only a console
error — so a document could have an empty/garbage body with no obvious sign
in the dashboard.

This script does NOT re-fetch anything — it just inspects what's already
stored in documents.body, which tells us whether ingestion actually got real
PDF text or not.

Usage:
    python verify_body_integrity.py
"""
import os
import sqlite3
from pathlib import Path

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)

TITLE_SUBSTRINGS = [
    "Prudential Norms on Capital Adequacy) Directions, 2025",
    "Credit Risk Management) Directions, 2025",
    "Cybersecurity, Technology",
]


def main():
    if not Path(DB_PATH).is_file():
        raise SystemExit(f"Database not found at {DB_PATH}. Set RBI_INTEL_DB if it's elsewhere.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    print("=" * 100)
    print("PART 1 — the 3 test documents specifically")
    print("=" * 100)
    for sub in TITLE_SUBSTRINGS:
        row = conn.execute(
            "SELECT id, title, body FROM documents WHERE title LIKE ? ORDER BY date DESC LIMIT 1",
            (f"%{sub}%",),
        ).fetchone()
        if not row:
            print(f"[warn] no document found matching: {sub}")
            continue
        body = row["body"] or ""
        preview = body[:200].replace("\n", " ")
        looks_like_html = "<html" in body[:500].lower() or "<!doctype" in body[:500].lower()
        print(f"\nDOC: {row['title']}")
        print(f"  id={row['id']}  body_length={len(body)}  looks_like_html={looks_like_html}")
        print(f"  preview: {preview!r}")

    print(f"\n{'=' * 100}")
    print("PART 2 — how widespread is empty/garbage body across ALL documents")
    print("=" * 100)

    total = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    empty = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE body IS NULL OR body = ''"
    ).fetchone()[0]
    short = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE body IS NOT NULL AND length(body) BETWEEN 1 AND 200"
    ).fetchone()[0]
    html_like = conn.execute(
        "SELECT COUNT(*) FROM documents WHERE body LIKE '%<!DOCTYPE%' OR body LIKE '%<html%'"
    ).fetchone()[0]

    print(f"Total documents:              {total}")
    print(f"Empty body (NULL or ''):       {empty}  ({100*empty/total:.1f}%)")
    print(f"Suspiciously short (1-200ch):  {short}")
    print(f"Body contains raw HTML markup: {html_like}  <- these are almost certainly the blocked-page bug")

    print("\nBy doc_type (empty-body count):")
    for r in conn.execute(
        "SELECT doc_type, COUNT(*) AS n, "
        "SUM(CASE WHEN body IS NULL OR body = '' THEN 1 ELSE 0 END) AS empty_n "
        "FROM documents GROUP BY doc_type ORDER BY n DESC"
    ):
        print(f"  {r['doc_type']:<20} total={r['n']:<6} empty={r['empty_n']}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
