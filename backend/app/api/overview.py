from fastapi import APIRouter, Depends
from app.models.overview import OverviewResponse
from app.services.overview_service import get_dataset_overview
from app.core.deps import get_current_user


router = APIRouter(
    prefix='/overview',
    tags=['Overview']
)

@router.get(
    '/{dataset_id}',
    response_model=OverviewResponse,
    summary='Dataset Overview'
)
async def overview(dataset_id: str, user = Depends(get_current_user)) -> OverviewResponse:
    ''' Returns the overview of an uploaded dataset, scoped to its owner '''

    return get_dataset_overview(dataset_id, user)
