import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing from env and /app/frontend/.env")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="class")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# The suite shares one preview backend and mutates global identity state
# (acc-creator-01 / acc-viewer-01 / acc-kid-01). pytest.ini runs 2 xdist workers with
# --dist loadscope, which puts different classes on different workers, so an
# inter-process file lock serializes every test and prevents cross-worker races.
@pytest.fixture(autouse=True)
def serialize_shared_state():
    import fcntl
    import tempfile
    lock_path = os.path.join(tempfile.gettempdir(), "vp_backend_tests.lock")
    with open(lock_path, "w") as fh:
        fcntl.flock(fh, fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(fh, fcntl.LOCK_UN)
