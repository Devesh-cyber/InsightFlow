from fastapi import APIRouter, File, UploadFile, Depends

from app.models.upload import UploadResponse
from app.services.upload_service import upload_dataset
from app.core.deps import get_current_user

router = APIRouter(
    prefix='/upload',
    tags=['Upload']
)

@router.post(
    '',
    response_model=UploadResponse,
    summary='Upload Dataset'
)
async def upload(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
) -> UploadResponse:
    '''Upload and process a dataset with user authentication context'''

    return await upload_dataset(file, user)