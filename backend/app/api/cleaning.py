from fastapi import APIRouter

from app.models.cleaning import (
    CleaningRequest,
    CleaningResponse,
)

from app.services.cleaning_service import apply_cleaning


router = APIRouter(
    prefix="/cleaning",
    tags=["Data Cleaning"],
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
    Applies the requested cleaning operation
    to the selected dataset.
    """

    return apply_cleaning(
        dataset_id=dataset_id,
        request=request,
    )