import pandas as pd

from app.models.dataset import DatasetMetadata
from app.processors.type_detector import detect_column_type


def calculate_shape(
    dataframe: pd.DataFrame,
) -> tuple[int, int]:
    """
    Return the shape of the DataFrame.
    """

    return dataframe.shape


def calculate_memory_usage(
    dataframe: pd.DataFrame,
) -> float:
    """
    Return the DataFrame memory usage in MB.
    """

    memory = dataframe.memory_usage(
        deep=True
    ).sum()

    return round(
        memory / (1024 * 1024),
        2,
    )


def count_missing_cells(
    dataframe: pd.DataFrame,
) -> int:
    """
    Return the number of missing cells in the DataFrame.
    """

    return int(
        dataframe.isna().sum().sum()
    )


def count_duplicate_rows(
    dataframe: pd.DataFrame,
) -> int:
    """
    Return the number of duplicate rows.
    """

    return int(
        dataframe.duplicated().sum()
    )


def detect_column_types(
    dataframe: pd.DataFrame,
) -> dict[str, int]:
    """
    Return the distribution of detected analytical column types.
    """

    column_types = {
        "numeric": 0,
        "categorical": 0,
        "datetime": 0,
        "boolean": 0,
        "unknown": 0,
    }

    for column in dataframe.columns:
        detected_type = detect_column_type(
            dataframe[column]
        )

        column_types[detected_type] += 1

    return column_types


def generate_metadata(
    dataframe: pd.DataFrame,
    filename: str,
) -> DatasetMetadata:
    """
    Generate metadata for the dataset.
    """

    rows, columns = calculate_shape(dataframe)

    return DatasetMetadata(
        dataset_name=filename,
        rows=rows,
        columns=columns,
        memory_usage=calculate_memory_usage(dataframe),
        missing_cells=count_missing_cells(dataframe),
        duplicate_rows=count_duplicate_rows(dataframe),
        column_types=detect_column_types(dataframe),
    )