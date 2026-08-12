import pandas as pd
import numpy as np

from app.utils.constants import MISSING_VALUES


def normalize_missing_values(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Standardize missing-value representations.
    """

    dataframe = dataframe.replace(
        MISSING_VALUES,
        np.nan,
    )

    return dataframe


def make_unique_column_names(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Ensure normalized column names are unique.

    Example:
        customer_name
        customer_name_1
        customer_name_2
    """

    used_names: set[str] = set()
    column_names: list[str] = []

    for column_name in dataframe.columns:
        base_name = str(column_name)

        if base_name not in used_names:
            unique_name = base_name

        else:
            counter = 1
            unique_name = f"{base_name}_{counter}"

            while unique_name in used_names:
                counter += 1
                unique_name = f"{base_name}_{counter}"

        used_names.add(unique_name)
        column_names.append(unique_name)

    dataframe.columns = column_names

    return dataframe


def normalize_column_names(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Clean, standardize, and uniquify column names.
    """

    dataframe.columns = (
        dataframe.columns
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(r"\s+", "_", regex=True)
    )

    dataframe = make_unique_column_names(dataframe)

    return dataframe


def normalize_dataset(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Run all normalization steps.
    """

    dataframe = normalize_missing_values(dataframe)
    dataframe = normalize_column_names(dataframe)

    return dataframe