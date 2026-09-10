from app.models.visualization import (
    ChartData,
    VisualizationOptions,
)

from app.processors.session_manager import get_session
from app.core.deps import get_user_id

from app.processors.visualization_analyzer import (
    generate_chart_data,
    get_visualization_options,
)


def get_visualization_options_for_dataset(
    dataset_id: str,
    column_a: str,
    user,
    column_b: str | None = None,
) -> VisualizationOptions:
    """
    Returns valid visualization options for the
    selected dataset columns.
    """

    session = get_session(dataset_id, get_user_id(user))

    return get_visualization_options(
        dataframe=session.dataframe,
        column_a=column_a,
        column_b=column_b,
    )


def get_chart_data(
    dataset_id: str,
    column_a: str,
    chart_type: str,
    user,
    column_b: str | None = None,
) -> ChartData:
    """
    Generates chart data for the selected columns.
    """

    session = get_session(dataset_id, get_user_id(user))

    result = generate_chart_data(
        dataframe=session.dataframe,
        column_a=column_a,
        column_b=column_b,
        chart_type=chart_type,
    )

    return ChartData(**result)
