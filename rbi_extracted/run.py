#!/usr/bin/env python3
"""Single-command launcher for the RBI Intelligence Streamlit dashboard.

Usage:
    python run.py
    python run.py --db C:\\path\\to\\regdata.db
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_DB = Path.home() / ".rbi-intel" / "regdata.db"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run RBI Intelligence dashboard")
    parser.add_argument("--db", help="Path to SQLite database")
    parser.add_argument("--port", type=int, default=8501, help="Dashboard port (default: 8501)")
    args = parser.parse_args()

    db_path = Path(args.db).expanduser().resolve() if args.db else DEFAULT_DB

    if not db_path.exists():
        print(f"Database not found: {db_path}")
        print("Set RBI_INTEL_DB or run with: python run.py --db <path-to-regdata.db>")
        return 1

    try:
        import streamlit  # noqa: F401
        import pandas  # noqa: F401
    except ImportError as exc:
        print(f"Missing Python package: {exc.name}")
        print("Install dashboard dependencies with: pip install streamlit pandas")
        return 1

    env = os.environ.copy()
    env["RBI_INTEL_DB"] = str(db_path)

    print("Starting RBI Intelligence dashboard...")
    print(f"Database: {db_path}")

    command = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(ROOT / "streamlit_app.py"),
        "--server.port",
        str(args.port),
    ]

    return subprocess.call(command, cwd=str(ROOT), env=env)


if __name__ == "__main__":
    raise SystemExit(main())
