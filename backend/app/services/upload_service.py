import os
import re
from uuid import uuid4

from fastapi import UploadFile, HTTPException, status
from app.models.upload import UploadResponse
from app.services.processing_service import process_data
from app.services.supabase_client import supabase
from app.core.deps import get_user_id
from app.core.exceptions import InsightFlowException


def _sanitize_filename(filename: str) -> str:
    """
    Strips directory separators and parent-directory references so a
    client-supplied filename can never escape the caller's own
    '{user_id}/' prefix in Supabase Storage.
    """
    name = os.path.basename(filename or "")
    name = name.replace("..", "")
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    return name or "dataset"


async def upload_dataset(file: UploadFile, user) -> UploadResponse:
    ''' Uploads and processes a dataset with user isolation and Supabase storage '''
    user_id = get_user_id(user)

    # Single canonical id for this dataset, used consistently across the
    # Postgres row, Supabase Storage path metadata, and the runtime session.
    dataset_id = str(uuid4())

    safe_filename = _sanitize_filename(file.filename)

    try:
        # 1. Read file contents into memory safely
        contents = await file.read()

        # 2. Stream raw file bytes to Supabase Storage Bucket ('datasets')
        storage_path = f"{user_id}/{safe_filename}"

        supabase.storage.from_("datasets").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )

        # 3. Save metadata record to PostgreSQL 'datasets' table, using the
        #    SAME id as the runtime session so the two are never disconnected.
        supabase.table("datasets").insert({
            "id": dataset_id,
            "user_id": user_id,
            "file_name": safe_filename,
            "storage_path": storage_path
        }).execute()

        # 4. Reset file pointer cursor so your existing processor can read it cleanly
        file.file.seek(0)

        # 5. Call your existing v1 processing logic, reusing the same dataset_id
        session = process_data(file, user_id=user_id, dataset_id=dataset_id)

        return UploadResponse(
            status='success',
            message='Dataset uploaded and processed successfully',
            dataset_id=session.dataset_id,
            filename=session.filename,
            rows=session.metadata.rows,
            columns=session.metadata.columns
        )

    except (HTTPException, InsightFlowException):
        # Let intended, already-typed errors (e.g. InvalidDatasetError from
        # validate_dataset) propagate with their correct status code instead
        # of being collapsed into a generic 500 below.
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload processing failed: {str(e)}"
        )
