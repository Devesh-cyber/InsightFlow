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