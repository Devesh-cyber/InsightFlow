import pandas as pd
import numpy as np

from app.models.visualization import (
    ChartOption,
    VisualizationOptions,
)

from app.processors.type_detector import detect_column_type

from app.core.exceptions import (
    ColumnNotFoundError,
    InvalidOperationError,
)

SUPPORTED_CHART_TYPES = {
    "histogram",
    "boxplot",
    "bar",
    "scatter",
    "heatmap",
    "grouped_bar",
    "line",
}
MAX_CATEGORIES = 20
MAX_SCATTER_POINTS = 10000
MAX_LINE_POINTS = 10000


def create_chart_option(
    chart_type: str,
    label: str,
    description: str,
) -> ChartOption:
    """
    Creates a standardized chart option.
    """

    return ChartOption(
        chart_type=chart_type,
        label=label,
        description=description,
    )


def get_single_column_charts(
    column_type: str,
) -> list[ChartOption]:
    """
    Returns charts that are appropriate for one selected column.
    """

    if column_type == "numeric":
        return [
            create_chart_option(
                chart_type="histogram",
                label="Histogram",
                description=(
                    "Shows the distribution of values "
                    "across numeric ranges."
                ),
            ),
            create_chart_option(
                chart_type="boxplot",
                label="Box Plot",
                description=(
                    "Shows the distribution, median, "
                    "spread, and potential outliers."
                ),
            ),
        ]

    if column_type == "categorical":
        return [
            create_chart_option(
                chart_type="bar",
                label="Bar Chart",
                description=(
                    "Shows the frequency of each category."
                ),
            ),
        ]

    if column_type == "boolean":
        return [
            create_chart_option(
                chart_type="bar",
                label="Bar Chart",
                description=(
                    "Shows the distribution of True and False values."
                ),
            ),
        ]

    if column_type == "datetime":
        return []

    return []


def get_two_column_charts(
    column_a_type: str,
    column_b_type: str,
) -> list[ChartOption]:
    """
    Returns charts appropriate for two selected columns.
    """

    if (
        column_a_type == "numeric"
        and column_b_type == "numeric"
    ):
        return [
            create_chart_option(
                chart_type="scatter",
                label="Scatter Plot",
                description=(
                    "Shows the relationship between "
                    "two numeric variables."
                ),
            ),
        ]

    if (
        column_a_type in {"categorical", "boolean"}
        and column_b_type in {"categorical", "boolean"}
    ):
        return [
            create_chart_option(
                chart_type="heatmap",
                label="Heatmap",
                description=(
                    "Visualizes the frequency of combinations "
                    "between two categorical variables."
                ),
            ),
        ]

    if (
        column_a_type == "numeric"
        and column_b_type in {"categorical", "boolean"}
    ) or (
        column_a_type in {"categorical", "boolean"}
        and column_b_type == "numeric"
    ):
        return [
            create_chart_option(
                chart_type="grouped_bar",
                label="Grouped Bar Chart",
                description=(
                    "Compares a numeric measure across categories."
                ),
            ),
            create_chart_option(
                chart_type="boxplot",
                label="Box Plot",
                description=(
                    "Compares the numeric distribution "
                    "across categories."
                ),
            ),
        ]

    if (
        column_a_type == "datetime"
        and column_b_type == "numeric"
    ) or (
        column_a_type == "numeric"
        and column_b_type == "datetime"
    ):
        return [
            create_chart_option(
                chart_type="line",
                label="Line Chart",
                description=(
                    "Shows how a numeric measure changes over time."
                ),
            ),
        ]

    return []


def _has_usable_values(series: pd.Series, column_type: str) -> bool:
    """Returns whether a column contains at least one usable value."""
    if column_type == "numeric":
        values = pd.to_numeric(series, errors="coerce")
        values = values.replace([np.inf, -np.inf], np.nan).dropna()
        return not values.empty
    if column_type == "datetime":
        values = pd.to_datetime(series, errors="coerce", utc=True).dropna()
        return not values.empty
    return not series.dropna().empty


