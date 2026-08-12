from app.models.cleaning import (
    CleaningOperation,
    CleaningRequest,
    CleaningResponse,
)

from app.processors.cleaning_analyzer import (
    apply_cleaning_operation,
)

from app.processors.session_manager import get_session


def apply_cleaning(
    dataset_id: str,
    request: CleaningRequest,
) -> CleaningResponse:
    """
    Applies a cleaning operation to a dataset session.
    """

    session = get_session(dataset_id)

    cleaned_dataframe, operation = apply_cleaning_operation(
        dataframe=session.dataframe,
        request=request,
    )

    session.dataframe = cleaned_dataframe

    session.is_modified = True

    session.cleaning_history.append(operation)

    return CleaningResponse(
        status="success",
        message="Cleaning operation applied successfully.",
        rows=len(cleaned_dataframe),
        columns=len(cleaned_dataframe.columns),
        is_modified=session.is_modified,
        operation=operation,
    )