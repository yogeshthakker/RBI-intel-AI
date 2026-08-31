"""Clause text -> structured requirement records.

Port of `03_extract_requirements.py`, moved off JSONL files and onto the
shared database. The v3 schema already declared a `requirements` table and
nothing in the package ever wrote a row to it; this is the missing writer.

Three things change in the move, all of them simplifications:

  * **The key.** The file pipeline minted `CREDIT-001`, `CREDIT-002` … from a
    counter that only made sense within one run of one script — re-run it after
    fixing a prompt and every ID shifted, invalidating anything that referenced
    them. Here the key is the clause it came from (`rbi:md:12798#CHIV-2`),
    which is stable across re-runs by construction.

  * **Resumability.** The notebook's `run_once()` guard existed to stop a
    kernel restart from re-spending 30 minutes of API quota. A row in the
    database is a better guard: extraction skips clauses that already have a
    requirement unless `--force`, so an interrupted run resumes exactly where
    it stopped.

  * **Quota death is a checkpoint, not a crash.** Each record is committed as
    it is produced. When the daily cap hits at clause 240 of 396, those 240
    rows are already durable and the run reports what remains.

JSON cache layer (added 2026-08-24):
  Every API response is appended to extract_cache/{safe_doc_id}.jsonl BEFORE
  the DB insert. If the DB is lost or corrupted, run restore_from_cache() to
  replay the JSONL file back into the DB without any API calls.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from .llm import LLMError, Provider, QuotaExhausted, default_sleep

SYSTEM_PROMPT = """You extract regulatory requirements from a single clause of an RBI Master Direction.

Rules:
- Paraphrase the requirement in your own words. Do not copy the source sentence verbatim.
- Stay strictly within what this clause says. Do not infer obligations from context outside the given text.
- If the clause is a bare heading, a chapter title, a cross-reference, or says only "Deleted." — set skip=true.
- If the text reads as garbled table or formula content with little sentence structure — set skip=true.
- If the clause sets a deadline, cadence, or numeric threshold, capture it exactly in timeline; otherwise use null.
- obligation_type must be one of: Governance, Process, Reporting, Screening, Timeline, Record-keeping, Assurance.
- branch_relevance: how directly does a bank branch (not head office or Board) carry out this obligation? High, Medium, or Low.
- applicability: which entities the clause binds, in a short phrase, if the clause says so; otherwise null.
- keywords: 4-8 short lowercase search terms a compliance officer would type to find this clause.

For clause_title: write a SHORT DESCRIPTIVE LABEL (3-7 words) capturing the SUBJECT of the obligation,
like "Board-approved credit risk policy" or "Large exposure reporting threshold".
NEVER write "Clause X" or echo the clause number as the title."""

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "skip":             {"type": "boolean"},
        "reason":           {"type": "string"},
        "clause_title":     {"type": "string"},
        "requirement":      {"type": "string"},
        "obligation_type":  {"type": "string",
                             "enum": ["Governance", "Process", "Reporting",
                                      "Screening", "Timeline", "Record-keeping", "Assurance"]},
        "branch_relevance": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "applicability":    {"type": "string"},
        "timeline":         {"type": "string"},
        "keywords":         {"type": "array", "items": {"type": "string"}},
    },
    "required": ["skip"],
}

OBLIGATION_TYPES = {"Governance", "Process", "Reporting", "Screening",
                    "Timeline", "Record-keeping", "Assurance"}
RELEVANCE = {"High", "Medium", "Low"}

# ---------------------------------------------------------------------------
# JSON cache helpers
# ---------------------------------------------------------------------------

def _cache_dir() -> Path:
    """extract_cache/ next to regdata.db, or next to rbi.py if DB path unknown."""
    db_path = os.environ.get("RBI_INTEL_DB", "")
    if db_path:
        base = Path(db_path).parent
    else:
        base = Path.home() / ".rbi-intel"
    cache = base / "extract_cache"
    cache.mkdir(parents=True, exist_ok=True)
    return cache


def _safe_id(doc_id: str) -> str:
    """Turn rbi:md:13159 → rbi_md_13159 for use as filename."""
    return re.sub(r"[^a-zA-Z0-9_-]", "_", doc_id)


def _cache_path(doc_id: str) -> Path:
    return _cache_dir() / f"{_safe_id(doc_id)}.jsonl"


def _append_to_cache(doc_id: str, clause_id: str, result: dict) -> None:
    """Append one clause result to the doc's JSONL cache file."""
    record = {"clause_id": clause_id, "doc_id": doc_id,
               "cached_at": _now(), "result": result}
    with _cache_path(doc_id).open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def _already_cached(doc_id: str) -> set[str]:
    """Return set of clause_ids already written to the JSONL cache."""
    path = _cache_path(doc_id)
    if not path.exists():
        return set()
    seen: set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                seen.add(rec["clause_id"])
            except (json.JSONDecodeError, KeyError):
                pass
    return seen


