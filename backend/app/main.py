"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.v1.endpoints import auth, farms, animals, crops
from app.routers import weather, predictions

settings = get_settings()

app = FastAPI(
    title="MooMetrics API",
    description="Backend API for MooMetrics Smart Farming Dashboard",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # React default
    settings.frontend_url,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc) if settings.is_development else "An unexpected error occurred."},
    )


# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(farms.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(animals.router, prefix="/api/v1/animals", tags=["animals"])
app.include_router(crops.router, prefix="/api/v1/crops", tags=["crops"])

# Legacy/Utility routers
app.include_router(weather.router)
app.include_router(predictions.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to MooMetrics API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
