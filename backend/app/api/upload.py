from fastapi import APIRouter, File, UploadFile

from app.models.upload import UploadResponse
from app.services.upload_service import upload_dataset

router = APIRouter(
    prefix='/upload',
    tags=['Upload']
)

@router.post(
    '',
    response_model=UploadResponse,
    summary='Upload Dataset'
)
async def uplaod(file: UploadFile = File(...)) -> UploadResponse:
    ''' upload and process a dataset'''

    return upload_dataset(file)