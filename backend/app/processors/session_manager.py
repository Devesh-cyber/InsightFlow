from uuid import uuid4
import io
import pandas as pd
from fastapi import HTTPException, status
from app.core.exceptions import DatasetNotFoundError

from app.models.dataset import (
    DatasetMetadata,
    DatasetSession
)
from app.services.supabase_client import supabase
from app.processors.metadata import generate_metadata

SESSION_CACHE : dict[str, DatasetSession] = {}

def create_session(
    filename: str,
    dataframe: pd.DataFrame,
    metadata: DatasetMetadata,
    user_id: str,
    dataset_id: str | None = None,
) -> DatasetSession:
    """
    Creates a new in-memory session.

    `dataset_id` should normally be supplied by the caller (upload_service)
    so that it matches the id already written to the Postgres 'datasets'
    row for this upload — keeping exactly one canonical id for the dataset
    across DB, storage and the runtime session. A new id is only generated
    here as a fallback for callers that don't have a DB row yet.
    """
    dataset_id = dataset_id or str(uuid4())

    session = DatasetSession(
        dataset_id=dataset_id,
        user_id=user_id,
        filename=filename,
        dataframe=dataframe,
        metadata=metadata
    )

    SESSION_CACHE[dataset_id] = session

    return session

def get_session(dataset_id: str, user_id: str) -> DatasetSession:
    """
    Returns the session for `dataset_id`, but only if it belongs to
    `user_id`. Returns/raises a 404 (not a 403) on ownership mismatch
    so we don't reveal whether a dataset id owned by someone else exists.
    """
    # 1. Check local memory cache first (fastest)
    cached = SESSION_CACHE.get(dataset_id)
    if cached is not None:
        if cached.user_id != user_id:
            raise DatasetNotFoundError(dataset_id=dataset_id)
        return cached

    # 2. v2 Fallback: If not in cache (e.g. server restart), hydrate from Supabase Storage & DB.
    # Scoped to (id AND user_id) so a session can only ever be restored for its owner.
    try:
        db_response = (
            supabase.table("datasets")
            .select("*")
            .eq("id", dataset_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not db_response.data or len(db_response.data) == 0:
            raise DatasetNotFoundError(dataset_id=dataset_id)

        record = db_response.data[0]
        storage_path = record["storage_path"]
        filename = record["file_name"]

        # Download file bytes from Supabase Storage bucket ('datasets')
        storage_response = supabase.storage.from_("datasets").download(storage_path)

        if not storage_response:
            raise HTTPException(status_code=404, detail="Dataset file missing from cloud storage.")

        # Re-parse into Pandas DataFrame based on file extension
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(storage_response))
        else:
            df = pd.read_excel(io.BytesIO(storage_response))

        # Generate metadata using your existing processor
        metadata = generate_metadata(dataframe=df, filename=filename)

        # Recreate the session in memory cache so future calls are instant
        restored_session = DatasetSession(
            dataset_id=dataset_id,
            user_id=user_id,
            filename=filename,
            dataframe=df,
            metadata=metadata
        )

        SESSION_CACHE[dataset_id] = restored_session
        return restored_session

    except Exception as e:
        if isinstance(e, DatasetNotFoundError):
            raise e
        raise DatasetNotFoundError(dataset_id=dataset_id)

def delete_session(dataset_id: str, user_id: str) -> None:
    session = SESSION_CACHE.get(dataset_id)
    if session is not None and session.user_id == user_id:
        SESSION_CACHE.pop(dataset_id, None)

def session_exists(dataset_id: str, user_id: str) -> bool:
    cached = SESSION_CACHE.get(dataset_id)
    if cached is not None:
        return cached.user_id == user_id
    # Check database presence if not in local cache
    try:
        db_response = (
            supabase.table("datasets")
            .select("id")
            .eq("id", dataset_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(db_response.data and len(db_response.data) > 0)
    except Exception:
        return False
