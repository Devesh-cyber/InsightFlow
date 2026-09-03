from fastapi import APIRouter, Depends
from app.models.cleaning import (
    CleaningRecommendationsResponse,
    CleaningPreviewResponse,
    CleaningRequest,
    CleaningResponse,
    CleaningHistoryResponse,
)
from app.services.cleaning_service import (
    apply_cleaning,
    preview_cleaning,
    get_cleaning_recommendations,
    get_cleaning_history,
)
from app.core.deps import get_current_user

router = APIRouter(
    prefix="/cleaning",
    tags=["Data Cleaning"],
)

@router.get("/{dataset_id}/recommendations", response_model=CleaningRecommendationsResponse)
async def cleaning_recommendations(dataset_id: str, user = Depends(get_current_user)) -> CleaningRecommendationsResponse:
    return get_cleaning_recommendations(dataset_id=dataset_id)

@router.post("/{dataset_id}/preview", response_model=CleaningPreviewResponse)
async def preview_dataset_cleaning(dataset_id: str, request: CleaningRequest, user = Depends(get_current_user)) -> CleaningPreviewResponse:
    return preview_cleaning(dataset_id=dataset_id, request=request)

@router.post("/{dataset_id}", response_model=CleaningResponse)
async def clean_dataset(dataset_id: str, request: CleaningRequest, user = Depends(get_current_user)) -> CleaningResponse:
    return apply_cleaning(dataset_id=dataset_id, request=request)

@router.get("/{dataset_id}/history", response_model=CleaningHistoryResponse)
async def cleaning_history(dataset_id: str, user = Depends(get_current_user)) -> CleaningHistoryResponse:
    return get_cleaning_history(dataset_id=dataset_id)