from app.models.health import HealthResponse
from app.processors.health import build_health
from app.processors.session_manager import get_session


def get_dataset_health(
        dataset_id: str
) -> HealthResponse:
    '''
    Returns the health report of an uploaded dataset
    '''

    session = get_session(dataset_id)

    return build_health(
        dataframe=session.dataframe
    )