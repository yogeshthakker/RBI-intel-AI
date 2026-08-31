"""
Step 2 of 4: poll an Unstructured job until it finishes.

Setup (one time):
    pip install "unstructured-client>=0.30.6"
    Put your key in UNSTRUCTURED_API_KEY (a real env var, or a .env file
    next to this script containing a line like: UNSTRUCTURED_API_KEY=sk-...)

Usage:
    Run unstructured_1_create_job.py first (it writes job_id to
    unstructured_job_state.json), then:
        python unstructured_2_poll_status.py

What this does:
    Repeatedly calls Jobs.get_job() for the job_id saved by script 1, prints
    the status, and sleeps between checks until the job reaches a terminal
    state (COMPLETED, FAILED, or STOPPED).

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
POLL_SECONDS = 10
MAX_WAIT_SECONDS = 60 * 30  # give up after 30 minutes


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


def main():
    client = _get_client()
    state = _read_state()
    job_id = state.get("job_id")
    if not job_id:
        raise SystemExit(
            "No job_id found in unstructured_job_state.json — "
            "run unstructured_1_create_job.py first."
        )
    status = poll_until_done(client, job_id)
    print(f"\nDone. job_id={job_id} finished with status={status} — "
          f"next, run unstructured_3_download_results.py")


if __name__ == "__main__":
    main()
