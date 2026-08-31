"""
Standalone script: parse the 3 test PDFs in unstructured_input/ using Google
Gemini's file API + a single extraction prompt, saving one markdown file per
PDF to gemini_output/. This is the Gemini leg of the 3-way parser comparison
(Unstructured Platform / Gemini / OpenRouter) on the same 3 documents.

Requires: pip install google-genai
Requires: GEMINI_API_KEY set (env var, or in a .env file next to this
script, or in D:\\Downloads\\.env under the shorthand key "google").

Usage:
    python gemini_extract.py
"""
import os
import time
from pathlib import Path

INPUT_DIR = Path(__file__).parent / "unstructured_input"
OUTPUT_DIR = Path(__file__).parent / "gemini_output"
MODEL_NAME = "gemini-3.6-flash"

DONE_SENTINEL = "[[EXTRACTION COMPLETE]]"

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
    "of space or that extraction continues elsewhere; just stop.\n\n"
    f"IMPORTANT: This document is long and may take several responses to "
    f"extract in full. Only once you have reached the very last line of the "
    f"actual document (e.g. a signature block, 'Chief General Manager', or "
    f"similar closing) should you write the exact line {DONE_SENTINEL!r} by "
    f"itself as the final line of your response. Do NOT write it if you "
    f"stopped early due to output length — only write it when the document "
    f"is truly, completely finished."
)

CONTINUE_PROMPT = (
    "Continue the extraction EXACTLY from where you stopped — do not repeat "
    "any text you already output, do not summarize what came before, and do "
    "not add any commentary. Just continue the verbatim extraction from the "
    f"next character onward. Remember: only write {DONE_SENTINEL!r} as the "
    "final line once you reach the document's actual end."
)

MAX_CONTINUATIONS = 30

# This user's D:\Downloads\.env uses shorthand key names.
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


def _send_with_retry(chat, content, max_retries=6):
    """Send a chat message, retrying on 429 RESOURCE_EXHAUSTED by sleeping
    for the server's suggested retryDelay (plus a small buffer) instead of
    crashing. Continuation calls resend the full chat history (including
    the uploaded file) each time, so per-minute input-token quotas get hit
    fast on large documents — this is expected and recoverable, not fatal."""
    import re as _re

    for attempt in range(1, max_retries + 1):
        try:
            return chat.send_message(content)
        except Exception as e:
            msg = str(e)
            if "RESOURCE_EXHAUSTED" not in msg and "429" not in msg:
                raise
            m = _re.search(r"retryDelay['\"]?\s*:\s*['\"]?(\d+)", msg)
            delay = int(m.group(1)) + 5 if m else 65
            print(f"    quota hit (attempt {attempt}/{max_retries}), "
                  f"waiting {delay}s before retrying...")
            time.sleep(delay)
    raise RuntimeError(f"Still rate-limited after {max_retries} retries.")


def _get_finish_reason(response) -> str:
    """Return the finish_reason of the first candidate as a plain string
    (e.g. "STOP", "MAX_TOKENS"), or "" if unavailable."""
    try:
        candidates = response.candidates or []
        if not candidates:
            return ""
        reason = candidates[0].finish_reason
        return reason.name if hasattr(reason, "name") else str(reason)
    except Exception:
        return ""


def main():
    _load_env_file()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit(
            "Set GEMINI_API_KEY (env var, or 'google=...' in your .env) "
            "before running."
        )

    from google import genai

    client = genai.Client(api_key=api_key)

    OUTPUT_DIR.mkdir(exist_ok=True)
    pdfs = sorted(INPUT_DIR.glob("*.pdf"))
    if not pdfs:
        raise SystemExit(f"No PDFs found in {INPUT_DIR}")

    print(f"Found {len(pdfs)} PDF(s) in {INPUT_DIR}\n")

    for i, pdf_path in enumerate(pdfs, start=1):
        print(f"[{i}/{len(pdfs)}] {pdf_path.name}")
        print("  uploading...")
        uploaded = client.files.upload(file=str(pdf_path))

        # Wait for the file to become ACTIVE before using it.
        while uploaded.state.name == "PROCESSING":
            time.sleep(3)
            uploaded = client.files.get(name=uploaded.name)
        if uploaded.state.name != "ACTIVE":
            print(f"  ERROR: file state = {uploaded.state.name}, skipping")
            continue

        print("  generating extraction (continues until DONE sentinel seen)...")
        chat = client.chats.create(model=MODEL_NAME)
        response = _send_with_retry(chat, [uploaded, EXTRACTION_PROMPT])

        piece = response.text or ""
        pieces = [piece]
        finish_reason = _get_finish_reason(response)
        done = DONE_SENTINEL in piece
        continuations = 0

        # Keep going regardless of finish_reason (STOP OR MAX_TOKENS) until
        # we see the sentinel — a plain STOP with no sentinel means the model
        # quit early, not that it's actually finished.
        while not done and continuations < MAX_CONTINUATIONS:
            # An empty/near-empty response with STOP and no sentinel likely
            # means the model has nothing more to add — stop to avoid an
            # infinite loop of blank continuations.
            if finish_reason == "STOP" and len(piece.strip()) < 20 and continuations > 0:
                print("    got a near-empty STOP response with no sentinel — "
                      "assuming done (model gave no more content).")
                break
            continuations += 1
            print(f"    no DONE sentinel yet (finish_reason={finish_reason}), "
                  f"requesting continuation #{continuations}...")
            response = _send_with_retry(chat, CONTINUE_PROMPT)
            piece = response.text or ""
            pieces.append(piece)
            finish_reason = _get_finish_reason(response)
            done = DONE_SENTINEL in piece

        if not done:
            print(f"    WARNING: never saw {DONE_SENTINEL!r} after "
                  f"{MAX_CONTINUATIONS} continuations — output may be incomplete.")

        full_text = "".join(pieces).replace(DONE_SENTINEL, "").rstrip()
        out_path = OUTPUT_DIR / (pdf_path.stem + ".md")
        out_path.write_text(full_text, encoding="utf-8")
        print(f"  saved {out_path} ({len(full_text)} chars, "
              f"{continuations} continuation(s), done_sentinel_seen={done})\n")

        client.files.delete(name=uploaded.name)

    print(f"Done. Output in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