def restore_from_cache(conn: sqlite3.Connection, doc_id: str) -> dict:
    """
    Replay a doc's JSONL cache back into the DB — no API calls needed.
    Use this to recover after a DB loss or corruption.

    Usage:
        python rbi.py extract --from-cache rbi:md:13159
    """
    path = _cache_path(doc_id)
    if not path.exists():
        return {"error": f"No cache file found at {path}"}

    # We need clause rows to call store_requirement; build a lightweight proxy.
    clause_map: dict[str, sqlite3.Row] = {
        row["id"]: row
        for row in conn.execute(
            "SELECT c.id, c.doc_id, c.clause_label, c.chapter, c.text, d.title AS doc_title "
            "FROM clauses c JOIN documents d ON d.id = c.doc_id WHERE c.doc_id = ?",
            [doc_id],
        ).fetchall()
    }

    restored = skipped = errors = 0
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                clause_id = rec["clause_id"]
                result = rec["result"]
                model = result.get("_model", "restored-from-cache")

                if result.get("skip"):
                    skipped += 1
                    continue

                clause = clause_map.get(clause_id)
                if not clause:
                    errors += 1
                    print(f"[restore] clause {clause_id} not in DB — skipping", file=sys.stderr)
                    continue

                # Check if already in DB
                exists = conn.execute(
                    "SELECT 1 FROM requirements WHERE id = ?", [clause_id]
                ).fetchone()
                if exists:
                    skipped += 1
                    continue

                store_requirement(conn, clause, result, model)
                restored += 1
            except (json.JSONDecodeError, KeyError) as e:
                errors += 1
                print(f"[restore] bad line: {e}", file=sys.stderr)

    return {"cache_file": str(path), "restored": restored,
            "skipped": skipped, "errors": errors}


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def pending_clauses(
    conn: sqlite3.Connection,
    doc_id: str | None = None,
    force: bool = False,
    include_flagged: bool = False,
    limit: int | None = None,
) -> list[sqlite3.Row]:
    """Clauses awaiting extraction."""
    sql = [
        "SELECT c.id, c.doc_id, c.clause_label, c.chapter, c.text, d.title AS doc_title",
        "FROM clauses c JOIN documents d ON d.id = c.doc_id",
        "WHERE 1=1",
    ]
    params: list = []
    if doc_id:
        sql.append("AND c.doc_id = ?")
        params.append(doc_id)
    if not include_flagged:
        sql.append("AND c.needs_review = 0")
    if not force:
        sql.append("AND NOT EXISTS (SELECT 1 FROM requirements r WHERE r.clause_id = c.id)")
    sql.append("ORDER BY c.doc_id, c.seq")
    if limit:
        sql.append("LIMIT ?")
        params.append(limit)
    return conn.execute(" ".join(sql), params).fetchall()


def _clean_str(v) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return None if s.lower() in ("", "null", "none", "n/a", "na") else s