def _collapse_categories(
    series: pd.Series,
    limit: int = MAX_CATEGORIES,
) -> pd.Series:
    """Keeps the most frequent categories and combines the remainder."""
    counts = series.value_counts(dropna=False)
    if len(counts) <= limit:
        return series

    keep = set(counts.head(limit).index)
    return series.map(
        lambda value: value if value in keep else "Other (combined)"
    )

def get_visualization_options(
    dataframe: pd.DataFrame,
    column_a: str,
    column_b: str | None = None,
) -> VisualizationOptions:
    """
    Determines which visualizations are appropriate
    for the selected columns.
    """

    if column_a not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_a
        )

    if (
        column_b is not None
        and column_b not in dataframe.columns
    ):
        raise ColumnNotFoundError(
            column_name=column_b
        )

    if (
        column_b is not None
        and column_a == column_b
    ):
        raise InvalidOperationError(
            "Please select two different columns."
        )

    column_a_type = detect_column_type(
        dataframe[column_a]
    )

    if not _has_usable_values(dataframe[column_a], column_a_type):
        return VisualizationOptions(
            column_a=column_a,
            column_b=column_b,
            available_charts=[],
        )

    if column_b is None:
        charts = get_single_column_charts(
            column_type=column_a_type
        )
    else:
        column_b_type = detect_column_type(dataframe[column_b])

        if not _has_usable_values(dataframe[column_b], column_b_type):
            return VisualizationOptions(
                column_a=column_a,
                column_b=column_b,
                available_charts=[],
            )

        charts = get_two_column_charts(
            column_a_type=column_a_type,
            column_b_type=column_b_type,
        )

        if charts:
            paired = pd.concat([dataframe[column_a], dataframe[column_b]], axis=1)
            if {column_a_type, column_b_type} == {"numeric", "numeric"}:
                usable = pd.concat(
                    [pd.to_numeric(paired.iloc[:, 0], errors="coerce"),
                     pd.to_numeric(paired.iloc[:, 1], errors="coerce")],
                    axis=1,
                ).replace([np.inf, -np.inf], np.nan).dropna()
            elif {column_a_type, column_b_type} == {"datetime", "numeric"}:
                dt_col = dataframe[column_a] if column_a_type == "datetime" else dataframe[column_b]
                num_col = dataframe[column_b] if column_a_type == "datetime" else dataframe[column_a]
                usable = pd.DataFrame({
                    "datetime": pd.to_datetime(dt_col, errors="coerce", utc=True),
                    "value": pd.to_numeric(num_col, errors="coerce"),
                }).replace([np.inf, -np.inf], np.nan).dropna()
            else:
                usable = paired.dropna()
            if usable.empty:
                charts = []

    return VisualizationOptions(
        column_a=column_a,
        column_b=column_b,
        available_charts=charts,
    )


def generate_histogram_data(
    series: pd.Series,
    bins: int = 10,
) -> list[dict]:
    """
    Generates frequency data for a numeric histogram.
    """

    clean_series = pd.to_numeric(series, errors="coerce")
    clean_series = clean_series.replace([np.inf, -np.inf], np.nan).dropna()

    if clean_series.empty:
        return []

    if clean_series.nunique() == 1:
        return [
            {
                "range": str(clean_series.iloc[0]),
                "count": int(len(clean_series)),
            }
        ]

    bins = max(1, min(int(bins), int(clean_series.nunique())))

    counts, _ = pd.cut(
        clean_series,
        bins=bins,
        retbins=True,
        include_lowest=True,
    )

    frequencies = counts.value_counts(
        sort=False
    )

    data = []

    for interval, frequency in frequencies.items():
        data.append(
            {
                "range": str(interval),
                "count": int(frequency),
            }
        )

    return data


MAX_OUTLIERS_PER_GROUP = 1000


