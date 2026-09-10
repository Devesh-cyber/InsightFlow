from app.models.column import (
    ColumnAnalysis,
    ColumnSummary
)

from app.processors.column_analyzer import (
    analyze_column,
    generate_column_summaries
)

from app.processors.session_manager import get_session
from app.core.deps import get_user_id


def get_column_summaries(
        dataset_id: str,
        user,
) -> list[ColumnSummary]:
    '''
    Returns a summary of every column in dataset owned by `user`
    '''

    session = get_session(dataset_id, get_user_id(user))

    return generate_column_summaries(
        dataframe=session.dataframe
    )


def get_column_analysis(
        dataset_id: str,
        column_name: str,
        user,
) -> ColumnAnalysis:
    '''
    Returns detailed analysis for a selected column
    '''

    session = get_session(dataset_id, get_user_id(user))

    return analyze_column(
        dataframe=session.dataframe,
        column_name=column_name
    )
