import pandas as pd

from app.models.cleaning import (
    CleaningRecommendation,
)


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

        if pd.api.types.is_numeric_dtype(series):

            clean_series = series.dropna()

            if clean_series.empty:
                operation = "drop_column"

                reason = (
                    "The numeric column contains only missing "
                    "values, so it cannot provide usable information."
                )

            else:
                skewness = float(clean_series.skew())

                if abs(skewness) > 1:
                    operation = "fill_missing_median"

                    reason = (
                        f"Numeric column has {missing_count} missing "
                        f"value(s) ({percentage}%). Its distribution "
                        f"is strongly skewed (skewness={skewness:.2f}), "
                        "so median imputation is preferred over mean "
                        "imputation because it is less sensitive to "
                        "extreme values."
                    )

                else:
                    operation = "fill_missing_mean"

                    reason = (
                        f"Numeric column has {missing_count} missing "
                        f"value(s) ({percentage}%). Its distribution "
                        f"is not strongly skewed (skewness={skewness:.2f}), "
                        "so mean imputation is suitable."
                    )

        else:

            operation = "fill_missing_mode"

            reason = (
                f"Categorical column has {missing_count} missing "
                f"value(s) ({percentage}%). Mode imputation is "
                "recommended because the most frequent observed "
                "category can be used to replace missing values."
            )

        recommendations.append(
            CleaningRecommendation(
                column=column,
                issue="missing_values",
                count=missing_count,
                percentage=percentage,
                recommended_operation=operation,
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