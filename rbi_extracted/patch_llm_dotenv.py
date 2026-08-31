"""
Patches python/rbi_intel/llm.py's _load_dotenv() to:
  1. Also check D:\\Downloads\\.env as a fallback (in addition to the
     project-root .env it already checks) -- this user's real .env lives
     there, not in the project folder.
  2. Alias this user's shorthand key names (google/open/unstrctured) to the
     standard ones (GEMINI_API_KEY/OPENROUTER_API_KEY/UNSTRUCTURED_API_KEY).

Uses a regex match (tolerant of exact dash/quote characters in comments)
instead of an exact-text match, so small unicode differences don't block
the patch. Makes a .bak backup before writing. Safe to re-run (idempotent).

Usage:
    python patch_llm_dotenv.py
"""
import re
from pathlib import Path

TARGET = Path(__file__).parent / "python" / "rbi_intel" / "llm.py"

# Matches from the function definition through the closing "pass" line of
# its try/except, regardless of exact comment wording/dash characters.
PATTERN = re.compile(
    r"def _load_dotenv\(\) -> None:.*?except OSError:\s*\n\s*pass[^\n]*\n",
    re.DOTALL,
)

NEW = '''# This user keeps a real .env at D:\\Downloads\\.env (outside the project
# folder) using shorthand key names instead of the standard ones below.
_ENV_KEY_ALIASES = {
    "unstrctured": "UNSTRUCTURED_API_KEY",
    "unstructured": "UNSTRUCTURED_API_KEY",
    "open": "OPENROUTER_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "google": "GEMINI_API_KEY",
    "gemini": "GEMINI_API_KEY",
}


def _load_dotenv() -> None:
    """
    Load KEY=VALUE lines from a `.env` file, so an API key can live in a
    plain text file instead of needing `setx`/`$env:` in every terminal.
    Checks the project root first (the folder containing rbi.py -- two
    levels up from this file), then D:\\Downloads\\.env as a fallback (where
    this user actually keeps theirs).

    A real environment variable always wins -- this only fills in a key that
    isn't already set. Blank lines and lines starting with '#' are skipped;
    values may be optionally wrapped in quotes. Shorthand key names are
    aliased to the standard ones via _ENV_KEY_ALIASES.
    """
    candidates = [
        Path(__file__).resolve().parents[2] / ".env",
        Path(r"D:\\Downloads\\.env"),
    ]
    for env_path in candidates:
        if not env_path.is_file():
            continue
        try:
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
        except OSError:
            pass  # best-effort
        break
'''


def main():
    if not TARGET.is_file():
        raise SystemExit(f"Not found: {TARGET}")

    text = TARGET.read_text(encoding="utf-8")

    if "_ENV_KEY_ALIASES" in text:
        print("Already patched — nothing to do.")
        return

    match = PATTERN.search(text)
    if not match:
        raise SystemExit(
            "Could not find _load_dotenv() via regex either. Printing a "
            "50-line window around the function so we can see what's "
            "actually there:\n\n"
            + "\n".join(
                text.splitlines()[
                    max(0, text[: text.find("_load_dotenv")].count("\n") - 5)
                    : text[: text.find("_load_dotenv")].count("\n") + 45
                ]
            )
        )

    backup_path = TARGET.with_suffix(".py.bak")
    backup_path.write_text(text, encoding="utf-8")
    print(f"Backup written to {backup_path}")

    new_text = text[: match.start()] + NEW + text[match.end():]
    TARGET.write_text(new_text, encoding="utf-8")
    print(f"Patched {TARGET}")


if __name__ == "__main__":
    main()
