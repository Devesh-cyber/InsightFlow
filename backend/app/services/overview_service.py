from app.models.overview import OverviewResponse
from app.processors.overview import build_overview
from app.processors.session_manager import get_session
from app.core.deps import get_user_id

def get_dataset_overview(dataset_id: str, user) -> OverviewResponse:
    ''' Returns the overview for an uploaded dataset owned by `user` '''

    session = get_session(dataset_id, get_user_id(user))

    return build_overview(
        dataframe=session.dataframe,
        metadata=session.metadata
    )
