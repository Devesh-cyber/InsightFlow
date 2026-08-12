from typing import Any
import pandas as pd
from app.models.dataset import DatasetMetadata
from app.models.overview import OverviewResponse

def calculate_completeness(dataframe: pd.DataFrame) -> float:
    ''' Calculate dataset completeness percentage'''

    total_cells = dataframe.shape[0] * dataframe.shape[1]
    if total_cells == 0:
        return 0.0

    missing_cells = dataframe.isna().sum().sum()

    completeness = ((total_cells - missing_cells) / total_cells) * 100

    return round(completeness, 2)


def generate_preview(dataframe: pd.DataFrame, rows: int = 10) -> list[dict[str, Any]]:
    ''' Returns the first few rows of the dataset '''

    return dataframe.head(rows).to_dict(orient='records')


def build_overview(dataframe: pd.DataFrame, metadata: DatasetMetadata) -> OverviewResponse:
    ''' Build the complete overview response '''

    return OverviewResponse(
        metadata=metadata,
        completeness_percentage=calculate_completeness(dataframe),
        preview=generate_preview(dataframe)
    )