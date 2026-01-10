from fastapi import FastAPI
from app.api.v1.router import api_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Fintech Tracker API",
    version="1.0.0"
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "API running"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)