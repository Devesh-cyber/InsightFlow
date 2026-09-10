from app.models.column import ColumnSummary
from app.models.relationship import RelationshipResult

from app.processors.column_analyzer import (
    generate_column_summaries
)

from app.processors.relationship_analyzer import (
    analyze_relationship
)

from app.processors.session_manager import get_session
from app.core.deps import get_user_id


def get_relationship_columns(
    dataset_id: str,
    user,
) -> list[ColumnSummary]:
    """
    Returns columns available for relationship analysis.
    """

    session = get_session(dataset_id, get_user_id(user))

    return generate_column_summaries(
        dataframe=session.dataframe
    )


def get_relationship(
    dataset_id: str,
    column_a: str,
    column_b: str,
    user,
) -> RelationshipResult:
    """
    Returns the relationship analysis between two columns.
    """

    session = get_session(dataset_id, get_user_id(user))

    return analyze_relationship(
        dataframe=session.dataframe,
        column_a=column_a,
        column_b=column_b
    )
