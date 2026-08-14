import pandas as pd

from app.models.cleaning import CleaningRecommendation


def calculate_missing_percentage(
    missing_count: int,
    total_rows: int,
) -> float:
    if total_rows == 0:
        return 0.0

    return round(
        (missing_count / total_rows) * 100,
        2,
    )


def determine_missing_severity(
    percentage: float,
) -> str:
    if percentage == 100:
        return "complete"

    if percentage >= 70:
        return "very_high"

    if percentage >= 30:
        return "high"

    if percentage >= 10:
        return "moderate"

    return "low"


def get_categorical_statistics(
    series: pd.Series,
) -> dict:
    clean_series = series.dropna()

    if clean_series.empty:
        return {
            "unique_values": 0,
            "mode": None,
            "mode_frequency": 0,
        }

    value_counts = clean_series.value_counts()

    return {
        "unique_values": int(clean_series.nunique()),
        "mode": value_counts.index[0],
        "mode_frequency": int(value_counts.iloc[0]),
    }


def get_categorical_operations(
    percentage: float,
) -> tuple[str | None, list[str]]:

    operations = [
        "keep_missing",
        "fill_missing_placeholder",
        "fill_missing_mode",
        "drop_column",
    ]

    if percentage >= 70:
        return None, operations

    return "fill_missing_mode", operations


def get_numeric_operations(
    percentage: float,
    skewness: float,
) -> tuple[str | None, list[str]]:

    operations = [
        "keep_missing",
        "fill_missing_mean",
        "fill_missing_median",
        "drop_column",
    ]

    if percentage >= 70:
        return None, operations

    if abs(skewness) > 1:
        return "fill_missing_median", operations

    return "fill_missing_mean", operations


def analyze_missing_values(
    dataframe: pd.DataFrame,
) -> list[CleaningRecommendation]:

    recommendations = []

    total_rows = len(dataframe)

    if total_rows == 0:
        return recommendations

    for column in dataframe.columns:

        series = dataframe[column]

        missing_count = int(series.isna().sum())

        if missing_count == 0:
            continue

        percentage = calculate_missing_percentage(
            missing_count=missing_count,
            total_rows=total_rows,
        )

        severity = determine_missing_severity(
            percentage=percentage,
        )

        # -----------------------------------------
        # NUMERIC COLUMN
        # -----------------------------------------

        if pd.api.types.is_numeric_dtype(series):

            clean_series = series.dropna()

            # Entire column is missing
            if clean_series.empty:

                suggested_operation = None

                available_operations = [
                    "keep_missing",
                    "drop_column",
                ]

                statistics = {
                    "unique_values": 0,
                    "mean": None,
                    "median": None,
                    "skewness": None,
                }

                reason = (
                    f"Numeric column contains {missing_count} missing "
                    f"value(s) ({percentage}%). The entire column is "
                    "missing, so there is no observed data from which "
                    "to estimate replacement values. The user should "
                    "decide whether to retain or remove the column."
                )

            else:

                skewness = float(clean_series.skew())

                mean = float(clean_series.mean())
                median = float(clean_series.median())

                (
                    suggested_operation,
                    available_operations,
                ) = get_numeric_operations(
                    percentage=percentage,
                    skewness=skewness,
                )

                statistics = {
                    "unique_values": int(clean_series.nunique()),
                    "mean": round(mean, 4),
                    "median": round(median, 4),
                    "skewness": round(skewness, 4),
                }

                if suggested_operation == "fill_missing_median":

                    reason = (
                        f"Numeric column has {missing_count} missing "
                        f"value(s) ({percentage}%). The observed values "
                        f"have skewness of {skewness:.2f}. Median "
                        "imputation is suggested because the distribution "
                        "is strongly skewed. The user can alternatively "
                        "keep the missing values, use the mean, or drop "
                        "the column."
                    )

                elif suggested_operation == "fill_missing_mean":

                    reason = (
                        f"Numeric column has {missing_count} missing "
                        f"value(s) ({percentage}%). The observed values "
                        f"have skewness of {skewness:.2f}. Mean "
                        "imputation is suggested because the distribution "
                        "is not strongly skewed. The user can alternatively "
                        "keep the missing values, use the median, or drop "
                        "the column."
                    )

                else:

                    reason = (
                        f"Numeric column has {missing_count} missing "
                        f"value(s) ({percentage}%). Missingness is very "
                        "high, so automatic imputation is not suggested. "
                        "The user should decide whether the missing values "
                        "should be retained, imputed, or the column "
                        "removed."
                    )

        # -----------------------------------------
        # CATEGORICAL COLUMN
        # -----------------------------------------

        else:

            statistics = get_categorical_statistics(
                series=series,
            )

            (
                suggested_operation,
                available_operations,
            ) = get_categorical_operations(
                percentage=percentage,
            )

            if suggested_operation == "fill_missing_mode":

                reason = (
                    f"Categorical column has {missing_count} missing "
                    f"value(s) ({percentage}%). Mode imputation is "
                    "suggested because missingness is not extremely "
                    "high. The user can alternatively keep missing "
                    "values, use a placeholder, or drop the column."
                )

            else:

                reason = (
                    f"Categorical column has {missing_count} missing "
                    f"value(s) ({percentage}%). Missingness is very "
                    "high, so automatic mode imputation is not "
                    "suggested because it could replace a large "
                    "number of missing values with the same category. "
                    "The user should decide whether to retain, "
                    "replace, or remove the column."
                )

        # -----------------------------------------
        # BUILD RECOMMENDATION
        # -----------------------------------------

        recommendations.append(
            CleaningRecommendation(
                column=column,
                issue="missing_values",
                count=missing_count,
                percentage=percentage,
                data_type=(
                    "numeric"
                    if pd.api.types.is_numeric_dtype(series)
                    else "categorical"
                ),
                severity=severity,
                suggested_operation=suggested_operation,
                available_operations=available_operations,
                statistics=statistics,
                reason=reason,
            )
        )

    return recommendations


def generate_cleaning_recommendations(
    dataframe: pd.DataFrame,
) -> list[CleaningRecommendation]:

    recommendations = []

    recommendations.extend(
        analyze_missing_values(dataframe)
    )

    return recommendations