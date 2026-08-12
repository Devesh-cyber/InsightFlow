from uuid import uuid4
from fastapi import HTTPException, status
import pandas as pd
from app.core.exceptions import DatasetNotFoundError

from app.models.dataset import (
    DatasetMetadata,
    DatasetSession
)

SESSION_CACHE : dict[str, DatasetSession] = {}

def create_session(filename: str, dataframe: pd.DataFrame, metadata: DatasetMetadata) -> DatasetSession:
    dataset_id = str(uuid4())

    session = DatasetSession(
        dataset_id= dataset_id,
        filename=filename,
        dataframe=dataframe,
        metadata=metadata
    )

    SESSION_CACHE[dataset_id] = session

    return session

def get_session(dataset_id: str) -> DatasetSession:
    if dataset_id not in SESSION_CACHE:
        raise DatasetNotFoundError(dataset_id=dataset_id)
    return SESSION_CACHE[dataset_id]

def  delete_session(dataset_id: str) -> None:
    SESSION_CACHE.pop(dataset_id, None)

def session_exists(dataset_id : str) -> bool:
    return dataset_id in SESSION_CACHE