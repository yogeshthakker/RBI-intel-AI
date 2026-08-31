"""Report on unresolved relation edges — repeal/supersession/amendment
references that `relations.py` found in document text but could not match to
a document actually in the database.

An unresolved edge is not a bug by itself (see relations.py's module
docstring — it's deliberately kept rather than discarded, as a record of the
gap). This module just makes that backlog *actionable*: it estimates how
recent each unresolved reference is, so a human can decide which ones are
worth chasing down with `python rbi.py ingest` and which are old history not
worth the effort.

Recency is estimated two ways, in priority order:
  1. An explicit "dated <Month DD, YYYY>" phrase in the evidence sentence —
     exact date, highest confidence.
  2. A fiscal-year token embedded in the reference itself, e.g. the "2025-26"
     in "DOR.AML.REC.48/14.06.001/2025-26" or "RBI/2025-26/76" — the first
     year of the range is used as an approximation.
If neither is present the row is bucketed as "unknown".
"""
from __future__ import annotations

import csv
import re
import sqlite3
from dataclasses import dataclass
from datetime import date, datetime

MONTH = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*"
RE_DATED = re.compile(r"\bdated\s+(" + MONTH + r"\s+\d{1,2},?\s+\d{4})", re.I)
RE_FISCAL_YEAR = re.compile(r"/(\d{4})-\d{2,4}\b")

MONTH_NUM = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], start=1)}


def _parse_dated(s: str) -> date | None:
    m = re.match(r"([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})", s.strip())
    if not m:
        return None
    mon = MONTH_NUM.get(m.group(1)[:3].lower())
    if not mon:
        return None
    try:
        return date(int(m.group(3)), mon, int(m.group(2)))
    except ValueError:
        return None


def estimate_date(dst_ref_text: str, evidence: str) -> tuple[date | None, str]:
    """Return (best-guess date or None, how it was derived)."""
    m = RE_DATED.search(evidence or "")
    if m:
        d = _parse_dated(m.group(1))
        if d:
            return d, "dated-phrase"
    m = RE_FISCAL_YEAR.search(dst_ref_text or "")
    if m:
        # Fiscal year 2025-26 starts April 2025 — use April 1 as a stand-in.
        return date(int(m.group(1)), 4, 1), "fiscal-year"
    return None, "unknown"


def bucket_for(d: date | None, today: date) -> str:
    if d is None:
        return "unknown (no date found in citation)"
    age_days = (today - d).days
    if age_days < 0:
        return "unknown (no date found in citation)"
    if age_days <= 2 * 365:
        return "last 2 years — likely worth backfilling"
    if age_days <= 5 * 365:
        return "2-5 years — maybe worth backfilling"
    if age_days <= 10 * 365:
        return "5-10 years — probably old history"
    return "10+ years — old history, low priority"


@dataclass
class GapRow:
    rel_type: str
    src_id: str
    src_title: str
    src_date: str
    dst_ref_text: str
    guessed_date: str
    date_source: str
    bucket: str
    evidence: str


def build_report(conn: sqlite3.Connection) -> list[GapRow]:
    rows = conn.execute(
        """
        SELECT r.rel_type, r.src_id, r.dst_ref_text, r.evidence,
               d.title AS src_title, d.date AS src_date
        FROM relations r
        LEFT JOIN documents d ON d.id = r.src_id
        WHERE r.dst_id IS NULL
        ORDER BY r.rel_type, r.src_id
        """
    ).fetchall()

    today = datetime.now().date()
    out: list[GapRow] = []
    for r in rows:
        guessed, source = estimate_date(r["dst_ref_text"], r["evidence"])
        out.append(GapRow(
            rel_type=r["rel_type"],
            src_id=r["src_id"],
            src_title=r["src_title"] or "",
            src_date=r["src_date"] or "",
            dst_ref_text=r["dst_ref_text"] or "",
            guessed_date=guessed.isoformat() if guessed else "",
            date_source=source,
            bucket=bucket_for(guessed, today),
            evidence=(r["evidence"] or "")[:300],
        ))
    return out


def run(conn: sqlite3.Connection, out_path: str, verbose: bool = True) -> dict:
    rows = build_report(conn)

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["rel_type", "src_id", "src_title", "src_date", "dst_ref_text",
                    "guessed_date", "date_source", "bucket", "evidence"])
        for r in rows:
            w.writerow([r.rel_type, r.src_id, r.src_title, r.src_date, r.dst_ref_text,
                        r.guessed_date, r.date_source, r.bucket, r.evidence])

    bucket_counts: dict[str, int] = {}
    rel_counts: dict[str, int] = {}
    for r in rows:
        bucket_counts[r.bucket] = bucket_counts.get(r.bucket, 0) + 1
        rel_counts[r.rel_type] = rel_counts.get(r.rel_type, 0) + 1

    if verbose:
        print(f"[gaps] {len(rows)} unresolved relation edges analysed")
        print(f"[gaps] full detail written to {out_path}")
        print()
        print("By recency:")
        order = [
            "last 2 years — likely worth backfilling",
            "2-5 years — maybe worth backfilling",
            "5-10 years — probably old history",
            "10+ years — old history, low priority",
            "unknown (no date found in citation)",
        ]
        for b in order:
            if b in bucket_counts:
                print(f"  {bucket_counts[b]:>4}  {b}")
        print()
        print("By relation type:")
        for rt, n in sorted(rel_counts.items(), key=lambda x: -x[1]):
            print(f"  {n:>4}  {rt}")

    return {"total": len(rows), "by_bucket": bucket_counts, "by_rel_type": rel_counts, "out_path": out_path}
