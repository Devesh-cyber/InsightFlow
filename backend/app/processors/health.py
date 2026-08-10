import pandas as pd

from app.models.health import (
    HealthAlert,
    HealthResponse,
    IssueSummary,
    Recommendation,
)


def detect_empty_columns(dataframe: pd.DataFrame) -> list[str]:
    """
    Detects columns where every value is missing.
    """

    return dataframe.columns[
        dataframe.isna().all()
    ].tolist()


def detect_constant_columns(dataframe: pd.DataFrame) -> list[str]:
    """
    Detects columns containing only one unique non-missing value.
    """

    constant_columns = []

    for column in dataframe.columns:
        unique_count = dataframe[column].nunique(dropna=True)

        if unique_count == 1:
            constant_columns.append(column)

    return constant_columns


def calculate_health_score(
    dataframe: pd.DataFrame,
    missing_cells: int,
    duplicate_rows: int,
    empty_columns: list[str],
    constant_columns: list[str]
) -> float:
    """
    Calculates a simple and transparent dataset health score.
    """

    score = 100.0

    total_cells = dataframe.shape[0] * dataframe.shape[1]

    if total_cells > 0:
        missing_percentage = (
            missing_cells / total_cells
        ) * 100

        score -= missing_percentage * 0.5

    if len(dataframe) > 0:
        duplicate_percentage = (
            duplicate_rows / len(dataframe)
        ) * 100

        score -= duplicate_percentage * 0.5

    score -= len(empty_columns) * 10
    score -= len(constant_columns) * 5

    return round(max(score, 0), 2)


def determine_quality(health_score: float) -> str:
    """
    Determines dataset quality based on the health score.
    """

    if health_score >= 95:
        return "excellent"

    if health_score >= 80:
        return "good"

    if health_score >= 60:
        return "fair"

    return "poor"


def generate_alerts(
    missing_cells: int,
    duplicate_rows: int,
    empty_columns: list[str],
    constant_columns: list[str]
) -> list[HealthAlert]:
    """
    Generates alerts based on detected dataset issues.
    """

    alerts = []

    if missing_cells > 0:
        alerts.append(
            HealthAlert(
                severity="warning",
                title="Missing values detected",
                message=(
                    f"The dataset contains {missing_cells} "
                    "missing cells."
                )
            )
        )

    if duplicate_rows > 0:
        alerts.append(
            HealthAlert(
                severity="warning",
                title="Duplicate rows detected",
                message=(
                    f"The dataset contains {duplicate_rows} "
                    "duplicate rows."
                )
            )
        )

    if empty_columns:
        alerts.append(
            HealthAlert(
                severity="critical",
                title="Empty columns detected",
                message=(
                    f"{len(empty_columns)} completely empty "
                    "column(s) were detected."
                )
            )
        )

    if constant_columns:
        alerts.append(
            HealthAlert(
                severity="info",
                title="Constant columns detected",
                message=(
                    f"{len(constant_columns)} column(s) contain "
                    "only one unique value."
                )
            )
        )

    return alerts


def generate_recommendations(
    missing_cells: int,
    duplicate_rows: int,
    empty_columns: list[str],
    constant_columns: list[str]
) -> list[Recommendation]:
    """
    Generates rule-based recommendations for improving dataset quality.
    """

    recommendations = []

    if missing_cells > 0:
        recommendations.append(
            Recommendation(
                priority="high",
                title="Handle missing values",
                action=(
                    "Review missing values and decide whether to "
                    "remove, fill, or retain them."
                )
            )
        )

    if duplicate_rows > 0:
        recommendations.append(
            Recommendation(
                priority="medium",
                title="Review duplicate rows",
                action=(
                    "Inspect duplicate rows and remove unnecessary "
                    "duplicates if they do not represent valid records."
                )
            )
        )

    if empty_columns:
        recommendations.append(
            Recommendation(
                priority="high",
                title="Remove empty columns",
                action=(
                    "Consider removing columns that contain no usable data."
                )
            )
        )

    if constant_columns:
        recommendations.append(
            Recommendation(
                priority="low",
                title="Review constant columns",
                action=(
                    "Consider removing columns with only one unique value "
                    "if they do not provide useful information."
                )
            )
        )

    return recommendations


def build_health(dataframe: pd.DataFrame) -> HealthResponse:
    """
    Builds the complete dataset health report.
    """

    missing_cells = int(dataframe.isna().sum().sum())
    duplicate_rows = int(dataframe.duplicated().sum())

    empty_columns = detect_empty_columns(dataframe)
    constant_columns = detect_constant_columns(dataframe)

    health_score = calculate_health_score(
        dataframe=dataframe,
        missing_cells=missing_cells,
        duplicate_rows=duplicate_rows,
        empty_columns=empty_columns,
        constant_columns=constant_columns
    )

    issues = IssueSummary(
        missing_cells=missing_cells,
        duplicate_rows=duplicate_rows,
        empty_columns=len(empty_columns),
        constant_columns=len(constant_columns)
    )

    return HealthResponse(
        health_score=health_score,
        quality=determine_quality(health_score),
        issues=issues,
        alerts=generate_alerts(
            missing_cells,
            duplicate_rows,
            empty_columns,
            constant_columns
        ),
        recommendations=generate_recommendations(
            missing_cells,
            duplicate_rows,
            empty_columns,
            constant_columns
        )
    )