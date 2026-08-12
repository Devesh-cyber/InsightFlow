import pandas as pd

from app.models.visualization import (
    ChartOption,
    VisualizationOptions,
)
from app.processors.type_detector import detect_column_type

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
    column_a_type == "categorical"
    and column_b_type == "categorical"
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
        and column_b_type == "categorical"
    ) or (
        column_a_type == "categorical"
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

    return []


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
        raise ValueError(
            f"Column '{column_a}' does not exist."
        )

    if column_b is not None and column_b not in dataframe.columns:
        raise ValueError(
            f"Column '{column_b}' does not exist."
        )

    if column_b is not None and column_a == column_b:
        raise ValueError(
            "Please select two different columns."
        )

    column_a_type = detect_column_type(
        dataframe[column_a]
    )

    if column_b is None:

        charts = get_single_column_charts(
            column_type=column_a_type
        )

    else:

        column_b_type = detect_column_type(
            dataframe[column_b]
        )

        charts = get_two_column_charts(
            column_a_type=column_a_type,
            column_b_type=column_b_type,
        )

    return VisualizationOptions(
        column_a=column_a,
        column_b=column_b,
        available_charts=charts,
    )


def generate_histogram_data(
    series: pd.Series,
    bins: int = 10
) -> list[dict]:
    """
    Generates frequency data for a numeric histogram.
    """

    clean_series = series.dropna()

    if clean_series.empty:
        return []

    counts, _ = pd.cut(
        clean_series,
        bins=bins,
        retbins=True,
        include_lowest=True
    )

    frequencies = counts.value_counts(
        sort=False
    )

    data = []

    for interval, frequency in frequencies.items():
        data.append({
            "range": str(interval),
            "count": int(frequency)
        })

    return data


def generate_boxplot_data(
    series: pd.Series
) -> dict:
    """
    Generates summary statistics required for a box plot.
    """

    clean_series = series.dropna()

    if clean_series.empty:
        return {}

    return {
        "minimum": float(clean_series.min()),
        "q1": float(clean_series.quantile(0.25)),
        "median": float(clean_series.median()),
        "q3": float(clean_series.quantile(0.75)),
        "maximum": float(clean_series.max())
    }


def generate_bar_data(
    series: pd.Series,
    limit: int = 20
) -> list[dict]:
    """
    Generates category frequency data for a bar chart.
    """

    clean_series = series.dropna()

    if clean_series.empty:
        return []

    counts = clean_series.value_counts()

    counts = counts.head(limit)

    return [
        {
            "category": str(category),
            "count": int(count)
        }
        for category, count in counts.items()
    ]


def generate_scatter_data(
    series_x: pd.Series,
    series_y: pd.Series
) -> list[dict]:
    """
    Generates paired numeric data for a scatter plot.
    """

    paired_data = pd.concat(
        [series_x, series_y],
        axis=1
    ).dropna()

    return [
        {
            "x": float(row.iloc[0]),
            "y": float(row.iloc[1])
        }
        for _, row in paired_data.iterrows()
    ]


def generate_categorical_heatmap_data(
    series_x: pd.Series,
    series_y: pd.Series
) -> list[dict]:
    """
    Generates frequency data for a categorical heatmap.
    """

    paired_data = pd.concat(
        [series_x, series_y],
        axis=1
    ).dropna()

    if paired_data.empty:
        return []

    table = pd.crosstab(
        paired_data.iloc[:, 0],
        paired_data.iloc[:, 1]
    )

    data = []

    for x_value in table.index:
        for y_value in table.columns:

            data.append({
                "x": str(x_value),
                "y": str(y_value),
                "count": int(
                    table.loc[x_value, y_value]
                )
            })

    return data



def generate_grouped_numeric_data(
    numeric_series: pd.Series,
    categorical_series: pd.Series,
) -> list[dict]:
    """
    Generates grouped mean values and observation counts
    for numeric data across categorical groups.
    """

    paired_data = pd.concat(
        [numeric_series, categorical_series],
        axis=1,
    ).dropna()

    if paired_data.empty:
        return []

    numeric_column = paired_data.iloc[:, 0]
    categorical_column = paired_data.iloc[:, 1]

    grouped = (
        paired_data
        .groupby(categorical_column)[numeric_column.name]
        .agg(
            mean="mean",
            count="count",
        )
        .round(2)
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

    if column_a not in dataframe.columns:
        raise ValueError(
            f"Column '{column_a}' does not exist."
        )

    if column_b is not None and column_b not in dataframe.columns:
        raise ValueError(
            f"Column '{column_b}' does not exist."
        )

    if column_b is not None and column_a == column_b:
        raise ValueError(
            "Please select two different columns."
        )

    series_a = dataframe[column_a]

    # --------------------------------
    # Single-column visualizations
    # --------------------------------

    if chart_type == "histogram":

        if detect_column_type(series_a) != "numeric":
            raise ValueError(
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

    if chart_type == "boxplot" and column_b is None:

        if detect_column_type(series_a) != "numeric":
            raise ValueError(
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
            raise ValueError(
                "Bar chart requires a categorical or boolean column."
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
        raise ValueError(
            f"Chart '{chart_type}' requires two columns."
        )

    series_b = dataframe[column_b]

    type_a = detect_column_type(series_a)
    type_b = detect_column_type(series_b)

    if chart_type == "scatter":

        if type_a != "numeric" or type_b != "numeric":
            raise ValueError(
                "Scatter plot requires two numeric columns."
            )

        data = generate_scatter_data(
            series_x=series_a,
            series_y=series_b
        )

        return {
            "chart_type": "scatter",
            "title": f"{column_a} vs {column_b}",
            "x_label": column_a,
            "y_label": column_b,
            "data": data,
        }

    if chart_type == "heatmap":

        if type_a != "categorical" or type_b != "categorical":
            raise ValueError(
                "Heatmap requires two categorical columns."
            )

        data = generate_categorical_heatmap_data(
            series_x=series_a,
            series_y=series_b
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
            and type_b == "categorical"
        ):
            numeric_series = series_a
            categorical_series = series_b

        elif (
            type_a == "categorical"
            and type_b == "numeric"
        ):
            numeric_series = series_b
            categorical_series = series_a

        else:
            raise ValueError(
                "Grouped box plot requires "
                "a numeric and categorical column."
            )

        data = generate_grouped_boxplot_data(
            numeric_series=numeric_series,
            categorical_series=categorical_series
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
            and type_b == "categorical"
        ):
            numeric_series = series_a
            categorical_series = series_b

        elif (
            type_a == "categorical"
            and type_b == "numeric"
        ):
            numeric_series = series_b
            categorical_series = series_a

        else:
            raise ValueError(
                "Grouped bar chart requires "
                "a numeric and categorical column."
            )

        data = generate_grouped_numeric_data(
            numeric_series=numeric_series,
            categorical_series=categorical_series
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

    raise ValueError(
        f"Unsupported chart type: '{chart_type}'."
    )


def generate_grouped_boxplot_data(
    numeric_series: pd.Series,
    categorical_series: pd.Series
) -> list[dict]:
    """
    Generates box plot statistics for a numeric column
    grouped by a categorical column.
    """

    paired_data = pd.concat(
        [numeric_series, categorical_series],
        axis=1
    ).dropna()

    if paired_data.empty:
        return []

    numeric_column = paired_data.iloc[:, 0]
    categorical_column = paired_data.iloc[:, 1]

    grouped = paired_data.groupby(
        categorical_column
    )[numeric_column.name]

    data = []

    for category, values in grouped:

        if values.empty:
            continue

        data.append({
            "category": str(category),
            "minimum": float(values.min()),
            "q1": float(values.quantile(0.25)),
            "median": float(values.median()),
            "q3": float(values.quantile(0.75)),
            "maximum": float(values.max()),
        })

    return data