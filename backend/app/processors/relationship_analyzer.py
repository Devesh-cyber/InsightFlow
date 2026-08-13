import pandas as pd
import numpy as np
from app.models.relationship import RelationshipResult
from app.processors.type_detector import detect_column_type

from app.core.exceptions import (
    ColumnNotFoundError,
    InvalidOperationError,
)


def determine_analysis_type(
    column_a_type: str,
    column_b_type: str,
) -> str:
    """
    Determines which relationship analysis should be performed
    based on the types of the selected columns.
    """

    if (
        column_a_type == "numeric"
        and column_b_type == "numeric"
    ):
        return "numeric_numeric"

    if (
        column_a_type == "categorical"
        and column_b_type == "categorical"
    ):
        return "categorical_categorical"

    if (
        column_a_type == "numeric"
        and column_b_type == "categorical"
    ):
        return "numeric_categorical"

    if (
        column_a_type == "categorical"
        and column_b_type == "numeric"
    ):
        return "numeric_categorical"

    raise InvalidOperationError(
        "Relationship analysis is not supported "
        "for the selected column types."
    )


def calculate_numeric_relationship(
    series_a: pd.Series,
    series_b: pd.Series,
) -> tuple[float, str, str, int]:
    """
    Calculates Pearson correlation between two numeric columns.
    """

    paired_data = pd.concat(
        [series_a, series_b],
        axis=1,
    ).dropna()

    sample_size = len(paired_data)

    if sample_size < 2:
        raise InvalidOperationError(
            "Not enough valid data points to calculate "
            "a relationship."
        )

    correlation = paired_data.iloc[:, 0].corr(
        paired_data.iloc[:, 1]
    )

    if pd.isna(correlation):
        raise InvalidOperationError(
            "Correlation could not be calculated. "
            "The selected columns may have no variation."
        )

    correlation = round(
        float(correlation),
        4,
    )

    direction = determine_direction(correlation)
    strength = determine_strength(correlation)

    return (
        correlation,
        strength,
        direction,
        sample_size,
    )


def determine_direction(
    correlation: float,
) -> str:
    """
    Determines the direction of a correlation.
    """

    if correlation > 0:
        return "positive"

    if correlation < 0:
        return "negative"

    return "none"


def determine_strength(
    correlation: float,
) -> str:
    """
    Determines the approximate strength of a correlation.
    """

    absolute_correlation = abs(correlation)

    if absolute_correlation >= 0.7:
        return "strong"

    if absolute_correlation >= 0.4:
        return "moderate"

    if absolute_correlation >= 0.2:
        return "weak"

    return "very weak"


def calculate_cramers_v(
    series_a: pd.Series,
    series_b: pd.Series,
) -> float:
    paired_data = pd.concat(
        [series_a, series_b],
        axis=1,
    ).dropna()

    if len(paired_data) == 0:
        raise InvalidOperationError(
            "No valid observations are available "
            "to calculate the association."
        )

    contingency_table = pd.crosstab(
        paired_data.iloc[:, 0],
        paired_data.iloc[:, 1],
    )

    if contingency_table.empty:
        raise InvalidOperationError(
            "Association could not be calculated."
        )

    observed = contingency_table.to_numpy()

    total = observed.sum()

    row_totals = observed.sum(axis=1, keepdims=True)
    column_totals = observed.sum(axis=0, keepdims=True)

    expected = (
        row_totals @ column_totals
    ) / total

    if np.any(expected == 0):
        raise InvalidOperationError(
            "Association could not be calculated "
            "because expected frequencies contain zero values."
        )

    chi_square = (
        (observed - expected) ** 2 / expected
    ).sum()

    n = observed.sum()

    phi_squared = chi_square / n

    rows, columns = observed.shape

    denominator = min(rows - 1, columns - 1)

    if denominator == 0:
        return 0.0

    cramers_v = np.sqrt(
        phi_squared / denominator
    )

    return round(float(cramers_v), 4)


def calculate_eta(
    numeric_series: pd.Series,
    categorical_series: pd.Series,
) -> float:
    """
    Calculates Eta (η), also known as the correlation ratio,
    measuring the association between a numeric variable
    and a categorical variable.

    Eta ranges from 0 to 1:
        0 → no association
        1 → strongest possible association
    """

    paired_data = pd.concat(
        [numeric_series, categorical_series],
        axis=1,
    ).dropna()

    if len(paired_data) == 0:
        raise InvalidOperationError(
            "No valid observations are available "
            "to calculate the association."
        )

    numeric_column = paired_data.iloc[:, 0]
    categorical_column = paired_data.iloc[:, 1]

    grand_mean = numeric_column.mean()

    numerator = 0.0
    denominator = (
        (numeric_column - grand_mean) ** 2
    ).sum()

    if denominator == 0:
        raise InvalidOperationError(
            "Association could not be calculated. "
            "The numeric column has no variation."
        )

    for category in categorical_column.unique():
        category_values = numeric_column[
            categorical_column == category
        ]

        category_mean = category_values.mean()
        category_count = len(category_values)

        numerator += (
            category_count
            * (category_mean - grand_mean) ** 2
        )

    eta = (numerator / denominator) ** 0.5

    return round(float(eta), 4)

