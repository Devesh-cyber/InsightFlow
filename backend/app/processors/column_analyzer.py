from typing import Any

import pandas as pd

from app.models.column import (
    ColumnAnalysis,
    ColumnSummary,
    NumericStatistics,
)

from app.processors.type_detector import detect_column_type

from app.core.exceptions import ColumnNotFoundError


def calculate_missing_percentage(
    series: pd.Series,
) -> float:
    """
    Calculate the percentage of missing values in a column.
    """

    if len(series) == 0:
        return 0.0

    missing_count = series.isna().sum()

    return round(
        (missing_count / len(series)) * 100,
        2,
    )


def generate_column_summary(
    dataframe: pd.DataFrame,
    column_name: str,
) -> ColumnSummary:
    """
    Generate a lightweight summary for a single column.
    """

    if column_name not in dataframe.columns:
        raise InvalidColumnError(
            column_name=column_name
        )

    series = dataframe[column_name]

    return ColumnSummary(
        column_name=column_name,
        detected_type=detect_column_type(series),
        pandas_dtype=str(series.dtype),
        missing_count=int(series.isna().sum()),
        missing_percentage=calculate_missing_percentage(series),
        unique_count=int(series.nunique(dropna=True)),
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
    limit: int = 10,
) -> list[Any]:
    """
    Return a sample of non-missing values from a column.
    """

    values = series.dropna().head(limit)

    return values.tolist()


def analyze_column(
    dataframe: pd.DataFrame,
    column_name: str,
) -> ColumnAnalysis:
    """
    Perform detailed analysis of a selected column.
    """

    if column_name not in dataframe.columns:
        raise InvalidColumnError(
            column_name=column_name
        )

    series = dataframe[column_name]

    summary = generate_column_summary(
        dataframe=dataframe,
        column_name=column_name,
    )

    statistics = None

    if summary.detected_type == "numeric":
        statistics = calculate_numeric_statistics(series)

    sample_values = generate_sample_values(series)

    return ColumnAnalysis(
        summary=summary,
        statistics=statistics,
        sample_values=sample_values,
    )


def generate_column_summaries(
    dataframe: pd.DataFrame,
) -> list[ColumnSummary]:
    """
    Generate a lightweight summary for every column
    in the dataset.
    """

    summaries = []

    for column_name in dataframe.columns:
        summaries.append(
            generate_column_summary(
                dataframe=dataframe,
                column_name=column_name,
            )
        )

    return summaries