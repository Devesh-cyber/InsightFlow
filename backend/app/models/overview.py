from typing import Any
from pydantic import BaseModel, Field
from app.models.dataset import DatasetMetadata

class OverviewRepsponse(BaseModel):
    '''
    Response model for the dataset overview
    '''

    metadata: DatasetMetadata = Field(
        ...,
        description='General metadata describing the dataset'
    )
    completeness_percentage: float = Field(
        ...,
        ge=0,
        le=100,
        description='Percentage of complete (non-missing) data'
    )
    preview: list[dict[str, Any]] = Field(
        ...,
        description='Preview of the first 10 dataset rows'
    )