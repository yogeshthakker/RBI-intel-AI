"""
Step 3 of 4: download every output file produced by a completed Unstructured
job.

Setup (one time):
    pip install "unstructured-client>=0.30.6"
    Put your key in UNSTRUCTURED_API_KEY (a real env var, or a .env file
    next to this script containing a line like: UNSTRUCTURED_API_KEY=sk-...)

Usage:
    Run unstructured_1_create_job.py then unstructured_2_poll_status.py
    first, then:
        python unstructured_3_download_results.py

What this does:
    1. Reads job_id from unstructured_job_state.json.
    2. Calls Jobs.get_job() to list the job's output_node_files.
    3. Downloads each one with Jobs.download_job_output() and saves it under
       ./unstructured_output/ (one file per output node file).

Reference: https://docs.unstructured.io/api-reference/quickstart/*
(workflow/job model verified directly against the installed
unstructured-client SDK's request/response classes, since the hosted docs
pages did not reliably return complete code samples.)
"""
import json
import os
from pathlib import Path

STATE_FILE = Path(__file__).parent / "unstructured_job_state.json"
OUTPUT_DIR = Path(__file__).parent / "unstructured_output"


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
            f"Job {job_id} has no output_node_files yet — make sure "
            f"unstructured_2_poll_status.py reported status=COMPLETED first."
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
    state = _read_state()
    job_id = state.get("job_id")
    if not job_id:
        raise SystemExit(
            "No job_id found in unstructured_job_state.json — "
            "run unstructured_1_create_job.py and unstructured_2_poll_status.py first."
        )
    saved_paths = download_all_outputs(client, job_id)
    print(f"\nDone. Saved {len(saved_paths)} file(s) to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
