from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from app.api.analysis import router as analysis_router

from app.api.documents import router as doc_router
from app.api.auth import authRoutes
import uvicorn
import time
import logging
from app.api.documents import doc_router  
from app.config import settings
from app.database.connection import init_db
from app.api.translator import router as translator_router
from app.api.languages import router as lang_router
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered legal document analysis platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.include_router(authRoutes, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(analysis_router, prefix=f"{settings.API_V1_STR}/analysis", tags=["analysis"])
app.include_router(doc_router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(lang_router, prefix=f"{settings.API_V1_STR}/translate", tags=["languages"])
app.include_router(translator_router, prefix=f"{settings.API_V1_STR}/translate", tags=["translate"])

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.render.com", "localhost", "127.0.0.1"]
    )

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": "server_error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time()
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting Legal AI Platform...")
    try:
        # await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise e

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Legal AI Platform API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production"
    }

@app.head("/")
async def head_root():
    return {"message": "OK"}
