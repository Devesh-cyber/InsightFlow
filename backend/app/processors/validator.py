from pathlib import Path
from fastapi import UploadFile, HTTPException, status

ALLOWED_EXTENSIONS = {'.csv','.xlsx'}
MAX_FILE_SIZE = 100 * 1024 * 1024

def validate_filename(file: UploadFile) -> bool:
    ''' Validate that the uploaded file has a valid filename'''

    if not file.filename or file.filename.split() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Filename cannot be empty'
        )
    
    return True

def validate_extension(file: UploadFile) -> bool:
    ''' Validate the uploaded file extension'''

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail='Unsupported file type. Only CSV and XLSX files are allowed'
        )
    
    return True

def validate_file_size(file: UploadFile) -> bool:
    ''' Validates uploaded file size'''

    file.file.seek(0,2)
    size = file.file.tell()
    file.file.seek(0)

    if size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the maximum limit of 100 MB."
        )

    return True

def validate_dataset(file: UploadFile) -> bool:
    ''' Runs all dataset validation checks '''
    
    validate_filename(file)
    validate_extension(file)
    validate_file_size(file)

    return True