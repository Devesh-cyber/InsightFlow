import pandas as pd


def detect_column_type(series: pd.Series) -> str:
    """
    Detect the logical analytical type of a dataset column.
    """

    if pd.api.types.is_bool_dtype(series):
        return "boolean"

    if pd.api.types.is_numeric_dtype(series):
        return "numeric"

    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"

    if (
        pd.api.types.is_object_dtype(series)
        or isinstance(series.dtype, pd.CategoricalDtype)
    ):
        return "categorical"

    return "unknown"