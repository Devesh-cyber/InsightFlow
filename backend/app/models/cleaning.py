from typing import Literal

from pydantic import BaseModel, Field


class CleaningOperation(BaseModel):
    """
    Represents one cleaning operation performed on the dataset.
    """

    operation: str = Field(
        ...,
        min_length=1,
        description="Type of cleaning operation performed.",
    )

    column_name: str | None = Field(
        default=None,
        description="Column affected by the operation.",
    )

    method: str | None = Field(
        default=None,
        description="Method used for the operation.",
    )

    affected_rows: int = Field(
        default=0,
        ge=0,
        description="Number of rows affected.",
    )

    affected_columns: int = Field(
        default=0,
        ge=0,
        description="Number of columns affected.",
    )

    affected_cells: int = Field(
        default=0,
        ge=0,
        description="Number of cells affected.",
    )

    reason: str = Field(
        ...,
        min_length=1,
        description="Reason for performing the operation.",
    )


class CleaningRecommendation(BaseModel):
    column: str = Field(
        ...,
        min_length=1,
        description="Affected column",
    )

    issue: str = Field(
        ...,
        min_length=1,
        description="Detected data quality issue",
    )

    count: int = Field(
        ...,
        ge=0,
        description="Number of affected values",
    )

    percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description="Percentage of affected values",
    )

    data_type: str = Field(
        ...,
        min_length=1,
        description="Detected column data type",
    )

    severity: Literal[
        "low",
        "moderate",
        "high",
        "very_high",
        "complete",
    ]

    suggested_operation: str | None = Field(
        default=None,
        description="Evidence-based suggested cleaning operation",
    )

    available_operations: list[str] = Field(
        default_factory=list,
        description="Cleaning operations available to the user",
    )

    statistics: dict = Field(
        default_factory=dict,
        description="Statistics used to support the recommendation",
    )

    reason: str = Field(
        ...,
        min_length=1,
        description="Explanation of the recommendation",
    )

class CleaningRecommendationsResponse(BaseModel):
    """
    Collection of cleaning recommendations for a dataset.
    """

    status: str
    recommendations: list[CleaningRecommendation]


class CleaningRequest(BaseModel):
    """
    Represents a requested cleaning operation.
    """

    operation: Literal[
        "drop_duplicates",
        "drop_empty_columns",
        "drop_constant_columns",
        "drop_missing_rows",
        "fill_missing_mean",
        "fill_missing_median",
        "fill_missing_mode",
        "fill_missing_placeholder",
        "drop_column",
    ]

    column_name: str | None = Field(
        default=None,
        description="Column required for column-specific operations.",
    )

    value: str | None = Field(
        default=None,
        description="Value used when filling missing values with a placeholder.",
    )

class CleaningResponse(BaseModel):
    """
    Result returned after a cleaning operation.
    """

    status: str = Field(
        ...,
        min_length=1,
        description="Status of the cleaning operation.",
    )

    message: str = Field(
        ...,
        min_length=1,
        description="Message describing the result.",
    )

    rows: int = Field(
        ...,
        ge=0,
        description="Number of rows after cleaning.",
    )

    columns: int = Field(
        ...,
        ge=0,
        description="Number of columns after cleaning.",
    )

    is_modified: bool = Field(
        ...,
        description="Whether the dataset has been modified.",
    )

    operation: CleaningOperation = Field(
        ...,
        description="Details of the cleaning operation performed.",
    )


class CleaningPreviewResponse(BaseModel):
    status: str = Field(
        ...,
        min_length=1,
        description="Status of the preview operation.",
    )

    operation: CleaningOperation = Field(
        ...,
        description="Details of the cleaning operation that would be performed.",
    )

    rows_before: int = Field(
        ...,
        ge=0,
        description="Number of rows before cleaning.",
    )

    rows_after: int = Field(
        ...,
        ge=0,
        description="Number of rows after the proposed cleaning.",
    )

    columns_before: int = Field(
        ...,
        ge=0,
        description="Number of columns before cleaning.",
    )

    columns_after: int = Field(
        ...,
        ge=0,
        description="Number of columns after the proposed cleaning.",
    )


class CleaningHistoryResponse(BaseModel):
    status: str = Field(
        ...,
        min_length=1,
        description="Status of the history request."
    )
    history: list[CleaningOperation] = Field(
        default_factory=list,
        description="List of cleaning operations performed on the dataset."
    )