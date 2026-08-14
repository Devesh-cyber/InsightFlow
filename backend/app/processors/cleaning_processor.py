import pandas as pd

from app.models.cleaning import (
    CleaningOperation,
    CleaningRequest,
)

from app.core.exceptions import (
    ColumnNotFoundError,
    InvalidOperationError,
)


def drop_duplicate_rows(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Remove exact duplicate rows from the dataset.
    """

    duplicate_count = int(
        dataframe.duplicated().sum()
    )

    if duplicate_count == 0:
        operation = CleaningOperation(
            operation="drop_duplicates",
            affected_rows=0,
            reason="No duplicate rows were found.",
        )

        return dataframe.copy(), operation

    cleaned_dataframe = (
        dataframe
        .drop_duplicates()
        .copy()
    )

    operation = CleaningOperation(
        operation="drop_duplicates",
        affected_rows=duplicate_count,
        reason="Exact duplicate rows were removed.",
    )

    return cleaned_dataframe, operation


def drop_empty_columns(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Remove columns where every value is missing.
    """

    empty_columns = dataframe.columns[
        dataframe.isna().all()
    ].tolist()

    if not empty_columns:
        operation = CleaningOperation(
            operation="drop_empty_columns",
            affected_columns=0,
            reason="No completely empty columns were found.",
        )

        return dataframe.copy(), operation

    cleaned_dataframe = (
        dataframe
        .drop(columns=empty_columns)
        .copy()
    )

    operation = CleaningOperation(
        operation="drop_empty_columns",
        affected_columns=len(empty_columns),
        reason=(
            f"Removed {len(empty_columns)} completely "
            "empty column(s)."
        ),
    )

    return cleaned_dataframe, operation


def drop_constant_columns(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Remove columns containing only one unique
    non-missing value.
    """

    constant_columns = []

    for column in dataframe.columns:

        unique_count = dataframe[column].nunique(
            dropna=True
        )

        if unique_count == 1:
            constant_columns.append(column)

    if not constant_columns:
        operation = CleaningOperation(
            operation="drop_constant_columns",
            affected_columns=0,
            reason="No constant columns were found.",
        )

        return dataframe.copy(), operation

    cleaned_dataframe = (
        dataframe
        .drop(columns=constant_columns)
        .copy()
    )

    operation = CleaningOperation(
        operation="drop_constant_columns",
        affected_columns=len(constant_columns),
        reason=(
            f"Removed {len(constant_columns)} "
            "constant column(s) with no variation."
        ),
    )

    return cleaned_dataframe, operation


def drop_missing_rows(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Remove rows containing one or more missing values.
    """

    missing_rows = int(
        dataframe.isna()
        .any(axis=1)
        .sum()
    )

    if missing_rows == 0:
        operation = CleaningOperation(
            operation="drop_missing_rows",
            affected_rows=0,
            reason=(
                "No rows containing missing values were found."
            ),
        )

        return dataframe.copy(), operation

    cleaned_dataframe = (
        dataframe
        .dropna()
        .copy()
    )

    operation = CleaningOperation(
        operation="drop_missing_rows",
        affected_rows=missing_rows,
        reason=(
            "Removed rows containing one or more "
            "missing values."
        ),
    )

    return cleaned_dataframe, operation


def drop_column(
    dataframe: pd.DataFrame,
    column_name: str,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Remove a user-selected column from the dataset.
    """

    if column_name not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_name
        )

    cleaned_dataframe = (
        dataframe
        .drop(columns=[column_name])
        .copy()
    )

    operation = CleaningOperation(
        operation="drop_column",
        column_name=column_name,
        affected_columns=1,
        reason=(
            f"Column '{column_name}' was removed "
            "by user request."
        ),
    )

    return cleaned_dataframe, operation


def fill_missing_mean(
    dataframe: pd.DataFrame,
    column_name: str,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Fill missing values in a numeric column using its mean.
    """

    if column_name not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_name
        )

    series = dataframe[column_name]

    if not pd.api.types.is_numeric_dtype(series):
        raise InvalidOperationError(
            "Mean imputation can only be used "
            "with numeric columns."
        )

    missing_count = int(
        series.isna().sum()
    )

    if missing_count == 0:
        operation = CleaningOperation(
            operation="fill_missing_mean",
            column_name=column_name,
            method="mean",
            affected_cells=0,
            reason=(
                f"No missing values were found "
                f"in '{column_name}'."
            ),
        )

        return dataframe.copy(), operation

    mean_value = series.mean()

    if pd.isna(mean_value):
        raise InvalidOperationError(
            f"Column '{column_name}' contains no valid "
            "values from which a mean can be calculated."
        )

    cleaned_dataframe = dataframe.copy()

    cleaned_dataframe[column_name] = (
        cleaned_dataframe[column_name]
        .fillna(mean_value)
    )

    operation = CleaningOperation(
        operation="fill_missing_mean",
        column_name=column_name,
        method="mean",
        affected_cells=missing_count,
        reason=(
            f"Filled {missing_count} missing value(s) "
            f"using the column mean ({mean_value:.2f})."
        ),
    )

    return cleaned_dataframe, operation


def fill_missing_median(
    dataframe: pd.DataFrame,
    column_name: str,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Fill missing values in a numeric column using its median.
    """

    if column_name not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_name
        )

    series = dataframe[column_name]

    if not pd.api.types.is_numeric_dtype(series):
        raise InvalidOperationError(
            "Median imputation can only be used "
            "with numeric columns."
        )

    missing_count = int(
        series.isna().sum()
    )

    if missing_count == 0:
        operation = CleaningOperation(
            operation="fill_missing_median",
            column_name=column_name,
            method="median",
            affected_cells=0,
            reason=(
                f"No missing values were found "
                f"in '{column_name}'."
            ),
        )

        return dataframe.copy(), operation

    median_value = series.median()

    if pd.isna(median_value):
        raise InvalidOperationError(
            f"Column '{column_name}' contains no valid "
            "values from which a median can be calculated."
        )

    cleaned_dataframe = dataframe.copy()

    cleaned_dataframe[column_name] = (
        cleaned_dataframe[column_name]
        .fillna(median_value)
    )

    operation = CleaningOperation(
        operation="fill_missing_median",
        column_name=column_name,
        method="median",
        affected_cells=missing_count,
        reason=(
            f"Filled {missing_count} missing value(s) "
            f"using the column median ({median_value:.2f})."
        ),
    )

    return cleaned_dataframe, operation


def fill_missing_mode(
    dataframe: pd.DataFrame,
    column_name: str,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Fill missing values using the most frequent value
    in the selected column.
    """

    if column_name not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_name
        )

    series = dataframe[column_name]

    missing_count = int(
        series.isna().sum()
    )

    if missing_count == 0:
        operation = CleaningOperation(
            operation="fill_missing_mode",
            column_name=column_name,
            method="mode",
            affected_cells=0,
            reason=(
                f"No missing values were found "
                f"in '{column_name}'."
            ),
        )

        return dataframe.copy(), operation

    modes = series.mode(
        dropna=True
    )

    if modes.empty:
        raise InvalidOperationError(
            f"Column '{column_name}' contains no valid "
            "value from which a mode can be calculated."
        )

    mode_value = modes.iloc[0]

    cleaned_dataframe = dataframe.copy()

    cleaned_dataframe[column_name] = (
        cleaned_dataframe[column_name]
        .fillna(mode_value)
    )

    operation = CleaningOperation(
        operation="fill_missing_mode",
        column_name=column_name,
        method="mode",
        affected_cells=missing_count,
        reason=(
            f"Filled {missing_count} missing value(s) "
            f"using the mode '{mode_value}'."
        ),
    )

    return cleaned_dataframe, operation

def fill_missing_placeholder(
    dataframe: pd.DataFrame,
    column_name: str,
    value: str,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Fill missing values using a user-provided placeholder.
    """

    if column_name not in dataframe.columns:
        raise ColumnNotFoundError(
            column_name=column_name
        )

    if value.strip() == "":
        raise InvalidOperationError(
            "Placeholder value cannot be empty."
        )

    series = dataframe[column_name]

    missing_count = int(
        series.isna().sum()
    )

    if missing_count == 0:
        operation = CleaningOperation(
            operation="fill_missing_placeholder",
            column_name=column_name,
            method="placeholder",
            affected_cells=0,
            reason=(
                f"No missing values were found "
                f"in '{column_name}'."
            ),
        )

        return dataframe.copy(), operation

    cleaned_dataframe = dataframe.copy()

    cleaned_dataframe[column_name] = (
        cleaned_dataframe[column_name]
        .fillna(value)
    )

    operation = CleaningOperation(
        operation="fill_missing_placeholder",
        column_name=column_name,
        method="placeholder",
        affected_cells=missing_count,
        reason=(
            f"Filled {missing_count} missing value(s) "
            f"using the placeholder '{value}'."
        ),
    )

    return cleaned_dataframe, operation


def apply_cleaning_operation(
    dataframe: pd.DataFrame,
    request: CleaningRequest,
) -> tuple[pd.DataFrame, CleaningOperation]:
    """
    Apply the requested cleaning operation to a copy
    of the provided DataFrame.
    """

    if request.operation == "drop_duplicates":
        return drop_duplicate_rows(dataframe)

    if request.operation == "drop_empty_columns":
        return drop_empty_columns(dataframe)

    if request.operation == "drop_constant_columns":
        return drop_constant_columns(dataframe)

    if request.operation == "drop_missing_rows":
        return drop_missing_rows(dataframe)

    if request.operation == "drop_column":

        if request.column_name is None:
            raise InvalidOperationError(
                "column_name is required when dropping a column."
            )

        return drop_column(
            dataframe=dataframe,
            column_name=request.column_name,
        )

    if request.operation == "fill_missing_mean":

        if request.column_name is None:
            raise InvalidOperationError(
                "column_name is required for mean imputation."
            )

        return fill_missing_mean(
            dataframe=dataframe,
            column_name=request.column_name,
        )

    if request.operation == "fill_missing_median":

        if request.column_name is None:
            raise InvalidOperationError(
                "column_name is required for median imputation."
            )

        return fill_missing_median(
            dataframe=dataframe,
            column_name=request.column_name,
        )

    if request.operation == "fill_missing_mode":

        if request.column_name is None:
            raise InvalidOperationError(
                "column_name is required for mode imputation."
            )

        return fill_missing_mode(
            dataframe=dataframe,
            column_name=request.column_name,
        )

    if request.operation == "fill_missing_placeholder":
        if request.column_name is None:
            raise InvalidOperationError(
                "column_name is required for placeholder imputation."
            )

        if request.value is None:
            raise InvalidOperationError(
                "value is required for placeholder imputation."
            )

        return fill_missing_placeholder(
            dataframe=dataframe,
            column_name=request.column_name,
            value=request.value,
        )

    raise InvalidOperationError(
        f"Unsupported cleaning operation: {request.operation}"
    )
        