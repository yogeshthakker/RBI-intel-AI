"""Quick check: size and first/last 200 chars of every file in gemini_output/.

Usage:
    python check_gemini_files.py
"""
from pathlib import Path

GEMINI_DIR = Path(__file__).parent / "gemini_output"


def main():
    files = sorted(GEMINI_DIR.glob("*.md"))
    if not files:
        raise SystemExit(f"No .md files found in {GEMINI_DIR}")
    for f in files:
        text = f.read_text(encoding="utf-8")
        print("=" * 100)
        print(f"{f.name}  ({len(text):,} chars, {f.stat().st_size:,} bytes on disk)")
        print(f"  first 200: {text[:200]!r}")
        print(f"  last 200:  {text[-200:]!r}")


if __name__ == "__main__":
    main()
