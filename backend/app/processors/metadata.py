import pandas as pd
import numpy as np
from app.models.dataset import DatasetMetadata

def calculate_shape(dataframe : pd.DataFrame) -> tuple[int, int]:
    ''' Returns the shape of the dataframe '''

    return dataframe.shape

def calculate_memory_usage(dataframe : pd.DataFrame) -> float:
    ''' Returns the memory size of dataframe in MB '''

    memory = dataframe.memory_usage(deep=True).sum()

    return round(memory / (1024 * 1024), 2)

def count_missing_cells(dataframe: pd.DataFrame) -> int:
    ''' Returns the number of missing cells in dataframe '''

    return int(dataframe.isna().sum().sum())

def count_duplicate_rows(dataframe : pd.DataFrame) -> int:
    ''' Returns the number of duplicate rows '''

    return int(dataframe.duplicated().sum())

def detect_column_types(dataframe: pd.DataFrame) -> dict[str, int]:
    '''Return the distribution of column types '''

    column_types = {
        'numeric' : 0,
        'categorical' : 0,
        'datetime' : 0,
        'boolean' : 0
    }

    for dtype in dataframe.dtypes:
        if pd.api.types.is_numeric_dtype(dtype):
            column_types['numeric'] += 1
        elif pd.api.types.is_datetime64_any_dtype(dtype):
            column_types['datetime'] += 1
        elif pd.api.types.is_bool_dtype(dtype):
            column_types['boolean'] += 1
        else:
            column_types['categorical'] += 1

    return column_types

def generate_metadata(dataframe: pd.DataFrame, filename: str) -> DatasetMetadata:
    ''' Generate metadata for the uploaded dataset '''

    rows, columns = calculate_shape(dataframe)

    metadata = DatasetMetadata(
        dataset_name=filename,
        rows=rows,
        columns=columns,
        memory_usage=calculate_memory_usage(dataframe),
        missing_cells=count_missing_cells(dataframe),
        duplicate_rows=count_duplicate_rows(dataframe),
        column_types=detect_column_types(dataframe)
    )

    return metadata