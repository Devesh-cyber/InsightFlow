from io import BytesIO, StringIO

from fastapi.responses import StreamingResponse

from app.core.exceptions import InvalidOperationError
from app.models.export import ExportRequest
from app.processors.session_manager import get_session


def export_dataset(
    dataset_id: str,
    request: ExportRequest,
) -> StreamingResponse:
    """
    Exports the current dataset session in the requested format.
    """

    session = get_session(dataset_id)

    dataframe = session.dataframe

    if request.format == "csv":

        buffer = StringIO()

        dataframe.to_csv(
            buffer,
            index=False,
        )

        buffer.seek(0)

        filename = f"{session.filename.rsplit('.', 1)[0]}.csv"

        return StreamingResponse(
            iter([buffer.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    if request.format == "xlsx":

        buffer = BytesIO()

        dataframe.to_excel(
            buffer,
            index=False,
            engine="openpyxl",
        )

        buffer.seek(0)

        filename = f"{session.filename.rsplit('.', 1)[0]}.xlsx"

        return StreamingResponse(
            buffer,
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    raise InvalidOperationError(
        f"Unsupported export format: '{request.format}'."
    )