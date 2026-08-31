"""
Step 1 of 4: create a single Unstructured job that processes every file in
INPUT_DIR at once.

Setup (one time):
    pip install "unstructured-client>=0.30.6"
    Put your key in UNSTRUCTURED_API_KEY (a real env var, or a .env file
    next to this script containing a line like: UNSTRUCTURED_API_KEY=sk-...)

Usage:
    Put your PDFs (or other source files) in ./unstructured_input/, then:
    python unstructured_1_create_job.py

What this does:
    1. Creates (or reuses) a "basic" workflow — Unstructured's own default
       partitioning pipeline, no custom DAG needed for straightforward
       PDF-to-structured-JSON extraction.
    2. Runs that workflow with every file in INPUT_DIR attached as input —
       one job covering all of them, not one job per file.
    3. Saves the workflow_id and job_id to unstructured_job_state.json so
       the poll/download scripts (or the combined script) can pick them up
       without you having to copy IDs around by hand.

Reference: https://docs.unstructured.io/api-reference/quickstart/*
(workflow/job model verified directly against the installed
unstructured-client SDK's request/response classes, since the hosted docs
pages did not reliably return complete code samples.)
"""
import json
import os
from pathlib import Path

STATE_FILE = Path(__file__).parent / "unstructured_job_state.json"
INPUT_DIR = Path(__file__).parent / "unstructured_input"
WORKFLOW_NAME = "rbi-intel-pdf-extraction"


def _load_env_file() -> None:
    """Read KEY=VALUE lines from a .env file next to this script. A real
    environment variable already set always wins over the file."""
    env_path = Path(__file__).parent / ".env"
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def _get_client():
    from unstructured_client import UnstructuredClient

    _load_env_file()
    key = os.environ.get("UNSTRUCTURED_API_KEY")
    if not key:
        raise SystemExit(
            "Set UNSTRUCTURED_API_KEY (as a real env var, or in a .env file "
            "next to this script) before running."
        )
    return UnstructuredClient(api_key_auth=key)


def _read_state() -> dict:
    if STATE_FILE.is_file():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {}


def _write_state(**updates) -> None:
    state = _read_state()
    state.update(updates)
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    print(f"[state] wrote {STATE_FILE} -> {state}")


def get_or_create_workflow(client) -> str:
    from unstructured_client.models.operations.create_workflow import CreateWorkflowRequest
    from unstructured_client.models.shared.createworkflow import CreateWorkflow
    from unstructured_client.models.shared.workflowtype import WorkflowType

    state = _read_state()
    existing_id = state.get("workflow_id")
    if existing_id:
        print(f"[workflow] reusing existing workflow_id={existing_id}")
        return existing_id

    print(f"[workflow] creating a new 'basic' workflow named '{WORKFLOW_NAME}'…")
    resp = client.workflows.create_workflow(
        request=CreateWorkflowRequest(
            create_workflow=CreateWorkflow(
                name=WORKFLOW_NAME,
                workflow_type=WorkflowType.BASIC,
            )
        )
    )
    workflow_id = resp.workflow_information.id
    print(f"[workflow] created workflow_id={workflow_id}")
    _write_state(workflow_id=workflow_id)
    return workflow_id


def run_job_with_all_files(client, workflow_id: str) -> str:
    from unstructured_client.models.operations.run_workflow import RunWorkflowRequest
    from unstructured_client.models.shared.body_run_workflow import (
        BodyRunWorkflow,
        BodyRunWorkflowInputFiles,
    )

    if not INPUT_DIR.is_dir():
        raise SystemExit(
            f"Input folder not found: {INPUT_DIR}\n"
            f"Create it and put your source files (e.g. PDFs) inside."
        )

    files = sorted(p for p in INPUT_DIR.iterdir() if p.is_file())
    if not files:
        raise SystemExit(f"No files found in {INPUT_DIR} — add some source files first.")

    print(f"[job] attaching {len(files)} file(s) from {INPUT_DIR}:")
    for f in files:
        print(f"       - {f.name}")

    input_files = [
        BodyRunWorkflowInputFiles(content=f.open("rb"), file_name=f.name)
        for f in files
    ]

    resp = client.workflows.run_workflow(
        request=RunWorkflowRequest(
            workflow_id=workflow_id,
            body_run_workflow=BodyRunWorkflow(input_files=input_files),
        )
    )
    job_id = resp.job_information.id
    status = resp.job_information.status
    print(f"[job] created job_id={job_id} (status={status})")
    _write_state(job_id=job_id, file_count=len(files))
    return job_id


def main():
    client = _get_client()
    workflow_id = get_or_create_workflow(client)
    job_id = run_job_with_all_files(client, workflow_id)
    print(f"\nDone. job_id={job_id} — next, run unstructured_2_poll_status.py")


if __name__ == "__main__":
    main()
