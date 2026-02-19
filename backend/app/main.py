"""
InternAudit AI - FastAPI Application Entry Point
"""

import uuid
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.services.websocket_manager import get_websocket_manager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, "INFO"),
    format="%(asctime)s | %(levelname)8s | %(name)20s | %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Initialize database tables
    await init_db()
    yield
    # Shutdown: cleanup if needed


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Automated Technical Triage System for Internship Applications",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
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
        "websocket": "/ws",
    }


# ===========================================
# WebSocket Endpoint
# ===========================================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time progress updates.

    Protocol:
    - Client sends: {"action": "subscribe", "submission_id": "xxx"}
    - Client sends: {"action": "unsubscribe", "submission_id": "xxx"}
    - Server sends: {"type": "progress", "submission_id": "xxx", "stage": "...", "progress": 50, "message": "..."}

    Example usage:
    ```javascript
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => {
        ws.send(JSON.stringify({action: 'subscribe', submission_id: '123'}));
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Progress:', data.progress, data.message);
    };
    ```
    """
    connection_id = str(uuid.uuid4())
    ws_manager = get_websocket_manager()

    await ws_manager.connect(websocket, connection_id)
    logger.info(f"WebSocket client connected: {connection_id}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            action = data.get("action")

            if action == "subscribe":
                submission_id = data.get("submission_id")
                if submission_id:
                    await ws_manager.subscribe(connection_id, submission_id)
                    await ws_manager.send_to_connection(
                        connection_id,
                        "subscribed",
                        {"submission_id": submission_id}
                    )

            elif action == "unsubscribe":
                submission_id = data.get("submission_id")
                if submission_id:
                    await ws_manager.unsubscribe(connection_id, submission_id)
                    await ws_manager.send_to_connection(
                        connection_id,
                        "unsubscribed",
                        {"submission_id": submission_id}
                    )

            elif action == "ping":
                await ws_manager.send_to_connection(
                    connection_id,
                    "pong",
                    {}
                )

            elif action == "stats":
                await ws_manager.send_to_connection(
                    connection_id,
                    "stats",
                    ws_manager.get_stats()
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
    finally:
        await ws_manager.disconnect(connection_id)


@app.get("/ws/stats", tags=["WebSocket"])
async def websocket_stats():
    """Get WebSocket connection statistics"""
    ws_manager = get_websocket_manager()
    return ws_manager.get_stats()


# ===========================================
# Routers
# ===========================================
from app.routes.submissions import router as submissions_router
app.include_router(submissions_router, prefix="/api/submissions", tags=["Submissions"])
