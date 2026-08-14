from app.models.cleaning import (
    CleaningOperation,
    CleaningRequest,
    CleaningResponse,
    CleaningRecommendationsResponse
)

from app.processors.cleaning_processor import (
    apply_cleaning_operation,
)

from app.processors.cleaning_analyzer import (
    generate_cleaning_recommendations,
)

from app.processors.session_manager import get_session
from app.processors.metadata import generate_metadata


def apply_cleaning(
    dataset_id: str,
    request: CleaningRequest,
) -> CleaningResponse:

    session = get_session(dataset_id)

    cleaned_dataframe, operation = (
        apply_cleaning_operation(
            dataframe=session.dataframe,
            request=request,
        )
    )

    session.dataframe = cleaned_dataframe

    session.is_modified = True

    session.cleaning_history.append(operation)

    session.metadata = generate_metadata(
        dataframe=cleaned_dataframe,
        filename=session.filename,
    )

    return CleaningResponse(
        status="success",
        message="Cleaning operation applied successfully.",
        rows=len(cleaned_dataframe),
        columns=len(cleaned_dataframe.columns),
        is_modified=session.is_modified,
        operation=operation,
    )

def get_cleaning_recommendations(
    dataset_id: str,
) -> CleaningRecommendationsResponse:

    session = get_session(dataset_id)

    recommendations = generate_cleaning_recommendations(
        dataframe=session.dataframe,
    )

    return CleaningRecommendationsResponse(
        issues=recommendations,
    )