from fastapi import UploadFile
from app.models.dataset import DatasetSession
from app.processors.validator import validate_dataset
from app.processors.loader import load_dataset
from app.processors.normalizer import normalize_dataset
from app.processors.metadata import generate_metadata
from app.processors.session_manager import create_session

def process_data(file: UploadFile, user_id: str, dataset_id: str) -> DatasetSession:
    ''' Executes the complete dataset processing pipeline '''

    validate_dataset(file)

    dataframe = load_dataset(file)

    dataframe = normalize_dataset(dataframe)

    metadata = generate_metadata(dataframe, file.filename)

    session = create_session(
        file.filename,
        dataframe,
        metadata,
        user_id=user_id,
        dataset_id=dataset_id,
    )

    return session