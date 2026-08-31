"""
Trim ./unstructured_input/ down to exactly the 3 documents we want for the
3-API comparison test:
  1. Prudential Norms on Capital Adequacy Directions, 2025 (base MD)
  2. Credit Risk Management Directions, 2025 (base MD)
  3. One Commercial Banks cyber security Master Direction (looked up fresh
     from the DB, since it wasn't part of the original 10)

Deletes everything else already in unstructured_input/ (the 8 short
Amendment Directions pulled by select_test_pdfs.py), so the folder holds only
the 3 documents worth comparing across Unstructured / Gemini / OpenRouter.

Usage:
    python prepare_test_set.py
"""
import os
import sqlite3
import urllib.request
from pathlib import Path

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
INPUT_DIR = Path(__file__).parent / "unstructured_input"

# Substrings that identify the 2 MDs we already downloaded and want to KEEP
# (not their Amendment siblings).
KEEP_TITLE_SUBSTRINGS = [
    "Prudential Norms on Capital Adequacy) Directions, 2025",
    "Credit Risk Management) Directions, 2025",
]


def safe_name(title: str) -> str:
    return "".join(c if c.isalnum() or c in " -_." else "_" for c in title)[:120]


def trim_existing() -> None:
    if not INPUT_DIR.is_dir():
        return
    for f in INPUT_DIR.iterdir():
        if not f.is_file():
            continue
        if any(sub in f.stem for sub in [safe_name(s) for s in KEEP_TITLE_SUBSTRINGS]):
            print(f"[keep]   {f.name}")
            continue
        f.unlink()
        print(f"[remove] {f.name}")


def find_cyber_md(conn: sqlite3.Connection) -> dict | None:
    sql = """
        SELECT id, title, pdf_url
        FROM documents
        WHERE institution_type = 'Commercial Banks'
          AND status = 'active'
          AND COALESCE(applicability_override, applicability) = 'Applicable'
          AND doc_type IN ('master_direction', 'master_circular')
          AND pdf_url IS NOT NULL AND pdf_url <> ''
          AND (
                title LIKE '%Cyber Security%' OR title LIKE '%Cyber Resilience%'
                OR COALESCE(primary_topic, '') = 'Cyber Resilience'
              )
        ORDER BY date DESC
        LIMIT 1
    """
    row = conn.execute(sql).fetchone()
    return dict(row) if row else None


def download(url: str, dest: Path) -> None:
    """
    Deliberately sends NO custom headers. rbidocs.rbi.org.in returns a small
    HTML "blocked" page (not the PDF) when a User-Agent or Referer header is
    set — confirmed by testing 3 header combos directly. Only urllib's
    default bare request gets the real PDF back. Do not "helpfully" add a
    User-Agent here again without re-testing against the live server first.
    """
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = resp.read()
    if not data.startswith(b"%PDF"):
        raise ValueError(
            f"response is not a real PDF (starts with {data[:20]!r}) — "
            f"likely a blocked-request HTML page, not the document"
        )
    dest.write_bytes(data)


def main():
    trim_existing()

    if not Path(DB_PATH).is_file():
        raise SystemExit(f"Database not found at {DB_PATH}. Set RBI_INTEL_DB if it's elsewhere.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    doc = find_cyber_md(conn)
    conn.close()

    if not doc:
        print(
            "\nNo cyber security Master Direction found matching "
            "Commercial Banks / active / Applicable. Folder now has just the 2 MDs."
        )
        return

    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = INPUT_DIR / f"{safe_name(doc['title'])}.pdf"
    print(f"[cyber] {doc['title']}")
    try:
        download(doc["pdf_url"], dest)
        print(f"        saved -> {dest}")
    except Exception as e:
        print(f"        FAILED to download ({e}): {doc['pdf_url']}")

    print("\nDone. unstructured_input/ should now hold exactly 3 PDFs.")


if __name__ == "__main__":
    main()
