from app.models.column import (
    ColumnAnalysis,
    ColumnSummary
)

from app.processors.column_analyzer import (
    analyze_column,
    generate_column_summaries
)

from app.processors.session_manager import get_session


def get_column_summaries(
        dataset_id: str
) -> list[ColumnSummary]:
    '''
    Returns a summary of every column in dataset
    '''

    session = get_session(dataset_id)

    return generate_column_summaries(
        dataframe=session.dataframe
    )


def get_column_analysis(
        dataset_id: str,
        column_name: str
) -> ColumnAnalysis:
    '''
    Returns detailed analysis for a selected column
    '''

    session = get_session(dataset_id)

    return analyze_column(
        dataframe=session.dataframe,
        column_name=column_name
    )