def _compute_boxplot_stats(
    series: pd.Series,
    max_outliers: int = MAX_OUTLIERS_PER_GROUP,
) -> dict:
    """
    Computes boxplot statistics (Q1, median, Q3, IQR, fences, whiskers, and capped outliers).
    """
    clean_series = pd.to_numeric(series, errors="coerce")
    clean_series = clean_series.replace([np.inf, -np.inf], np.nan).dropna()

    if clean_series.empty:
        return {}

    q1 = float(clean_series.quantile(0.25))
    median = float(clean_series.median())
    q3 = float(clean_series.quantile(0.75))
    iqr = q3 - q1

    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr

    non_outliers = clean_series[
        (clean_series >= lower_fence) & (clean_series <= upper_fence)
    ]

    if not non_outliers.empty:
        minimum = float(non_outliers.min())
        maximum = float(non_outliers.max())
    else:
        minimum = q1
        maximum = q3

    outlier_series = clean_series[
        (clean_series < lower_fence) | (clean_series > upper_fence)
    ]
    total_outliers = len(outlier_series)

    if total_outliers > max_outliers:
        outliers = [float(v) for v in outlier_series.iloc[:max_outliers]]
        outliers_truncated = True
    else:
        outliers = [float(v) for v in outlier_series]
        outliers_truncated = False

    return {
        "minimum": minimum,
        "q1": q1,
        "median": median,
        "q3": q3,
        "maximum": maximum,
        "iqr": iqr,
        "lower_fence": lower_fence,
        "upper_fence": upper_fence,
        "outliers": outliers,
        "outliers_truncated": outliers_truncated,
    }


def generate_boxplot_data(
    series: pd.Series,
) -> dict:
    """
    Generates summary statistics and outliers required for a box plot.
    """
    return _compute_boxplot_stats(series)


def generate_bar_data(
    series: pd.Series,
    limit: int = MAX_CATEGORIES,
) -> list[dict]:
    """Generates category frequencies, preserving the remainder as Other."""

    clean_series = series.dropna()
    if clean_series.empty:
        return []

    counts = clean_series.value_counts()
    if len(counts) <= limit:
        selected = counts
        other_count = 0
    else:
        selected = counts.head(limit)
        other_count = int(counts.iloc[limit:].sum())

    data = [
        {"category": str(category), "count": int(count)}
        for category, count in selected.items()
    ]
    if other_count:
        data.append({"category": "Other", "count": other_count})
    return data


def generate_scatter_data(
    series_x: pd.Series,
    series_y: pd.Series,
    max_points: int = MAX_SCATTER_POINTS,
) -> list[dict]:
    """Generates finite paired numeric points with deterministic downsampling."""

    paired_data = pd.concat(
        [pd.to_numeric(series_x, errors="coerce"),
         pd.to_numeric(series_y, errors="coerce")],
        axis=1,
    ).replace([np.inf, -np.inf], np.nan).dropna()

    if len(paired_data) > max_points:
        indices = np.linspace(0, len(paired_data) - 1, max_points, dtype=int)
        paired_data = paired_data.iloc[indices]

    return [
        {"x": float(x), "y": float(y)}
        for x, y in paired_data.itertuples(index=False, name=None)
    ]


def generate_line_data(
    datetime_series: pd.Series,
    numeric_series: pd.Series,
    max_points: int = MAX_LINE_POINTS,
) -> list[dict]:
    """Generates sorted finite time-series points with deterministic downsampling."""

    paired_data = pd.DataFrame({
        "datetime": pd.to_datetime(datetime_series, errors="coerce", utc=True),
        "value": pd.to_numeric(numeric_series, errors="coerce"),
    })
    paired_data = (
        paired_data
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
        .sort_values("datetime")
    )

    if paired_data.empty:
        return []

    if len(paired_data) > max_points:
        indices = np.linspace(0, len(paired_data) - 1, max_points, dtype=int)
        paired_data = paired_data.iloc[indices]

    return [
        {"date": timestamp.isoformat(), "value": float(value)}
        for timestamp, value in paired_data.itertuples(index=False, name=None)
    ]


