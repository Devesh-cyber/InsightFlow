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
    # 1. Check local memory cache first (fastest)
    if dataset_id in SESSION_CACHE:
        return SESSION_CACHE[dataset_id]
    
    # 2. v2 Fallback: If not in cache (e.g. server restart), hydrate from Supabase Storage & DB
    try:
        # Query Postgres 'datasets' table for storage path and filename
        db_response = supabase.table("datasets").select("*").eq("id", dataset_id).execute()
        
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

def delete_session(dataset_id: str) -> None:
    SESSION_CACHE.pop(dataset_id, None)

def session_exists(dataset_id : str) -> bool:
    if dataset_id in SESSION_CACHE:
        return True
    # Check database presence if not in local cache
    try:
        db_response = supabase.table("datasets").select("id").eq("id", dataset_id).execute()
        return bool(db_response.data and len(db_response.data) > 0)
    except:
        return False