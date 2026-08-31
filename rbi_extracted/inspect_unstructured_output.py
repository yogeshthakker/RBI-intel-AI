"""
The 'basic' Unstructured workflow produced 3 output JSON files per PDF (one
per pipeline node) with very different sizes. Before comparing text
coverage, figure out which node's output is the actual parsed text/elements
(vs e.g. an embeddings node, which would be huge due to vector arrays).

Prints, for every JSON file in unstructured_output/: file size, top-level
JSON shape (list vs dict, length), and for the first item, its keys and a
short preview of any "text" field — plus a running total of all "text"
field lengths if it's a list of elements.

Usage:
    python inspect_unstructured_output.py
"""
import json
from pathlib import Path

OUTPUT_DIR = Path(__file__).parent / "unstructured_output"


def main():
    files = sorted(OUTPUT_DIR.glob("*.json"))
    if not files:
        raise SystemExit(f"No JSON files found in {OUTPUT_DIR}")

    print(f"Found {len(files)} output file(s)\n")

    for f in files:
        size = f.stat().st_size
        print("=" * 100)
        print(f"{f.name}  ({size:,} bytes)")
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"  ERROR parsing JSON: {e}")
            continue

        if isinstance(data, list):
            print(f"  shape: list of {len(data)} item(s)")
            if data:
                first = data[0]
                if isinstance(first, dict):
                    print(f"  first item keys: {list(first.keys())}")
                    text_val = first.get("text")
                    if text_val:
                        print(f"  first item 'text' preview: {text_val[:200]!r}")
                total_text_len = sum(
                    len(item.get("text", "") or "") for item in data if isinstance(item, dict)
                )
                print(f"  TOTAL 'text' field length across all items: {total_text_len:,} chars")
        elif isinstance(data, dict):
            print(f"  shape: dict with keys: {list(data.keys())}")
        else:
            print(f"  shape: {type(data).__name__}")
        print()

    print("Done.")


if __name__ == "__main__":
    main()
