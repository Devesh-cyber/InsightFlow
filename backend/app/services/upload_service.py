import io
from fastapi import UploadFile, HTTPException, status
from app.models.upload import UploadResponse
from app.services.processing_service import process_data
from app.services.supabase_client import supabase

async def upload_dataset(file: UploadFile, user) -> UploadResponse:
    ''' Uploads and processes a dataset with user isolation and Supabase storage '''
    try:
        # 1. Read file contents into memory safely
        contents = await file.read()
        
        # 2. Stream raw file bytes to Supabase Storage Bucket ('datasets')
        storage_path = f"{user.id}/{file.filename}"
        
        supabase.storage.from_("datasets").upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": file.content_type, "upsert": "true"}
        )
        
        # 3. Save metadata record to PostgreSQL 'datasets' table
        supabase.table("datasets").insert({
            "user_id": user.id,
            "file_name": file.filename,
            "storage_path": storage_path
        }).execute()

        # 4. Reset file pointer cursor so your existing processor can read it cleanly
        file.file.seek(0)

        # 5. Call your existing v1 processing logic
        session = process_data(file)

        return UploadResponse(
            status='success',
            message='Dataset uploaded and processed successfully',
            dataset_id=session.dataset_id,
            filename=session.filename,
            rows=session.metadata.rows,
            columns=session.metadata.columns
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload processing failed: {str(e)}"
        )