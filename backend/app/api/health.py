from fastapi import APIRouter

from app.models.health import HealthResponse
from app.services.health_service import get_dataset_health


router = APIRouter(
    prefix='/health',
    tags=['Dataset Health']
)


@router.get(
    '/{dataset_id}',
    response_model=HealthResponse,
    summary='Get dataset Health Report'
)
def get_health(
    dataset_id: str
):
    '''
    Returns the health report for an un uploaded dataset
    '''

    return get_dataset_health(dataset_id=dataset_id)