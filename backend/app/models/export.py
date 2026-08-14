from typing import Literal

from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    """
    Represents a dataset export request.
    """

    format: Literal["csv", "xlsx"] = Field(
        ...,
        description="Export format.",
    )

class ExportResponse(BaseModel):
    status: str = Field(
        ...,
        min_length=1,
        description="Status of the export operation."
    )
    filename: str = Field(
        ...,
        min_length=1,
        description="Name of the exported dataset file."
    )
    rows: int = Field(
        ...,
        ge=0,
        description="Number of rows in the exported dataset."
    )
    columns: int = Field(
        ...,
        ge=0,
        description="Number of columns in the exported dataset."
    )