def store_requirement(conn: sqlite3.Connection, clause: sqlite3.Row, result: dict, model: str) -> None:
    obligation = _clean_str(result.get("obligation_type"))
    if obligation not in OBLIGATION_TYPES:
        obligation = None
    relevance = _clean_str(result.get("branch_relevance"))
    if relevance not in RELEVANCE:
        relevance = None

    keywords = result.get("keywords") or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",")]
    keywords = sorted({str(k).strip().lower() for k in keywords if str(k).strip()})

    title = _clean_str(result.get("clause_title")) or ""
    if title.lower().replace(" ", "") in (
        f"clause{clause['clause_label']}".lower().replace(" ", ""),
        clause["clause_label"].lower().replace(" ", ""),
    ):
        title = ""

    conn.execute(
        "INSERT INTO requirements (id, clause_id, doc_id, clause_title, requirement, "
        "obligation_type, applicability, branch_relevance, timeline, keywords, "
        "needs_review, extracted_at, model) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) "
        "ON CONFLICT(id) DO UPDATE SET clause_title=excluded.clause_title, "
        "requirement=excluded.requirement, obligation_type=excluded.obligation_type, "
        "applicability=excluded.applicability, branch_relevance=excluded.branch_relevance, "
        "timeline=excluded.timeline, keywords=excluded.keywords, "
        "needs_review=excluded.needs_review, extracted_at=excluded.extracted_at, "
        "model=excluded.model",
        (
            clause["id"], clause["id"], clause["doc_id"],
            title,
            _clean_str(result.get("requirement")) or "",
            obligation,
            _clean_str(result.get("applicability")),
            relevance,
            _clean_str(result.get("timeline")),
            json.dumps(keywords, ensure_ascii=False),
            int(not title or obligation is None),
            _now(),
            model,
        ),
    )
    conn.commit()


# ---------------------------------------------------------------------------
# Main extract loop
# ---------------------------------------------------------------------------

def extract(
    conn: sqlite3.Connection,
    provider: Provider,
    doc_id: str | None = None,
    force: bool = False,
    include_flagged: bool = False,
    limit: int | None = None,
    sleep: float | None = None,
    quiet: bool = False,
    from_cache: bool = False,
) -> dict:
    # Restore-from-cache mode: no API calls, just replay JSONL → DB.
    if from_cache:
        if not doc_id:
            return {"error": "--from-cache requires a doc_id argument"}
        return restore_from_cache(conn, doc_id)

    rows = pending_clauses(conn, doc_id, force, include_flagged, limit)
    if not rows:
        return {"clauses": 0, "kept": 0, "skipped": 0,
                "note": "nothing pending — pass --force to redo"}

    # Skip clauses already written to cache (handles mid-run crash resume
    # where DB was lost but cache file survived).
    cached_ids = _already_cached(doc_id or "__all__") if doc_id else set()
    if cached_ids and not force:
        pre = len(rows)
        rows = [r for r in rows if r["id"] not in cached_ids]
        if pre != len(rows):
            print(f"[extract] {pre - len(rows)} clauses already in cache — skipping",
                  file=sys.stderr)

    cache_doc_id = doc_id or "__all__"
    cache_file = _cache_path(cache_doc_id)
    print(f"[extract] JSON cache → {cache_file}", file=sys.stderr)

    pause = default_sleep(provider) if sleep is None else sleep
    kept = skipped = failed = 0
    stopped: str | None = None

    for i, c in enumerate(rows, 1):
        if not quiet:
            print(f"[extract] {i}/{len(rows)}  {c['id']}", file=sys.stderr)
        try:
            result = provider.json_call(
                system_prompt=SYSTEM_PROMPT,
                user_content=f"Clause {c['clause_label']}:\n{c['text']}",
                response_schema=RESPONSE_SCHEMA,
                max_output_tokens=1200,
            )
        except QuotaExhausted as e:
            stopped = str(e)
            print(f"[extract] STOPPED at {i}/{len(rows)}: {e}", file=sys.stderr)
            break
        except LLMError as e:
            failed += 1
            print(f"           !! {e}", file=sys.stderr)
            time.sleep(pause)
            continue

        # Tag result with model so restore_from_cache knows what model produced it.
        result["_model"] = provider.model

        # 1. Write to JSON cache FIRST (safe restore point).
        _append_to_cache(cache_doc_id, c["id"], result)

        # 2. Then write to DB.
        if result.get("skip"):
            skipped += 1
            if not quiet:
                print(f"           -> skipped ({result.get('reason') or 'n/a'})", file=sys.stderr)
        else:
            store_requirement(conn, c, result, provider.model)
            kept += 1

        time.sleep(pause)

    out = {
        "clauses": len(rows), "kept": kept, "skipped": skipped, "failed": failed,
        "remaining": len(rows) - kept - skipped - failed,
        "provider": provider.name, "model": provider.model,
        "cache_file": str(cache_file),
    }
    if stopped:
        out["stopped"] = stopped
    return out


