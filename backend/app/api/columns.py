from fastapi import APIRouter, Query, Depends

from app.models.column import (
    ColumnAnalysis,
    ColumnSummary,
)

from app.services.column_service import (
    get_column_analysis,
    get_column_summaries,
)
from app.core.deps import get_current_user


router = APIRouter(
    prefix="/columns",
    tags=["Column Analysis"],
)


@router.get(
    "/{dataset_id}/diagnosis",
    response_model=list[ColumnSummary],
    summary="Get Column Summaries",
)
async def get_columns(
    dataset_id: str,
    user = Depends(get_current_user),
) -> list[ColumnSummary]:
    """
    Returns a lightweight summary of all columns
    in the selected dataset.
    """

    return get_column_summaries(dataset_id, user)


@router.get(
    "/{dataset_id}/analysis",
    response_model=ColumnAnalysis,
    summary="Get Column Analysis",
)
async def get_column(
    dataset_id: str,
    column_name: str = Query(...),
    user = Depends(get_current_user),
) -> ColumnAnalysis:
    """
    Returns detailed analysis for a selected column.
    """

    return get_column_analysis(
        dataset_id=dataset_id,
        column_name=column_name,
        user=user,
    )
