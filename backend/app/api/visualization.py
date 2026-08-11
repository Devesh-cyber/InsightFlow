from fastapi import APIRouter, Query

from app.models.visualization import (
    ChartData,
    VisualizationOptions,
)

from app.services.visualization_service import (
    get_chart_data,
    get_visualization_options_for_dataset,
)


router = APIRouter(
    prefix="/visualizations",
    tags=["Visualizations"],
)


@router.get(
    "/{dataset_id}/options",
    response_model=VisualizationOptions,
    summary="Get Available Visualization Options",
)
async def get_options(
    dataset_id: str,
    column_a: str = Query(...),
    column_b: str | None = Query(default=None),
) -> VisualizationOptions:
    """
    Returns visualization types that are valid
    for the selected column(s).
    """

    return get_visualization_options_for_dataset(
        dataset_id=dataset_id,
        column_a=column_a,
        column_b=column_b,
    )


@router.get(
    "/{dataset_id}/data",
    response_model=ChartData,
    summary="Generate Visualization Data",
)
async def get_visualization_data(
    dataset_id: str,
    column_a: str = Query(...),
    chart_type: str = Query(...),
    column_b: str | None = Query(default=None),
) -> ChartData:
    """
    Generates structured data required by the frontend
    to render the selected chart.
    """

    return get_chart_data(
        dataset_id=dataset_id,
        column_a=column_a,
        column_b=column_b,
        chart_type=chart_type,
    )