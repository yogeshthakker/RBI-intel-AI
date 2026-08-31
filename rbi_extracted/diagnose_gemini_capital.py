"""
Diagnose why the Gemini extraction for the Capital Adequacy PDF returned an
empty response.text — print the full response's finish_reason, safety
ratings, and prompt_feedback so we know exactly what happened (blocked
content, empty first response, quota, etc.) rather than guessing.

Usage:
    python diagnose_gemini_capital.py
"""
import os
import time
from pathlib import Path

INPUT_DIR = Path(__file__).parent / "unstructured_input"
MODEL_NAME = "gemini-3.6-flash"

EXTRACTION_PROMPT = (
    "Extract the COMPLETE text content of this PDF document, preserving the "
    "original structure and numbering exactly as it appears (chapter "
    "headings, numbered clauses, sub-clauses, paragraph letters). Render "
    "every table using GitHub-flavored Markdown table syntax, keeping all "
    "rows and columns. Do not summarize, omit, or paraphrase anything — "
    "output the full text verbatim in reading order. Do not add any "
    "commentary before or after the extracted content. If you run out of "
    "output space partway through, simply stop mid-content at the exact "
    "point you reached — do NOT write any note explaining that you ran out "
    "of space or that extraction continues elsewhere; just stop."
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


def main():
    _load_env_file()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("Set GEMINI_API_KEY first.")

    from google import genai

    client = genai.Client(api_key=api_key)

    pdf_path = next(INPUT_DIR.glob("*Capital*Adequacy*.pdf"), None)
    if not pdf_path:
        raise SystemExit("Capital Adequacy PDF not found in unstructured_input/")

    print(f"Uploading {pdf_path.name}...")
    uploaded = client.files.upload(file=str(pdf_path))
    while uploaded.state.name == "PROCESSING":
        time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)
    print(f"File state: {uploaded.state.name}")

    print("Sending generation request...")
    chat = client.chats.create(model=MODEL_NAME)
    try:
        response = chat.send_message([uploaded, EXTRACTION_PROMPT])
    except Exception as e:
        print(f"EXCEPTION raised: {type(e).__name__}: {e}")
        return

    print("\n" + "=" * 100)
    print("RAW RESPONSE DIAGNOSTICS")
    print("=" * 100)
    print(f"response.text: {response.text!r}"[:500])
    print(f"\nprompt_feedback: {getattr(response, 'prompt_feedback', None)}")
    candidates = response.candidates or []
    print(f"\nnumber of candidates: {len(candidates)}")
    for i, c in enumerate(candidates):
        print(f"\n--- candidate {i} ---")
        print(f"finish_reason: {c.finish_reason}")
        print(f"safety_ratings: {getattr(c, 'safety_ratings', None)}")
        content = getattr(c, "content", None)
        if content:
            parts = getattr(content, "parts", None) or []
            print(f"content.parts count: {len(parts)}")
            for j, p in enumerate(parts):
                ptext = getattr(p, "text", None)
                print(f"  part {j} text length: {len(ptext) if ptext else 0}")

    client.files.delete(name=uploaded.name)


if __name__ == "__main__":
    main()
