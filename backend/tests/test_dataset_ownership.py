import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.models.dataset import DatasetMetadata
from app.processors.session_manager import create_session
from app.core.deps import get_current_user

USER_A = "11111111-1111-1111-1111-111111111111"
USER_B = "22222222-2222-2222-2222-222222222222"

client = TestClient(app)


def _as(user_id: str):
    app.dependency_overrides[get_current_user] = lambda: {"id": user_id}


def _make_session(user_id: str):
    df = pd.DataFrame({"val": [1, 2, 3]})
    meta = DatasetMetadata(
        dataset_name="owned.csv",
        rows=3,
        columns=1,
        memory_usage=0.01,
        missing_cells=0,
        duplicate_rows=0,
        column_types={"int64": 1},
    )
    return create_session("owned.csv", df, meta, user_id=user_id)


def test_user_cannot_access_another_users_dataset():
    """A dataset created by user A must not be readable by user B."""
    _as(USER_A)
    session = _make_session(USER_A)

    # Authenticate as user B and try to read user A's dataset.
    _as(USER_B)
    res = client.get(f"/overview/{session.dataset_id}")

    assert res.status_code == 404


def test_owner_can_access_their_own_dataset():
    """The owning user must still be able to read their own dataset."""
    _as(USER_A)
    session = _make_session(USER_A)

    res = client.get(f"/overview/{session.dataset_id}")

    assert res.status_code == 200


def test_dataset_endpoints_require_authentication():
    """Every dataset-scoped endpoint must reject requests with no auth header."""
    _as(USER_A)
    session = _make_session(USER_A)

    app.dependency_overrides.pop(get_current_user, None)
    res = client.get(f"/overview/{session.dataset_id}")
    assert res.status_code in (401, 422)  # 422 if header missing entirely
