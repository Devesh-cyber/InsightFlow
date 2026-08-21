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

from fastapi.middleware.cors import CORSMiddleware


from app.core.exception_handler import (
    insightflow_exception_handler,
)

app = FastAPI(
    title='InsightFlow API',
    version='1.0.0',
    description='Backend API for InsightFlow'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://insight-flow-lemon-phi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/health")
@app.head('/health')
def health_check():
    return {"status": "healthy"}