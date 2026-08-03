from pathlib import Path
import pandas as pd
from fastapi import UploadFile, HTTPException, status

def load_csv(file: UploadFile) -> pd.DataFrame:
    ''' Loads CSV file into a Pandas Dataframe '''

    try:
        dataframe = pd.read_csv(file.file)
        file.file.seek(0)
        return dataframe
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unable to read CSV file. {str(e)}'
        )

def load_excel(file: UploadFile) -> pd.DataFrame:
    ''' Loads an Excel file in Pandas DataFrame '''

    try:
        dataframe = pd.read_excel(file.file)
        file.file.seek(0)
        return dataframe
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Unable to read Excel file. {str(e)}'
        )

def load_dataset(file: UploadFile) -> pd.DataFrame:
    ''' Loads the uploaded dataset based on its extension '''

    extension = Path(file.filename).suffix.lower()

    if extension == '.csv':
        return load_csv(file)

    if extension == '.xlsx':
        return load_excel(file)

    
    raise HTTPException(
        status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
        detail="Unsupported file format."
    )