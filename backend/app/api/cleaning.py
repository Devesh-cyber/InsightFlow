from fastapi import APIRouter

from app.models.cleaning import (
    CleaningRecommendationsResponse,
    CleaningPreviewResponse,
    CleaningRequest,
    CleaningResponse,
)

from app.services.cleaning_service import (
    apply_cleaning,
    preview_cleaning,
    get_cleaning_recommendations,
)


router = APIRouter(
    prefix="/cleaning",
    tags=["Data Cleaning"],
)


@router.get(
    "/{dataset_id}/recommendations",
    response_model=CleaningRecommendationsResponse,
    summary="Get Cleaning Recommendations",
)
async def cleaning_recommendations(
    dataset_id: str,
) -> CleaningRecommendationsResponse:
    """
    Analyze the dataset and return evidence-based
    cleaning recommendations.

    This endpoint does not modify the dataset.
    """

    return get_cleaning_recommendations(
        dataset_id=dataset_id,
    )

@router.post(
    "/{dataset_id}/preview",
    response_model=CleaningPreviewResponse,
    summary="Preview Cleaning Operation",
)
async def preview_dataset_cleaning(
    dataset_id: str,
    request: CleaningRequest,
) -> CleaningPreviewResponse:
    """
    Preview a user-selected cleaning operation
    without modifying the dataset.
    """

    return preview_cleaning(
        dataset_id=dataset_id,
        request=request,
    )

@router.post(
    "/{dataset_id}",
    response_model=CleaningResponse,
    summary="Apply Cleaning Operation",
)
async def clean_dataset(
    dataset_id: str,
    request: CleaningRequest,
) -> CleaningResponse:
    """
    Apply a user-selected cleaning operation
    to the dataset.
    """

    return apply_cleaning(
        dataset_id=dataset_id,
        request=request,
    )