def generate_categorical_heatmap_data(
    series_x: pd.Series,
    series_y: pd.Series,
) -> list[dict]:
    """Generates bounded frequency data for a categorical heatmap."""

    paired_data = pd.concat([series_x, series_y], axis=1).dropna()
    if paired_data.empty:
        return []

    x = _collapse_categories(paired_data.iloc[:, 0])
    y = _collapse_categories(paired_data.iloc[:, 1])
    table = pd.crosstab(x, y)

    return [
        {
            "x": str(x_value),
            "y": str(y_value),
            "count": int(table.loc[x_value, y_value]),
        }
        for x_value in table.index
        for y_value in table.columns
    ]


def generate_grouped_numeric_data(
    numeric_series: pd.Series,
    categorical_series: pd.Series,
) -> list[dict]:
    """Generates grouped means/counts using finite numeric observations."""

    paired_data = pd.DataFrame({
        "numeric": pd.to_numeric(numeric_series, errors="coerce"),
        "category": categorical_series,
    })
    paired_data = (
        paired_data
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )
    if paired_data.empty:
        return []

    paired_data["category"] = _collapse_categories(paired_data["category"])
    grouped = paired_data.groupby("category", sort=False)["numeric"].agg(
        mean="mean", count="count"
    )

    return [
        {
            "category": str(category),
            "value": float(row["mean"]),
            "count": int(row["count"]),
        }
        for category, row in grouped.iterrows()
    ]


