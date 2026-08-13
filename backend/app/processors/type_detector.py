import pandas as pd


def detect_column_type(series: pd.Series) -> str:
    """
    Detect the logical analytical type of a dataset column.
    """

    # Boolean
    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    # Numeric
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    # Datetime
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"

    # Categorical / string
    if (
        pd.api.types.is_object_dtype(series)
        or pd.api.types.is_string_dtype(series)
        or isinstance(series.dtype, pd.CategoricalDtype)
    ):
        return "categorical"

    return "unknown"