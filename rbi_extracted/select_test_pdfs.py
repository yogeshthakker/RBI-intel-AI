"""
Pick up to 10 PDFs from your regdata.db that match the BASIC-workflow test
criteria: Commercial Bank, Applicable, Active, and about credit risk /
prudential capital management / stress testing — and download them into
./unstructured_input/ so unstructured_4_combined.py (or scripts 1-3) can run
on them right away.

Usage:
    python select_test_pdfs.py

Set RBI_INTEL_DB to point at a non-default database path (same env var the
Node/Python sides already use).
"""
import os
import sqlite3
import urllib.request
from pathlib import Path

DB_PATH = os.environ.get(
    "RBI_INTEL_DB", os.path.expanduser("~/.rbi-intel/regdata.db")
)
OUTPUT_DIR = Path(__file__).parent / "unstructured_input"
MAX_DOCS = 10

# The taxonomy has no single "Stress Testing" topic yet, so we match on
# title/topic keywords directly rather than relying on primary_topic alone.
KEYWORDS = ["credit risk", "prudential", "capital adequacy", "capital management", "stress test"]


def find_candidates(conn: sqlite3.Connection) -> list[dict]:
    keyword_sql = " OR ".join(
        ["title LIKE ?", "COALESCE(primary_topic, '') LIKE ?"] * len(KEYWORDS)
    )
    params = []
    for kw in KEYWORDS:
        like = f"%{kw}%"
        params.extend([like, like])

    sql = f"""
        SELECT id, title, pdf_url
        FROM documents
        WHERE institution_type = 'Commercial Banks'
          AND status = 'active'
          AND COALESCE(applicability_override, applicability) = 'Applicable'
          AND pdf_url IS NOT NULL AND pdf_url <> ''
          AND ({keyword_sql})
        ORDER BY date DESC
        LIMIT ?
    """
    params.append(MAX_DOCS)
    rows = conn.execute(sql, params).fetchall()
    return [dict(zip([c[0] for c in conn.execute(sql, params).description], r)) for r in rows]


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
    if not Path(DB_PATH).is_file():
        raise SystemExit(f"Database not found at {DB_PATH}. Set RBI_INTEL_DB if it's elsewhere.")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    docs = find_candidates(conn)
    conn.close()

    if not docs:
        raise SystemExit(
            "No matching documents found (Commercial Banks / active / Applicable / "
            "credit risk|prudential|capital|stress test). Loosen the criteria and try again."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[select] {len(docs)} matching document(s):")
    saved = 0
    for d in docs:
        title = d["title"] or d["id"]
        safe_name = "".join(c if c.isalnum() or c in " -_." else "_" for c in title)[:120]
        dest = OUTPUT_DIR / f"{safe_name}.pdf"
        print(f"  - {title}")
        try:
            download(d["pdf_url"], dest)
            print(f"    saved -> {dest}")
            saved += 1
        except Exception as e:
            print(f"    FAILED to download ({e}): {d['pdf_url']}")

    print(f"\nDone. {saved}/{len(docs)} PDF(s) saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
