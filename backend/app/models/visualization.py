from typing import Any

from pydantic import BaseModel, Field


class ChartOption(BaseModel):
    """
    Represents a chart that can be generated for the
    selected column combination.
    """

    chart_type: str = Field(
        ...,
        min_length=1,
        description="Internal chart type identifier."
    )

    label: str = Field(
        ...,
        min_length=1,
        description="Human-readable chart name."
    )

    description: str = Field(
        ...,
        min_length=1,
        description="Short explanation of the chart."
    )


class VisualizationOptions(BaseModel):
    """
    Available visualization options for selected columns.
    """

    column_a: str = Field(
        ...,
        min_length=1
    )

    column_b: str | None = None

    available_charts: list[ChartOption] = Field(
        default_factory=list
    )


class ChartData(BaseModel):
    """
    Data required by the frontend to render a chart.
    """

    chart_type: str = Field(
        ...,
        min_length=1
    )

    title: str = Field(
        ...,
        min_length=1
    )

    x_label: str | None = None

    y_label: str | None = None

    data: list[dict[str, Any]] = Field(
        default_factory=list
    )