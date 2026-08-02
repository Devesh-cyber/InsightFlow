import pandas as pd
import numpy as np
from app.utils.constants import MISSING_VALUES


def normalize_missing_values(dataframe: pd.DataFrame) -> pd.DataFrame:
    ''' Standardize missing values representation '''

    dataframe = dataframe.replace(MISSING_VALUES, np.nan)
    return dataframe

def normalize_column_names(dataframe: pd.DataFrame) -> pd.DataFrame:
    ''' Cleans and Standardize column names '''

    dataframe.columns = (dataframe.columns.str.strip().str.lower().replace(' ','_'))
    return dataframe

def normalize_dataset(dataframe: pd.DataFrame) -> pd.DataFrame:
    ''' Runs all normalization steps '''

    dataframe = normalize_missing_values(dataframe)
    dataframe = normalize_column_names(dataframe)

    return dataframe