"""
Standalone script: parse the 3 test PDFs in unstructured_input/ using
OpenRouter (chat completions API, PDF sent as a base64 file part), saving
one markdown file per PDF to openrouter_output/. This is the OpenRouter leg
of the 3-way parser comparison (Unstructured Platform / Gemini / OpenRouter)
on the same 3 documents.

Requires: pip install requests (usually already installed)
Requires: OPENROUTER_API_KEY set (env var, or in a .env file next to this
script, or in D:\\Downloads\\.env under the shorthand key "open").

Usage:
    python openrouter_extract.py
"""
import base64
import os
import time
from pathlib import Path

import requests

INPUT_DIR = Path(__file__).parent / "unstructured_input"
OUTPUT_DIR = Path(__file__).parent / "openrouter_output"
MODEL_NAME = "openai/gpt-4o"
API_URL = "https://openrouter.ai/api/v1/chat/completions"

EXTRACTION_PROMPT = (
    "Extract the COMPLETE text content of this PDF document, preserving the "
    "original structure and numbering exactly as it appears (chapter "
    "headings, numbered clauses, sub-clauses, paragraph letters). Render "
    "every table using GitHub-flavored Markdown table syntax, keeping all "
    "rows and columns. Do not summarize, omit, or paraphrase anything — "
    "output the full text verbatim in reading order. Do not add any "
    "commentary before or after the extracted content."
)

_ENV_KEY_ALIASES = {
    "unstrctured": "UNSTRUCTURED_API_KEY",
    "unstructured": "UNSTRUCTURED_API_KEY",
    "open": "OPENROUTER_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "google": "GEMINI_API_KEY",
    "gemini": "GEMINI_API_KEY",
}


def _load_env_file() -> None:
    candidates = [Path(__file__).parent / ".env", Path(r"D:\Downloads\.env")]
    for env_path in candidates:
        if not env_path.is_file():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            real_key = _ENV_KEY_ALIASES.get(key.lower(), key)
            if real_key and real_key not in os.environ:
                os.environ[real_key] = value
        break


def extract_one(api_key: str, pdf_path: Path) -> str:
    data = pdf_path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    data_url = f"data:application/pdf;base64,{b64}"

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": EXTRACTION_PROMPT},
                    {
                        "type": "file",
                        "file": {"filename": pdf_path.name, "file_data": data_url},
                    },
                ],
            }
        ],
        # Ensure the PDF is actually parsed into text/pages before the model
        # sees it, rather than relying solely on native vision support.
        "plugins": [{"id": "file-parser", "pdf": {"engine": "pdf-text"}}],
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(API_URL, headers=headers, json=payload, timeout=300)
    if resp.status_code != 200:
        raise RuntimeError(f"OpenRouter error {resp.status_code}: {resp.text[:2000]}")

    result = resp.json()
    return result["choices"][0]["message"]["content"] or ""


def main():
    _load_env_file()
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set OPENROUTER_API_KEY (env var, or 'open=...' in your .env) "
            "before running."
        )

    OUTPUT_DIR.mkdir(exist_ok=True)
    pdfs = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDFs found in {INPUT_DIR}")

    print(f"Found {len(pdfs)} PDF(s) in {INPUT_DIR}\n")

    for i, pdf_path in enumerate(pdfs, start=1):
        print(f"[{i}/{len(pdfs)}] {pdf_path.name}")
        print("  sending to OpenRouter...")
        t0 = time.time()
        try:
            text = extract_one(api_key, pdf_path)
        except Exception as e:
            print(f"  ERROR: {e}\n")
            continue
        elapsed = time.time() - t0

        out_path = OUTPUT_DIR / (pdf_path.stem + ".md")
        out_path.write_text(text, encoding="utf-8")
        print(f"  saved {out_path} ({len(text)} chars, {elapsed:.0f}s)\n")

    print(f"Done. Output in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