def generate_chart_data(
    dataframe: pd.DataFrame,
    column_a: str,
    chart_type: str,
    column_b: str | None = None,
) -> dict:
    """
    Generates the data required by the frontend
    for the requested chart.
    """

    if chart_type not in SUPPORTED_CHART_TYPES:
        raise InvalidOperationError(
            f"Unsupported chart type: '{chart_type}'."
        )

    if column_a not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_a
        )

    if (
        column_b is not None
        and column_b not in dataframe.columns
    ):
        raise ColumnNotFoundError(
            column_name=column_b
        )

    if (
        column_b is not None
        and column_a == column_b
    ):
        raise InvalidOperationError(
            "Please select two different columns."
        )

    series_a = dataframe[column_a]

    # --------------------------------
    # Single-column visualizations
    # --------------------------------

    if chart_type == "histogram":

        if detect_column_type(series_a) != "numeric":
            raise InvalidOperationError(
                "Histogram requires a numeric column."
            )

        data = generate_histogram_data(
            series=series_a
        )

        return {
            "chart_type": "histogram",
            "title": f"Distribution of {column_a}",
            "x_label": column_a,
            "y_label": "Frequency",
            "data": data,
        }

    if (
        chart_type == "boxplot"
        and column_b is None
    ):

        if detect_column_type(series_a) != "numeric":
            raise InvalidOperationError(
                "Box plot requires a numeric column."
            )

        data = generate_boxplot_data(
            series=series_a
        )

        return {
            "chart_type": "boxplot",
            "title": f"Distribution of {column_a}",
            "x_label": column_a,
            "y_label": None,
            "data": [data] if data else [],
        }

    if chart_type == "bar":

        if detect_column_type(series_a) not in {
            "categorical",
            "boolean",
        }:
            raise InvalidOperationError(
                "Bar chart requires a categorical "
                "or boolean column."
            )

        data = generate_bar_data(
            series=series_a
        )

        return {
            "chart_type": "bar",
            "title": f"Distribution of {column_a}",
            "x_label": column_a,
            "y_label": "Count",
            "data": data,
        }

    # --------------------------------
    # Two-column visualizations
    # --------------------------------

    if column_b is None:
        raise InvalidOperationError(
            f"Chart '{chart_type}' requires two columns."
        )

    series_b = dataframe[column_b]

    type_a = detect_column_type(series_a)
    type_b = detect_column_type(series_b)

    if chart_type == "line":

        if {type_a, type_b} != {"datetime", "numeric"}:
            raise InvalidOperationError(
                "Line chart requires one datetime and one numeric column."
            )

        if type_a == "datetime":
            datetime_series = series_a
            numeric_series = series_b
        else:
            datetime_series = series_b
            numeric_series = series_a

        data = generate_line_data(
            datetime_series=datetime_series,
            numeric_series=numeric_series,
        )

        return {
            "chart_type": "line",
            "title": f"{numeric_series.name} over time",
            "x_label": str(datetime_series.name),
            "y_label": str(numeric_series.name),
            "data": data,
        }

    if chart_type == "scatter":

        if (
            type_a != "numeric"
            or type_b != "numeric"
        ):
            raise InvalidOperationError(
                "Scatter plot requires two numeric columns."
            )

        data = generate_scatter_data(
            series_x=series_a,
            series_y=series_b,
        )

        return {
            "chart_type": "scatter",
            "title": f"{column_a} vs {column_b}",
            "x_label": column_a,
            "y_label": column_b,
            "data": data,
        }

    if chart_type == "heatmap":

        if (
            type_a not in {"categorical", "boolean"}
            or type_b not in {"categorical", "boolean"}
        ):
            raise InvalidOperationError(
                "Heatmap requires two categorical columns."
            )

        data = generate_categorical_heatmap_data(
            series_x=series_a,
            series_y=series_b,
        )

        return {
            "chart_type": "heatmap",
            "title": f"{column_a} vs {column_b}",
            "x_label": column_a,
            "y_label": column_b,
            "data": data,
        }

    if chart_type == "boxplot":

        if (
            type_a == "numeric"
            and type_b in {"categorical", "boolean"}
        ):
            numeric_series = series_a
            categorical_series = series_b

        elif (
            type_a in {"categorical", "boolean"}
            and type_b == "numeric"
        ):
            numeric_series = series_b
            categorical_series = series_a

        else:
            raise InvalidOperationError(
                "Grouped box plot requires "
                "a numeric and categorical column."
            )

        data = generate_grouped_boxplot_data(
            numeric_series=numeric_series,
            categorical_series=categorical_series,
        )

        return {
            "chart_type": "boxplot",
            "title": (
                f"{numeric_series.name} "
                f"by {categorical_series.name}"
            ),
            "x_label": str(categorical_series.name),
            "y_label": str(numeric_series.name),
            "data": data,
        }

    if chart_type == "grouped_bar":

        if (
            type_a == "numeric"
            and type_b in {"categorical", "boolean"}
        ):
            numeric_series = series_a
            categorical_series = series_b

        elif (
            type_a in {"categorical", "boolean"}
            and type_b == "numeric"
        ):
            numeric_series = series_b
            categorical_series = series_a

        else:
            raise InvalidOperationError(
                "Grouped bar chart requires "
                "a numeric and categorical column."
            )

        data = generate_grouped_numeric_data(
            numeric_series=numeric_series,
            categorical_series=categorical_series,
        )

        return {
            "chart_type": "grouped_bar",
            "title": (
                f"{numeric_series.name} "
                f"by {categorical_series.name}"
            ),
            "x_label": str(categorical_series.name),
            "y_label": str(numeric_series.name),
            "data": data,
        }

    raise InvalidOperationError(
        f"Unsupported chart type: '{chart_type}'."
    )


def generate_grouped_boxplot_data(
    numeric_series: pd.Series,
    categorical_series: pd.Series,
) -> list[dict]:
    """Generates bounded box-plot statistics for numeric values by category."""

    paired_data = pd.DataFrame({
        "numeric": pd.to_numeric(numeric_series, errors="coerce"),
        "category": categorical_series,
    })
    paired_data = (
        paired_data
        .replace([np.inf, -np.inf], np.nan)
        .dropna()
    )
    if paired_data.empty:
        return []

    paired_data["category"] = _collapse_categories(paired_data["category"])
    data = []
    for category, values in paired_data.groupby("category", sort=False)["numeric"]:
        stats = _compute_boxplot_stats(values)
        if stats:
            stats["category"] = str(category)
            data.append(stats)
    return data
