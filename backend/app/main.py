"""
Main FastAPI application entry point.
"""

import time
import uuid
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.v1.endpoints import auth, farms, animals, crops
from app.routers import weather, predictions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("api")

settings = get_settings()

app = FastAPI(
    title="MooMetrics API",
    description="Backend API for MooMetrics Smart Farming Dashboard",
    version="1.0.0",
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["X-Request-ID"] = request_id
    
    logger.info(
        f"RID={request_id} METHOD={request.method} PATH={request.url.path} "
        f"STATUS={response.status_code} TIME={process_time:.4f}s"
    )
    
    return response

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


from app.api.v1.endpoints import auth, farms, animals, crops, tasks

# ... [other imports] ...

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(farms.router, prefix="/api/v1/farms", tags=["farms"])
app.include_router(animals.router, prefix="/api/v1/animals", tags=["animals"])
app.include_router(crops.router, prefix="/api/v1/crops", tags=["crops"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])

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
