from typing import Literal
from pydantic import BaseModel, Field

class RelationshipResult(BaseModel):
    '''
    Result of an analysis between two columns
    '''

    column_a: str = Field(
        ...,
        min_length=1,
        description='First selected column'
    )

    column_b: str = Field(
        ...,
        min_length=1,
        description='Second selected column'
    )

    column_a_type: str = Field(
        ...,
        min_length=1,
        description='Detected type of the first column'
    )

    column_b_type: str = Field(
        ...,
        min_length=1,
        description='Detected type of the second column'
    )

    analysis_type: Literal[
        'numeric_numeric',
        'categorical_categorical',
        'numeric_categorical'
    ] = Field(
        ...,
        description='Analysis performed based on column types'
    )

    strength: str | None = Field(
        None,
        description='Relationship strength when applicable'
    )

    direction: Literal[
        'positive',
        'negative',
        'none'
    ] | None = Field(
        None, 
        description='Relationship direction when applicable'
    )

    correlation: float | None = Field(
        None,
        ge=-1,
        le=1,
        description='Correlation coefficient when applicable'
    )

    association: float | None = Field(
    None,
    ge=0,
    le=1,
    description="Association strength for non-linear or categorical relationships"
)
    
    sample_size: int = Field(
        ...,
        ge=0,
        description='Number of valid observation used'
    )

    result: dict = Field(
        default_factory=dict,
        description='Additional analysis results'
    )
    