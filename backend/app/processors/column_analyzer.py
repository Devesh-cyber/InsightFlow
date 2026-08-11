import pandas as pd
from typing import Any

from app.models.column import (
    ColumnSummary,
    ColumnAnalysis,
    NumericStatistics
)


def detect_column_type(series: pd.Series) -> str:
    '''
    Detect the logical analytical type of a colum
    '''

    if pd.api.types.is_bool_dtype(series):
        return 'boolean'

    if pd.api.types.is_numeric_dtype(series):
        return 'numeric'

    if pd.api.types.is_datetime64_any_dtype(series):
        return 'datetime'

    if pd.api.types.is_object_dtype(series) or pd.api.types.is_categorical_dtype(series):
        return 'categorical'

    return 'unknown'


def calculate_missing_percentage(series: pd.Series) -> float:
    '''
    Calculate the percantage of missing values in a column
    '''

    if len(series) == 0:
        return 0.0

    missing_count = series.isna().sum()

    return round(
        (missing_count / len(series)) * 100, 
        2
    )


def generate_column_summary(
        dataframe: pd.DataFrame,
        column_name: str
) -> ColumnSummary:
    '''
    Generates a lightweight summary for a single column
    '''

    series = dataframe[column_name]

    return ColumnSummary(
        column_name=column_name,
        detected_type=detect_column_type(series),
        pandas_dtype=str(series.dtype),
        missing_count=int(series.isna().sum()),
        missing_percentage=calculate_missing_percentage(series),
        unique_count=int(series.nunique(dropna=True))
    )


def calculate_numeric_statistics(
    series: pd.Series,
) -> NumericStatistics:
    """
    Calculate statistical information for a numeric column.
    """

    clean_series = series.dropna()

    if clean_series.empty:
        return NumericStatistics()

    return NumericStatistics(
        minimum=float(clean_series.min()),
        maximum=float(clean_series.max()),
        mean=float(clean_series.mean()),
        median=float(clean_series.median()),
        standard_deviation=float(clean_series.std()),
        skewness=float(clean_series.skew()),
    )


def generate_sample_values(
        series: pd.Series,
        limit: int = 10
) -> list[Any]:
    '''
    Returns a sample of non-missing values from a column
    '''

    values = series.dropna().head(limit)

    return values.tolist()


def analyze_column(
        dataframe: pd.DataFrame,
        column_name: str
) -> ColumnAnalysis:
    '''
    Performs detailed analysis of a selected column
    '''

    if column_name not in dataframe.columns:
        raise ValueError(
            f"Column '{column_name}' does not exist"
        )

    series = dataframe[column_name]

    summary = generate_column_summary(
        dataframe=dataframe,
        column_name=column_name
    )

    statistics = None

    if summary.detected_type == 'numeric':
        statistics = calculate_numeric_statistics(series)

    sample_values = generate_sample_values(series)

    return ColumnAnalysis(
        summary=summary,
        statistics=statistics,
        sample_values=sample_values
    )


def generate_column_summaries(
    dataframe: pd.DataFrame
) -> list[ColumnSummary]:
    """
    Generates a lightweight summary for every column
    in the dataset.
    """

    summaries = []

    for column_name in dataframe.columns:
        summary = generate_column_summary(
            dataframe=dataframe,
            column_name=column_name
        )

        summaries.append(summary)

    return summaries