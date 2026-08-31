"""Provider-agnostic JSON-mode LLM access for the analysis layer.

Ported from the standalone pipeline's `gemini_helper.py`, generalised so the
backend is a configuration choice rather than an import scattered through five
scripts. The original project hit this the hard way: `03_extract_requirements.py`
was switched from Anthropic to Gemini, and `04`, `06` and the Streamlit app
were each left behind on a dead `import anthropic` — three separate places to
remember, three separate ways to be broken.

Everything a caller needs is `get_provider()` and `provider.json_call(...)`.

Selection, in order:
    RBI_INTEL_LLM=gemini|anthropic|stub   explicit choice
    GEMINI_API_KEY / GOOGLE_API_KEY set   -> gemini
    ANTHROPIC_API_KEY set                 -> anthropic
    otherwise                             -> error naming both env vars

The `stub` provider returns deterministic canned JSON. It exists so the whole
ingest -> chunk -> extract -> scaffold -> validate chain can be exercised in
tests and on an air-gapped machine without spending a single token.

What is preserved verbatim from `gemini_helper.py`, because it was learned
against the real free tier and is the difference between a 30-second failure
and a 30-minute one:

  * a temporary 429 (per-minute throttle) is retried with Google's own
    suggested delay, parsed out of the error text;
  * a *daily* quota exhaustion is detected and raised immediately — retrying
    it only burns wall-clock time, since nothing resets until tomorrow;
  * a 404 is reported as "the model name is wrong", not as a transient fault.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Protocol


# This user keeps a real .env at D:\Downloads\.env (outside the project
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
    levels up from this file), then D:\Downloads\.env as a fallback (where
    this user actually keeps theirs).

    A real environment variable always wins -- this only fills in a key that
    isn't already set. Blank lines and lines starting with '#' are skipped;
    values may be optionally wrapped in quotes. Shorthand key names are
    aliased to the standard ones via _ENV_KEY_ALIASES.
    """
    candidates = [
        Path(__file__).resolve().parents[2] / ".env",
        Path(r"D:\Downloads\.env"),
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


_load_dotenv()


class QuotaExhausted(RuntimeError):
    """A hard, non-retryable quota limit — daily cap, or credit exhausted.

    Callers should catch this and checkpoint rather than abort: extraction is
    resumable, so a run that dies at clause 240 of 396 should leave those 240
    rows committed and say so.
    """


class LLMError(RuntimeError):
    """Any other unrecoverable provider failure."""


# ---------------------------------------------------------------------------
# Interface
# ---------------------------------------------------------------------------

class Provider(Protocol):
    name: str
    model: str

    def json_call(
        self,
        system_prompt: str,
        user_content: str,
        response_schema: dict | None = None,
        max_output_tokens: int = 1200,
    ) -> dict:
        """Return a parsed JSON object. Raises QuotaExhausted / LLMError."""
        ...


def strip_json_fences(raw: str) -> str:
    """Defensive cleanup for providers not using native structured output."""
    text = raw.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _parse_json(raw: str, provider: str) -> dict:
    try:
        return json.loads(strip_json_fences(raw))
    except json.JSONDecodeError as e:
        # Truncation is by far the most common cause: JSON-schema mode adds
        # framing overhead, and a max_output_tokens that was fine for simple
        # clauses silently cuts long ones off mid-string.
        raise LLMError(
            f"{provider} returned unparseable JSON ({e}). "
            f"If this is frequent, raise max_output_tokens. "
            f"First 200 chars: {raw[:200]!r}"
        ) from e


# ---------------------------------------------------------------------------
# Gemini
# ---------------------------------------------------------------------------

_DAILY_MARKERS = (
    "generate_requestsperday",
    "generaterequestsperday",
    "perdayperprojectpermodel",
)


def _is_daily_quota(text: str) -> bool:
    low = text.lower()
    if any(m in low for m in _DAILY_MARKERS):
        return True
    return "perday" in low and "quota" in low


_RETRY_DELAY_RE = re.compile(r"retry in\s+([0-9]+(?:\.[0-9]+)?)s", re.I)


def _suggested_delay(text: str, default: float) -> float:
    m = _RETRY_DELAY_RE.search(text)
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            pass
    return default


class GeminiProvider:
    name = "gemini"
    # Change the default in one place, not in every caller.
    DEFAULT_MODEL = "gemini-2.5-flash-lite"

    def __init__(self, model: str | None = None, max_retries: int = 5):
        try:
            from google import genai  # noqa: F401
        except ImportError as e:
            raise LLMError(
                "google-genai is not installed.  pip install google-genai"
            ) from e
        from google import genai

        key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not key:
            raise LLMError("Set GEMINI_API_KEY (get one free at aistudio.google.com/apikey).")

        self.model = model or os.environ.get("RBI_INTEL_MODEL") or self.DEFAULT_MODEL
        self.max_retries = max_retries
        self._client = genai.Client(api_key=key)

    def json_call(self, system_prompt, user_content, response_schema=None, max_output_tokens=1200) -> dict:
        from google.genai import errors, types

        cfg: dict[str, Any] = dict(
            system_instruction=system_prompt,
            max_output_tokens=max_output_tokens,
            temperature=0.2,
        )
        if response_schema is not None:
            cfg["response_mime_type"] = "application/json"
            cfg["response_json_schema"] = response_schema

        delay = 8.0
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self._client.models.generate_content(
                    model=self.model,
                    contents=user_content,
                    config=types.GenerateContentConfig(**cfg),
                )
                text = (resp.text or "").strip()
                if not text:
                    raise LLMError(f"Gemini returned an empty response (model={self.model}).")
                return _parse_json(text, "gemini")

            except errors.ClientError as e:
                msg = str(e)
                if e.code == 429 and _is_daily_quota(msg):
                    raise QuotaExhausted(
                        f"Gemini daily quota exhausted for model '{self.model}'. "
                        f"This is a per-day cap, not a per-minute throttle — retrying "
                        f"will not help. Wait for the reset, switch model, or set "
                        f"RBI_INTEL_LLM=anthropic."
                    ) from e
                if e.code == 404:
                    raise LLMError(
                        f"Gemini model '{self.model}' not found. Check the model list in "
                        f"Google AI Studio and set RBI_INTEL_MODEL."
                    ) from e
                if e.code == 429:
                    if attempt >= self.max_retries:
                        raise LLMError(
                            f"Gemini still rate-limited after {self.max_retries} attempts."
                        ) from e
                    wait = min(_suggested_delay(msg, delay), 120.0)
                    print(
                        f"[llm] gemini 429; waiting {wait:.1f}s "
                        f"(attempt {attempt}/{self.max_retries})",
                        file=sys.stderr,
                    )
                    time.sleep(wait)
                    delay = min(delay * 1.7, 120.0)
                    continue
                raise

            except errors.ServerError as e:
                if e.code == 503:
                    if attempt >= self.max_retries:
                        raise LLMError(
                            f"Gemini server unavailable (503) after {self.max_retries} attempts."
                        ) from e
                    wait = min(delay, 120.0)
                    print(
                        f"[llm] gemini 503 server overload; waiting {wait:.1f}s "
                        f"(attempt {attempt}/{self.max_retries})",
                        file=sys.stderr,
                    )
                    time.sleep(wait)
                    delay = min(delay * 1.7, 120.0)
                    continue
                raise

        raise LLMError(f"Gemini request failed after {self.max_retries} attempts.")


# ---------------------------------------------------------------------------
# Anthropic
# ---------------------------------------------------------------------------

class AnthropicProvider:
    name = "anthropic"
    DEFAULT_MODEL = "claude-sonnet-4-6"

    def __init__(self, model: str | None = None, max_retries: int = 5):
        try:
            import anthropic  # noqa: F401
        except ImportError as e:
            raise LLMError("anthropic is not installed.  pip install anthropic") from e
        import anthropic

        if not os.environ.get("ANTHROPIC_API_KEY"):
            raise LLMError("Set ANTHROPIC_API_KEY.")
        self.model = model or os.environ.get("RBI_INTEL_MODEL") or self.DEFAULT_MODEL
        self.max_retries = max_retries
        self._client = anthropic.Anthropic()

    def json_call(self, system_prompt, user_content, response_schema=None, max_output_tokens=1200) -> dict:
        import anthropic

        # No native JSON-schema mode: append the schema to the system prompt and
        # strip fences on the way out. Same contract, weaker enforcement.
        sys_prompt = system_prompt
        if response_schema is not None:
            sys_prompt += (
                "\n\nReturn ONLY a single JSON object conforming to this schema. "
                "No prose, no markdown fences.\n"
                + json.dumps(response_schema, indent=2)
            )

        delay = 5.0
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self._client.messages.create(
                    model=self.model,
                    max_tokens=max_output_tokens,
                    system=sys_prompt,
                    temperature=0.2,
                    messages=[{"role": "user", "content": user_content}],
                )
                text = "".join(b.text for b in resp.content if b.type == "text").strip()
                if not text:
                    raise LLMError(f"Anthropic returned an empty response (model={self.model}).")
                return _parse_json(text, "anthropic")

            except anthropic.RateLimitError as e:
                if attempt >= self.max_retries:
                    raise LLMError(f"Anthropic still rate-limited after {self.max_retries} attempts.") from e
                print(f"[llm] anthropic 429; waiting {delay:.1f}s "
                      f"(attempt {attempt}/{self.max_retries})", file=sys.stderr)
                time.sleep(delay)
                delay = min(delay * 1.7, 120.0)
            except anthropic.APIStatusError as e:
                # A zero credit balance surfaces as 400 with a specific message,
                # not as a rate limit. It is the same class of problem as a
                # Gemini daily cap: stop, do not retry.
                if "credit balance" in str(e).lower():
                    raise QuotaExhausted(
                        "Anthropic credit balance is too low. Top up, or set "
                        "RBI_INTEL_LLM=gemini to use the free tier."
                    ) from e
                if e.status_code == 404:
                    raise LLMError(f"Anthropic model '{self.model}' not found.") from e
                raise
        raise LLMError(f"Anthropic request failed after {self.max_retries} attempts.")


# ---------------------------------------------------------------------------
# OpenRouter
# ---------------------------------------------------------------------------

class OpenRouterProvider:
    """
    OpenAI-compatible chat-completions API in front of many models, including
    a rotating set of free (":free" suffix) ones. Used here mainly as a
    fallback when Gemini's daily quota runs out — OpenRouter's own free tier
    is much smaller (50 requests/day unfunded, 1,000/day after $10 lifetime
    spend, vs. Gemini's 1,500/day), so it is not a volume upgrade on its own.

    No response_format / JSON-schema mode here on purpose: free-tier model
    support for structured output is inconsistent, so — same approach as
    AnthropicProvider — the schema is appended to the system prompt and
    fences are stripped on the way out. Weaker enforcement, works everywhere.

    Free model IDs rotate. Check https://openrouter.ai/models?fmt=free for
    what's currently live if the default 404s.
    """

    name = "openrouter"
    DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
    API_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, model: str | None = None, max_retries: int = 3):
        key = os.environ.get("OPENROUTER_API_KEY")
        if not key:
            raise LLMError("Set OPENROUTER_API_KEY (openrouter.ai/keys).")
        self.model = model or os.environ.get("RBI_INTEL_MODEL") or self.DEFAULT_MODEL
        self.max_retries = max_retries
        self._key = key

    def json_call(self, system_prompt, user_content, response_schema=None, max_output_tokens=1200) -> dict:
        import urllib.request
        import urllib.error

        sys_prompt = system_prompt
        if response_schema is not None:
            sys_prompt += (
                "\n\nReturn ONLY a single JSON object conforming to this schema. "
                "No prose, no markdown fences.\n"
                + json.dumps(response_schema, indent=2)
            )

        body = json.dumps({
            "model": self.model,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_content},
            ],
            "temperature": 0.2,
            "max_tokens": max_output_tokens,
        }).encode("utf-8")

        req = urllib.request.Request(
            self.API_URL,
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self._key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/sber-india/rbi-intel",
                "X-Title": "rbi-intel",
            },
        )

        delay = 10.0
        for attempt in range(1, self.max_retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    payload = json.loads(resp.read().decode("utf-8"))
                text = (payload["choices"][0]["message"]["content"] or "").strip()
                if not text:
                    raise LLMError(f"OpenRouter returned an empty response (model={self.model}).")
                return _parse_json(text, "openrouter")

            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8", errors="replace")
                if e.code == 402:
                    raise QuotaExhausted(
                        f"OpenRouter is out of credits/quota for model '{self.model}'. "
                        f"{err_body[:200]}"
                    ) from e
                if e.code == 404:
                    raise LLMError(
                        f"OpenRouter model '{self.model}' not found. Free model IDs rotate — "
                        f"check https://openrouter.ai/models?fmt=free and set RBI_INTEL_MODEL "
                        f"(or RBI_INTEL_FALLBACK_MODEL if used as a fallback)."
                    ) from e
                if e.code == 429:
                    if attempt >= self.max_retries:
                        raise QuotaExhausted(
                            f"OpenRouter still rate-limited after {self.max_retries} attempts — "
                            f"likely the daily free-tier cap (50-1,000/day), not a transient "
                            f"per-minute throttle. {err_body[:200]}"
                        ) from e
                    print(
                        f"[llm] openrouter 429; waiting {delay:.1f}s "
                        f"(attempt {attempt}/{self.max_retries})",
                        file=sys.stderr,
                    )
                    time.sleep(delay)
                    delay = min(delay * 1.7, 60.0)
                    continue
                raise LLMError(f"OpenRouter request failed: {e.code} {err_body[:300]}") from e
        raise LLMError(f"OpenRouter request failed after {self.max_retries} attempts.")


# ---------------------------------------------------------------------------
# Fallback wrapper — primary provider, with a second provider to switch to
# once the primary's quota is exhausted for the rest of this run.
# ---------------------------------------------------------------------------

class FallbackProvider:
    """
    Tries `primary` first; on QuotaExhausted, switches to `secondary` for
    every subsequent call in this process (does not retry the primary again —
    a daily quota does not reset mid-run). A long extract/scaffold job can
    therefore burn through Gemini's free daily cap and keep going on
    OpenRouter instead of stopping partway through hundreds of clauses.
    """

    def __init__(self, primary: Provider, secondary: Provider):
        self.primary = primary
        self.secondary = secondary
        self._switched = False
        self.name = f"{primary.name}+{secondary.name}-fallback"
        self.model = primary.model

    def json_call(self, *args, **kwargs) -> dict:
        if not self._switched:
            try:
                return self.primary.json_call(*args, **kwargs)
            except QuotaExhausted as e:
                print(
                    f"[llm] {self.primary.name} quota exhausted ({e}); "
                    f"switching to {self.secondary.name} for the rest of this run.",
                    file=sys.stderr,
                )
                self._switched = True
        return self.secondary.json_call(*args, **kwargs)


# ---------------------------------------------------------------------------
# Stub — offline, deterministic, free
# ---------------------------------------------------------------------------

class StubProvider:
    """Deterministic canned responses. No network, no key, no cost.

    Used by the test suite and by `--provider stub` so the pipeline's plumbing
    can be verified independently of whether any API is reachable — which on
    the target network is a real and recurring question.
    """

    name = "stub"
    model = "stub-v1"

    def json_call(self, system_prompt, user_content, response_schema=None, max_output_tokens=1200) -> dict:
        head = user_content.strip().splitlines()[0][:60] if user_content.strip() else ""
        low = user_content.lower()

        # Shape the reply from the schema's own required keys so the stub keeps
        # working when a prompt changes.
        keys = set((response_schema or {}).get("properties", {}))

        if "skip" in keys:
            trivial = any(t in low for t in ("short title", "commencement", "definitions"))
            return {
                "skip": trivial,
                "reason": "stub: heading/definition clause" if trivial else "",
                "clause_title": f"Stub title for {head}"[:70],
                "requirement": "Stub requirement generated offline; not derived from the clause text.",
                "obligation_type": "Process",
                "branch_relevance": "Medium",
                "timeline": "",
                "keywords": ["stub", "offline", "placeholder"],
            }

        if "mapping" in keys:
            return {
                "business_area_guess": "Stub Business Area",
                "mapping": {
                    "policy": "Stub Policy", "process": "Stub Process", "control": "Stub Control",
                    "control_type": "Preventive",
                    "owner_process": "Branch Risk & Compliance Officer",
                    "owner_control": "Head — Internal Audit",
                    "evidence_required": "Stub evidence",
                },
                "assessment": {
                    "classification": "To Be Confirmed",
                    "finding": "Stub finding produced offline with no model call.",
                    "recommendation": "Replace with a real assessment.",
                    "severity": "Medium",
                },
            }

        return {"answer": "Stub answer produced offline with no model call.", "citations": []}


# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------

_PROVIDERS = {
    "gemini": GeminiProvider,
    "anthropic": AnthropicProvider,
    "openrouter": OpenRouterProvider,
    "stub": StubProvider,
}


def get_provider(name: str | None = None, model: str | None = None) -> Provider:
    choice = (name or os.environ.get("RBI_INTEL_LLM") or "").strip().lower()

    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")

    if not choice:
        # Default: Gemini primary (1,500 free requests/day) with OpenRouter as
        # an automatic fallback once that daily quota is hit (OpenRouter's own
        # free tier is far smaller — see OpenRouterProvider's docstring — so
        # this order matters, it is not interchangeable).
        if gemini_key and openrouter_key:
            primary = GeminiProvider(model=model)
            fallback_model = os.environ.get("RBI_INTEL_FALLBACK_MODEL")
            secondary = OpenRouterProvider(model=fallback_model)
            return FallbackProvider(primary, secondary)
        if gemini_key:
            choice = "gemini"
        elif openrouter_key:
            choice = "openrouter"
        elif anthropic_key:
            choice = "anthropic"
        else:
            raise LLMError(
                "No LLM provider configured. Set one of:\n"
                "  GEMINI_API_KEY      free tier, 1,500 req/day, aistudio.google.com/apikey\n"
                "  OPENROUTER_API_KEY  free tier, 50-1,000 req/day, openrouter.ai/keys\n"
                "  ANTHROPIC_API_KEY   paid\n"
                "Set both GEMINI_API_KEY and OPENROUTER_API_KEY to use Gemini with an "
                "automatic OpenRouter fallback when the daily quota runs out.\n"
                "Or run with --provider stub for an offline dry run."
            )

    if choice not in _PROVIDERS:
        raise LLMError(f"Unknown provider '{choice}'. Choose from: {', '.join(_PROVIDERS)}")

    cls = _PROVIDERS[choice]
    return cls(model=model) if choice != "stub" else cls()  # type: ignore[call-arg]


def default_sleep(provider: Provider) -> float:
    """Polite inter-call delay.

    4.5s keeps the Gemini free tier under ~13 RPM, which is where the original
    pipeline settled after hitting 429s at anything faster. OpenRouter's free
    tier caps at 20 RPM, so 3.5s keeps a safe margin under that.
    """
    base = {"gemini": 4.5, "anthropic": 0.3, "openrouter": 3.5, "stub": 0.0}
    if provider.name in base:
        return base[provider.name]
    if "+" in provider.name:  # FallbackProvider, e.g. "gemini+openrouter-fallback"
        return 4.5
    return 1.0
