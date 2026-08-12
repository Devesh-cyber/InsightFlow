from fastapi import APIRouter

from app.models.export import ExportRequest
from app.services.export_service import export_dataset


router = APIRouter(
    prefix="/export",
    tags=["Dataset Export"],
)


@router.post(
    "/{dataset_id}",
    summary="Export Dataset",
)
async def export(
    dataset_id: str,
    request: ExportRequest,
):
    """
    Export the current dataset in CSV or XLSX format.
    """

    return export_dataset(
        dataset_id=dataset_id,
        request=request,
    )