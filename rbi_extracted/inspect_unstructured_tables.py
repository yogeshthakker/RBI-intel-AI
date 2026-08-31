"""
Look at the raw partition node output (f448fdc0 files — finer-grained than
the chunked ff97b6fa ones) to see what element TYPES Unstructured actually
detects (Table, Title, NarrativeText, etc.) and whether Table elements carry
structured HTML (metadata.text_as_html) — which would be a real upgrade over
our current HTML-scrape body text for table-heavy circulars.

Usage:
    python inspect_unstructured_tables.py
"""
import json
from collections import Counter
from pathlib import Path

UNSTRUCTURED_DIR = Path(__file__).parent / "unstructured_output"


def main():
    files = sorted(UNSTRUCTURED_DIR.glob("f448fdc0-*.json"))
    if not files:
        raise SystemExit("No raw-partition (f448fdc0) files found.")

    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        print("=" * 100)
        print(f"{f.name}  ({len(data)} elements)")
        print("=" * 100)

        type_counts = Counter(item.get("type") for item in data)
        print("Element type counts:")
        for t, n in type_counts.most_common():
            print(f"  {t}: {n}")

        tables = [item for item in data if item.get("type") == "Table"]
        print(f"\nFound {len(tables)} Table element(s). Showing first 2:\n")
        for i, t in enumerate(tables[:2]):
            print(f"--- Table {i+1} ---")
            print(f"Plain text: {(t.get('text') or '')[:300]!r}")
            metadata = t.get("metadata", {})
            html = metadata.get("text_as_html")
            if html:
                print(f"\nHTML (text_as_html), first 500 chars:\n{html[:500]}")
            else:
                print("\n(no text_as_html in metadata)")
            print(f"\nOther metadata keys: {list(metadata.keys())}")
            print()
        print()


if __name__ == "__main__":
    main()
