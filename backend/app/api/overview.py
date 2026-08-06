from fastapi import APIRouter
from app.models.overview import OverviewRepsponse
from app.services.overview_service import get_dataset_overview


router = APIRouter(
    prefix='/overview',
    tags=['Overview']
)

@router.get(
    '/{dataset_id}',
    response_model=OverviewRepsponse,
    summary='Dataset Overview'
)

async def overview(dataset_id: str) -> OverviewRepsponse:
    ''' Returen the overview of an uploaded dataset '''

    return get_dataset_overview(dataset_id)