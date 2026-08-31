"""
Step 4 of 4: do it all in one run — create the job, poll until it finishes,
download every result.

Setup (one time):
    pip install "unstructured-client>=0.30.6"
    Put your key in UNSTRUCTURED_API_KEY (a real env var, or a .env file
    next to this script containing a line like: UNSTRUCTURED_API_KEY=sk-...)

Usage:
    Put your PDFs (or other source files) in ./unstructured_input/, then:
        python unstructured_4_combined.py

What this does (same steps as scripts 1-3, run back to back):
    1. Creates (or reuses) a "basic" workflow.
    2. Runs it with every file in INPUT_DIR attached as input — one job for
       all of them.
    3. Polls Jobs.get_job() until the job reaches a terminal state.
    4. Downloads every output file to ./unstructured_output/.

This script is fully self-contained (no import from the other three scripts)
so it can be run on its own. unstructured_job_state.json is still written
along the way, in case you want to inspect it.

Reference: https://docs.unstructured.io/api-reference/quickstart/*
(workflow/job model verified directly against the installed
unstructured-client SDK's request/response classes, since the hosted docs
pages did not reliably return complete code samples.)
"""
import json
import os
import time
from pathlib import Path

STATE_FILE = Path(__file__).parent / "unstructured_job_state.json"
INPUT_DIR = Path(__file__).parent / "unstructured_input"
OUTPUT_DIR = Path(__file__).parent / "unstructured_output"
WORKFLOW_NAME = "rbi-intel-pdf-extraction"
POLL_SECONDS = 10
MAX_WAIT_SECONDS = 60 * 30  # give up after 30 minutes


# This user's D:\Downloads\.env uses shorthand key names instead of the
# standard ones the scripts expect. Map shorthand -> real env var name.
_ENV_KEY_ALIASES = {
    "unstrctured": "UNSTRUCTURED_API_KEY",
    "unstructured": "UNSTRUCTURED_API_KEY",
    "open": "OPENROUTER_API_KEY",
    "openrouter": "OPENROUTER_API_KEY",
    "google": "GEMINI_API_KEY",
    "gemini": "GEMINI_API_KEY",
}


def _load_env_file() -> None:
    """Read KEY=VALUE lines from a .env file. Checks next to this script
    first, then D:\\Downloads\\.env (where this user actually keeps it).
    A real environment variable already set always wins over the file.
    Shorthand key names are aliased to the standard names via
    _ENV_KEY_ALIASES."""
    candidates = [
        Path(__file__).parent / ".env",
        Path(r"D:\Downloads\.env"),
    ]
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


def _get_client():
    from unstructured_client import UnstructuredClient

    _load_env_file()
    key = os.environ.get("UNSTRUCTURED_API_KEY")
    if not key:
        raise SystemExit(
            "Set UNSTRUCTURED_API_KEY (as a real env var, or in a .env file "
            "next to this script) before running."
        )
    # This account's workflows live on the transform.unstructured.io tenant,
    # not the default platform.unstructuredapp.io — confirmed by the user.
    return UnstructuredClient(
        api_key_auth=key,
        server_url="https://platform-api.transform.unstructured.io",
    )


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


def poll_until_done(client, job_id: str, poll_seconds: int = POLL_SECONDS,
                     max_wait_seconds: int = MAX_WAIT_SECONDS) -> str:
    from unstructured_client.models.operations.get_job import GetJobRequest
    from unstructured_client.models.shared.jobstatus import JobStatus

    terminal = {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.STOPPED}
    waited = 0
    while True:
        resp = client.jobs.get_job(request=GetJobRequest(job_id=job_id))
        info = resp.job_information
        status = info.status
        print(f"[poll] job_id={job_id} status={status} (waited {waited}s)")

        if status in terminal:
            _write_state(job_id=job_id, last_status=str(status))
            if status != JobStatus.COMPLETED:
                raise SystemExit(
                    f"Job ended with status={status}, not COMPLETED. "
                    f"Check the Unstructured dashboard for details."
                )
            return str(status)

        if waited >= max_wait_seconds:
            raise SystemExit(
                f"Gave up after {waited}s waiting for job {job_id} to finish "
                f"(still {status}). Run this script again to keep polling."
            )

        time.sleep(poll_seconds)
        waited += poll_seconds


def download_all_outputs(client, job_id: str) -> list:
    from unstructured_client.models.operations.get_job import GetJobRequest
    from unstructured_client.models.operations.download_job_output import (
        DownloadJobOutputRequest,
    )

    resp = client.jobs.get_job(request=GetJobRequest(job_id=job_id))
    info = resp.job_information
    output_files = info.output_node_files or []
    if not output_files:
        raise SystemExit(
            f"Job {job_id} has no output_node_files — nothing to download."
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    saved_paths = []
    print(f"[download] job_id={job_id} has {len(output_files)} output file(s)")

    for nf in output_files:
        dl = client.jobs.download_job_output(
            request=DownloadJobOutputRequest(
                job_id=job_id,
                file_id=nf.file_id,
                node_id=nf.node_id,
            )
        )
        content = dl.raw_response.content
        content_type = dl.content_type or ""
        ext = ".json" if "json" in content_type else ".bin"
        out_path = OUTPUT_DIR / f"{nf.node_id}_{nf.file_id}{ext}"
        out_path.write_bytes(content)
        saved_paths.append(out_path)
        print(f"       saved {out_path} ({len(content)} bytes, "
              f"content_type={content_type})")

    return saved_paths


def main():
    client = _get_client()
    workflow_id = get_or_create_workflow(client)
    job_id = run_job_with_all_files(client, workflow_id)
    poll_until_done(client, job_id)
    saved_paths = download_all_outputs(client, job_id)
    print(f"\nDone. job_id={job_id} — saved {len(saved_paths)} file(s) to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
