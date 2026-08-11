from typing import Any, Literal
from pydantic import BaseModel, Field

class ColumnSummary(BaseModel):
    '''
    Lightweight summary of a dataset column.
    '''

    column_name: str = Field(
        ...,
        min_length=1,
        description='Name of the column'
    )

    detected_type: Literal[
        'numeric',
        'categorical',
        'boolean',
        'datetime',
        'unknown'
    ] = Field(
        ...,
        description='Detected logical data type'
    )

    pandas_dtype: str = Field(
        ...,
        min_length=1,
        description='Original Pandas data type'
    )

    missing_count: int = Field(
        ...,
        ge=0
    )

    missing_percentage: float = Field(
        ...,
        ge=0,
        le=100
    )

    unique_count: int = Field(
        ...,
        ge=0
    )


class NumericStatistics(BaseModel):
    '''
    Statistical information for a numeric column
    '''

    minimum: float | None = None
    maximum: float | None = None
    mean: float | None = None
    median: float | None = None
    standard_deviation: float | None = None
    skewness: float | None = None


class ColumnAnalysis(BaseModel):
    '''
    Detailed analysis of a selected dataset column
    '''

    summary: ColumnSummary

    statistics: NumericStatistics | None = Field(
        None,
        description='Numeric statisics when applicable'
    )
    
    sample_values: list[Any] = Field(
        default_factory=list,
        description='Sample non-missing values from the column'
    )