# ---------------------------------------------------------------------------
# Gemini Batch API
# ---------------------------------------------------------------------------

def extract_batch(
    conn: sqlite3.Connection,
    provider: Provider,
    doc_ids: list[str],
    force: bool = False,
    include_flagged: bool = False,
    limit: int | None = None,
    poll_seconds: float = 30.0,
    quiet: bool = False,
) -> dict:
    """Extract multiple documents through Gemini Batch API, then use one DB writer."""
    if getattr(provider, 'name', None) != 'gemini':
        return {'error': 'Batch extraction currently supports --provider gemini only'}
    try:
        client = provider._client
    except AttributeError:
        return {'error': 'Gemini provider does not expose a Batch API client'}

    rows: list[sqlite3.Row] = []
    for doc_id in doc_ids:
        rows.extend(pending_clauses(conn, doc_id, force, include_flagged, limit))
    if not rows:
        return {'clauses': 0, 'kept': 0, 'skipped': 0, 'failed': 0,
                'note': 'nothing pending — pass --force to redo'}

    # Batch output preserves input order, but we also carry the stable clause id in metadata.
    requests = []
    for c in rows:
        requests.append({
            'contents': [{
                'parts': [{'text': f"Clause {c['clause_label']}:\\n{c['text']}"}],
                'role': 'user',
            }],
            'config': {
                'system_instruction': SYSTEM_PROMPT,
                'temperature': 0.2,
                'max_output_tokens': 1200,
                'response_mime_type': 'application/json',
                'response_json_schema': RESPONSE_SCHEMA,
            },
            'metadata': {'key': c['id']},
        })

    display_name = 'rbi-extract-' + '-'.join(d.replace(':', '_') for d in doc_ids)
    if not quiet:
        print(f'[batch] submitting {len(requests)} clauses', file=sys.stderr)
    job = client.batches.create(
        model=provider.model,
        src=requests,
        config={'display_name': display_name[:128]},
    )
    job_name = job.name
    print(f'[batch] job → {job_name}', file=sys.stderr)

    done = {'JOB_STATE_SUCCEEDED', 'JOB_STATE_FAILED', 'JOB_STATE_CANCELLED', 'JOB_STATE_EXPIRED'}
    while True:
        job = client.batches.get(name=job_name)
        state = getattr(getattr(job, 'state', None), 'name', str(getattr(job, 'state', 'UNKNOWN')))
        if state in done:
            break
        if not quiet:
            print(f'[batch] state={state}; waiting {poll_seconds:.0f}s', file=sys.stderr)
        time.sleep(poll_seconds)

    if state != 'JOB_STATE_SUCCEEDED':
        return {'clauses': len(rows), 'kept': 0, 'skipped': 0, 'failed': 0,
                'remaining': len(rows), 'provider': provider.name, 'model': provider.model,
                'batch_job': job_name, 'state': state, 'error': str(getattr(job, 'error', ''))}

    responses = list(getattr(getattr(job, 'dest', None), 'inlined_responses', None) or [])
    kept = skipped = failed = 0
    # One writer: all completed model calls are processed sequentially here.
    for c, item in zip(rows, responses):
        try:
            response = getattr(item, 'response', None)
            if not response:
                raise ValueError(str(getattr(item, 'error', 'batch item failed')))
            text = (response.text or '').strip()
            result = json.loads(text)
            if not isinstance(result, dict):
                raise ValueError('response is not a JSON object')
            result['_model'] = provider.model
            _append_to_cache(c['doc_id'], c['id'], result)
            if result.get('skip'):
                skipped += 1
            else:
                store_requirement(conn, c, result, provider.model)
                kept += 1
        except Exception as e:
            failed += 1
            print(f'[batch] {c["id"]} failed: {e}', file=sys.stderr)

    if len(responses) < len(rows):
        failed += len(rows) - len(responses)
    return {'clauses': len(rows), 'kept': kept, 'skipped': skipped, 'failed': failed,
            'remaining': len(rows) - kept - skipped - failed,
            'provider': provider.name, 'model': provider.model,
            'batch_job': job_name, 'state': state,
            'doc_ids': doc_ids}
