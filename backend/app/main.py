from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.overview import router as overview_router
from app.api.health import router as health_router
from app.api.columns import router as column_router
from app.api.relationships import router as relationship_router
from app.api.visualization import router as visualization_router

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


@app.get('/')
def root():
    return {
        'message' : 'InsightFLow Backend is Running 🚀'
    }