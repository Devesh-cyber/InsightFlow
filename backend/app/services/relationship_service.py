from app.models.column import ColumnSummary
from app.models.relationship import RelationshipResult

from app.processors.column_analyzer import (
    generate_column_summaries
)

from app.processors.relationship_analyzer import (
    analyze_relationship
)

from app.processors.session_manager import get_session


def get_relationship_columns(
    dataset_id: str
) -> list[ColumnSummary]:
    """
    Returns columns available for relationship analysis.
    """

    session = get_session(dataset_id)

    return generate_column_summaries(
        dataframe=session.dataframe
    )


def get_relationship(
    dataset_id: str,
    column_a: str,
    column_b: str
) -> RelationshipResult:
    """
    Returns the relationship analysis between two columns.
    """

    session = get_session(dataset_id)

    return analyze_relationship(
        dataframe=session.dataframe,
        column_a=column_a,
        column_b=column_b
    )