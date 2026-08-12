from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.overview import router as overview_router
from app.api.health import router as health_router
from app.api.columns import router as column_router
from app.api.relationships import router as relationship_router
from app.api.visualization import router as visualization_router
from app.api.cleaning import router as cleaning_router
from app.core.exceptions import InsightFlowException
from app.api.export import router as export_router


from app.core.exception_handler import (
    insightflow_exception_handler,
)

app = FastAPI(
    title='InsightFlow API',
    version='1.0.0',
    description='Backend API for InsightFlow'
)

app.include_router(upload_router)
app.include_router(overview_router)
app.include_router(health_router)
app.include_router(column_router)
app.include_router(relationship_router)
app.include_router(visualization_router)
app.include_router(cleaning_router)
app.include_router(export_router)
app.add_exception_handler(
    InsightFlowException,
    insightflow_exception_handler,
)


@app.get('/')
def root():
    return {
        'message' : 'InsightFlow Backend is Running 🚀'
    }