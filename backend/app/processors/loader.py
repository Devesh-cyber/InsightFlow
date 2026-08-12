from pathlib import Path

import pandas as pd
from fastapi import UploadFile

from app.core.exceptions import InvalidDatasetError


def load_csv(file: UploadFile) -> pd.DataFrame:
    """
    Load a CSV file into a Pandas DataFrame.
    """

    try:
        dataframe = pd.read_csv(file.file)
        file.file.seek(0)

        return dataframe

    except Exception as exc:
        raise InvalidDatasetError(
            f"Unable to read CSV file: {exc}"
        ) from exc


def load_excel(file: UploadFile) -> pd.DataFrame:
    """
    Load an XLSX file into a Pandas DataFrame.
    """

    try:
        dataframe = pd.read_excel(file.file)
        file.file.seek(0)

        return dataframe

    except Exception as exc:
        raise InvalidDatasetError(
            f"Unable to read Excel file: {exc}"
        ) from exc


def load_dataset(file: UploadFile) -> pd.DataFrame:
    """
    Load the uploaded dataset based on its file extension.
    """

    extension = Path(file.filename).suffix.lower()

    if extension == ".csv":
        return load_csv(file)

    if extension == ".xlsx":
        return load_excel(file)

    raise InvalidDatasetError(
        f"Unsupported file format: '{extension}'."
    )