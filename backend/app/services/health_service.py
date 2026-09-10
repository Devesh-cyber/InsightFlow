from app.models.health import HealthResponse
from app.processors.health import build_health
from app.processors.session_manager import get_session
from app.core.deps import get_user_id


def get_dataset_health(
        dataset_id: str,
        user,
) -> HealthResponse:
    '''
    Returns the health report of an uploaded dataset owned by `user`
    '''

    session = get_session(dataset_id, get_user_id(user))

    return build_health(
        dataframe=session.dataframe
    )
