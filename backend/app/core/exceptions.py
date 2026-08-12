class InsightFlowException(Exception):
    """
    Base exception for all InsightFlow application errors.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 400,
    ):
        self.message = message
        self.status_code = status_code

        super().__init__(message)


class DatasetNotFoundError(InsightFlowException):
    """
    Raised when a requested dataset session does not exist.
    """

    def __init__(self, dataset_id: str):
        super().__init__(
            message=f"Dataset session '{dataset_id}' was not found.",
            status_code=404,
        )


class InvalidDatasetError(InsightFlowException):
    """
    Raised when an uploaded dataset is invalid or cannot be processed.
    """

    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=400,
        )


class ColumnNotFoundError(InsightFlowException):
    """
    Raised when a requested column does not exist.
    """

    def __init__(self, column_name: str):
        super().__init__(
            message=f"Column '{column_name}' does not exist in the dataset.",
            status_code=400,
        )


class InvalidOperationError(InsightFlowException):
    """
    Raised when a requested analytical or cleaning operation
    cannot be performed.
    """

    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=400,
        )