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
        "drop_column",
    ]

    column_name: str | None = Field(
        default=None,
        description="Column required for column-specific operations.",
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