def determine_association_strength(
    association: float,
) -> str:
    """
    Determines the approximate strength of an association.
    """

    if association >= 0.7:
        return "strong"

    if association >= 0.4:
        return "moderate"

    if association >= 0.2:
        return "weak"

    return "very weak"

def calculate_categorical_relationship(
    series_a: pd.Series,
    series_b: pd.Series,
) -> tuple[dict, int]:
    """
    Calculates a contingency table between two categorical columns.
    """

    paired_data = pd.concat(
        [series_a, series_b],
        axis=1,
    ).dropna()

    sample_size = len(paired_data)

    if sample_size == 0:
        raise InvalidOperationError(
            "No valid observations are available "
            "for the selected columns."
        )

    contingency_table = pd.crosstab(
        paired_data.iloc[:, 0],
        paired_data.iloc[:, 1],
    )

    table = contingency_table.to_dict(
        orient="index",
    )

    return table, sample_size


def calculate_numeric_categorical_relationship(
    numeric_series: pd.Series,
    categorical_series: pd.Series,
) -> tuple[dict, int]:
    """
    Calculates grouped statistics for a numeric column
    across categories of another column.
    """

    paired_data = pd.concat(
        [numeric_series, categorical_series],
        axis=1,
    ).dropna()

    sample_size = len(paired_data)

    if sample_size == 0:
        raise InvalidOperationError(
            "No valid observations are available "
            "for the selected columns."
        )

    numeric_column = paired_data.iloc[:, 0]
    categorical_column = paired_data.iloc[:, 1]

    grouped = (
        paired_data
        .groupby(categorical_column)[numeric_column.name]
        .agg(
            count="count",
            mean="mean",
            median="median",
            minimum="min",
            maximum="max",
        )
    )

    grouped = grouped.round(2)

    result = grouped.to_dict(
        orient="index",
    )

    return result, sample_size


def analyze_relationship(
    dataframe: pd.DataFrame,
    column_a: str,
    column_b: str,
) -> RelationshipResult:
    """
    Analyzes the relationship between two selected columns.
    """

    if column_a not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_a,
        )

    if column_b not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_b,
        )

    if column_a == column_b:
        raise InvalidOperationError(
            "Please select two different columns."
        )

    series_a = dataframe[column_a]
    series_b = dataframe[column_b]

    column_a_type = detect_column_type(series_a)
    column_b_type = detect_column_type(series_b)

    print(
    f"[RELATIONSHIP DEBUG] "
    f"{column_a}={column_a_type} "
    f"(dtype={series_a.dtype}), "
    f"{column_b}={column_b_type} "
    f"(dtype={series_b.dtype})"
)
    
    analysis_type = determine_analysis_type(
        column_a_type,
        column_b_type,
    )

    # Numeric ↔ Numeric
    if analysis_type == "numeric_numeric":

        (
            correlation,
            strength,
            direction,
            sample_size,
        ) = calculate_numeric_relationship(
            series_a,
            series_b,
        )

        return RelationshipResult(
            column_a=column_a,
            column_b=column_b,
            column_a_type=column_a_type,
            column_b_type=column_b_type,
            analysis_type=analysis_type,
            correlation=correlation,
            strength=strength,
            direction=direction,
            sample_size=sample_size,
        )

    # Categorical ↔ Categorical
    if analysis_type == "categorical_categorical":

        (
            contingency_table,
            sample_size,
        ) = calculate_categorical_relationship(
            series_a,
            series_b,
        )

        association = calculate_cramers_v(
            series_a=series_a,
            series_b=series_b,
        )

        strength = determine_association_strength(
            association
        )

        return RelationshipResult(
            column_a=column_a,
            column_b=column_b,
            column_a_type=column_a_type,
            column_b_type=column_b_type,
            analysis_type=analysis_type,
            strength=strength,
            direction=None,
            correlation=None,
            association=association,
            sample_size=sample_size,
            result={
                "contingency_table": contingency_table
            },
        )

    # Numeric ↔ Categorical
    if analysis_type == "numeric_categorical":

        if column_a_type == "numeric":
            numeric_series = series_a
            categorical_series = series_b
        else:
            numeric_series = series_b
            categorical_series = series_a

        (
        grouped_statistics,
            sample_size,
        ) = calculate_numeric_categorical_relationship(
            numeric_series=numeric_series,
            categorical_series=categorical_series,
        )

        association = calculate_eta(
            numeric_series=numeric_series,
            categorical_series=categorical_series,
        )

        strength = determine_association_strength(
            association
        )

        return RelationshipResult(
            column_a=column_a,
            column_b=column_b,
            column_a_type=column_a_type,
            column_b_type=column_b_type,
            analysis_type=analysis_type,
            strength=strength,
            association=association,
            sample_size=sample_size,
            result={
                "grouped_statistics": grouped_statistics,
            },
        )

    raise InvalidOperationError(
        "Unsupported relationship analysis."
    )