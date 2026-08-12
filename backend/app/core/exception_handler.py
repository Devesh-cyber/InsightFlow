from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import InsightFlowException


async def insightflow_exception_handler(
    request: Request,
    exc: InsightFlowException,
) -> JSONResponse:
    """
    Converts InsightFlow application exceptions
    into consistent HTTP responses.
    """

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.message,
            "path": request.url.path,
        },
    )