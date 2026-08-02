from fastapi import FastAPI
from app.api.upload import router as upload_router

app = FastAPI(
    title='InsightFlow API',
    version='1.0.0',
    description='Backend API for InsightFlow'
)

app.include_router(upload_router)

@app.get('/')
def root():
    return {
        'message' : 'InsightFLow Backend is Running 🚀'
    }