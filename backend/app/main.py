"""
InternAudit AI - FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Automated Technical Triage System for Internship Applications",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================
# Health Check
# ===========================================
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to InternAudit AI",
        "docs": "/docs",
        "health": "/health",
    }


# ===========================================
# Routers (to be added)
# ===========================================
# from app.routes import auth, candidates, submissions, tasks
# app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
# app.include_router(candidates.router, prefix="/api/candidates", tags=["Candidates"])
# app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])
# app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
