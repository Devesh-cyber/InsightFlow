from app.models.overview import OverviewResponse
from app.processors.overview import build_overview
from app.processors.session_manager import get_session

def get_dataset_overview(dataset_id: str) -> OverviewResponse:
    ''' Returns the overview for an uploaded dataset '''

    session = get_session(dataset_id)

    return build_overview(
        dataframe=session.dataframe, 
        metadata=session.metadata
    )