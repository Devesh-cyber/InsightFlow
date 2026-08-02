from pydantic import BaseModel, Field, ConfigDict
import pandas as pd
from typing import Dict
from datetime import datetime

class ColumnMetadata(BaseModel):
    ''' Stores the meta information about Columns '''

    column_name : str = Field(..., min_length=1, description='Name of the dataset column')
    dtype : str = Field(..., min_length=1, description='Detected data type of the column')
    missing_count : int = Field(..., ge=0, description='Total missing values in the column')
    missing_percentage : float = Field(..., ge=0, le=100, description='Percentage of missing values')
    unique_count : int = Field(..., ge=0, description='Number of unique values')

class DatasetMetadata(BaseModel):
    ''' Stores the meta information about the dataset'''

    dataset_name : str = Field(..., min_length=1, description='Original dataset filename')
    rows : int = Field(..., ge=0, description='Total number of rows')
    columns : int = Field(..., ge=0, description='Total number of columns')
    memory_usage : float = Field(..., ge=0, description='Dataset memory usage in MB')
    missing_cells : int = Field(..., ge=0, description='Total missing cells in dataset')
    duplicate_rows : int = Field(..., ge=0, description='Total duplicate rows')
    column_types : Dict[str, int] = Field(default_factory=dict, description='Distribution of detected column types')
    created_at : datetime = Field(default_factory=datetime.now, description='Time when metadata was generated')

class DatasetSession(BaseModel):
    ''' Stores the information about current session'''

    model_config = ConfigDict(
        arbitrary_types_allowed=True
    )
    dataset_id : str = Field(..., min_length=1, description='Unique session identifier')
    filename : str = Field(..., min_length=1, description='Original uploaded file name')
    dataframe : pd.DataFrame = Field(..., description="Active Pandas DataFrame.")
    metadata : DatasetMetadata = Field(..., description='Metadata associated with the dataset')
    is_modified : bool = Field(default=False, description='Indicates whether the dataset has been modified')
    created_at : datetime = Field(default_factory=datetime.now, description='Time when the session was created')