from fastapi import FastAPI
from app.api.upload import router as upload_router
from app.api.overview import router as overview_router
from app.api.health import router as health_router


app = FastAPI(
    title='InsightFlow API',
    version='1.0.0',
    description='Backend API for InsightFlow'
)

app.include_router(upload_router)
app.include_router(overview_router)
app.include_router(health_router)

@app.get('/')
def root():
    return {
        'message' : 'InsightFLow Backend is Running 🚀'
    }