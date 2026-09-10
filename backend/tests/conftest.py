import pytest

from app.main import app
from app.core.deps import get_current_user

DEFAULT_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture(autouse=True)
def _reset_auth_override():
    """
    Ensures every test starts with the same default authenticated user,
    regardless of what a previous test left in app.dependency_overrides.
    Individual tests that need a different/no user can still override
    it themselves within the test body.
    """
    app.dependency_overrides[get_current_user] = lambda: {"id": DEFAULT_TEST_USER_ID}
    yield
    app.dependency_overrides[get_current_user] = lambda: {"id": DEFAULT_TEST_USER_ID}
