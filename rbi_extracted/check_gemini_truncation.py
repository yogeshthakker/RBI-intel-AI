"""
Check whether the Gemini output for the Capital Adequacy doc was truncated
(cuts off mid-sentence/mid-clause) vs. genuinely complete but compact.
Prints the last ~1000 chars of the file plus total length, and does a
naive scan for how far into the document's numbered clauses it got by
looking for the highest bare clause number mentioned near the end.

Usage:
    python check_gemini_truncation.py
"""
from pathlib import Path

GEMINI_DIR = Path(__file__).parent / "gemini_output"


def main():
    files = list(GEMINI_DIR.glob("*Capital*Adequacy*.md")) or list(GEMINI_DIR.glob("*.md"))
    if not files:
        raise SystemExit(f"No matching .md file found in {GEMINI_DIR}")

    for f in files:
        if "Capital" not in f.name and "Adequacy" not in f.name:
            continue
        text = f.read_text(encoding="utf-8")
        print(f"File: {f.name}")
        print(f"Total length: {len(text):,} chars\n")
        print("=" * 100)
        print("LAST 1500 CHARACTERS:")
        print("=" * 100)
        print(text[-1500:])
        print("\n" + "=" * 100)
        print("FIRST 500 CHARACTERS:")
        print("=" * 100)
        print(text[:500])


if __name__ == "__main__":
    main()
