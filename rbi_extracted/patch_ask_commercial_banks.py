"""
Patches streamlit_app.py's retrieve() function so the Ask tab only pulls
evidence from Master Directions applicable to Commercial Banks (both the
'Commercial Banking' and 'Commercial Banks' category values in the DB).

Adds a doc_type/category filter to both FTS lookup queries (the strict one
and the broad OR-recall fallback). Makes a .bak backup. Safe to re-run
(idempotent - skips if already patched).

Usage:
    python patch_ask_commercial_banks.py
"""
import re
from pathlib import Path

TARGET = Path(__file__).parent / "streamlit_app.py"

MARKER = "AND d.doc_type = 'master_direction'"

PATTERN = re.compile(
    r"WHERE documents_fts MATCH \?\s*\n"
    r"(\s*)ORDER BY bm25\(documents_fts\)\s*\n?\s*LIMIT 40",
)


def _replacement(match: re.Match) -> str:
    indent = match.group(1)
    return (
        "WHERE documents_fts MATCH ?\n"
        f"{indent}AND d.doc_type = 'master_direction'\n"
        f"{indent}AND d.category IN ('Commercial Banking', 'Commercial Banks')\n"
        f"{indent}ORDER BY bm25(documents_fts)\n"
        f"{indent}LIMIT 40"
    )


def main():
    if not TARGET.is_file():
        raise SystemExit(f"Not found: {TARGET}")

    text = TARGET.read_text(encoding="utf-8")

    if MARKER in text:
        print("Already patched — nothing to do.")
        return

    new_text, count = PATTERN.subn(_replacement, text)
    if count == 0:
        raise SystemExit(
            "Could not find the FTS query pattern to patch. "
            "streamlit_app.py may have changed — aborting without changes."
        )

    backup_path = TARGET.with_suffix(".py.bak2")
    backup_path.write_text(text, encoding="utf-8")
    print(f"Backup written to {backup_path}")

    TARGET.write_text(new_text, encoding="utf-8")
    print(f"Patched {count} quer{'y' if count == 1 else 'ies'} in {TARGET}")


if __name__ == "__main__":
    main()
