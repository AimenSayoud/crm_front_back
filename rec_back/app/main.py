from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import logging
from app.api.v1 import (
    ai_tools_db, candidates, companies, jobs, skills, 
    users, messaging, auth, analytics, applications, search
)
from app.core.config import settings
from app.db.mongodb import mongodb

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

logger = logging.getLogger(__name__)

# Import MongoDB API router - we'll create it next
# Create the file first to avoid import errors
import os
if not os.path.exists("/Users/aymen/Downloads/RecrutementPlus_CRM_FullStack/rec_back/app/api/v1/mongodb_api.py"):
    with open("/Users/aymen/Downloads/RecrutementPlus_CRM_FullStack/rec_back/app/api/v1/mongodb_api.py", "w") as f:
        f.write("from fastapi import APIRouter\n\nrouter = APIRouter()")

from app.api.v1 import mongodb_api

app = FastAPI(
    title="RecrutementPlus API",
    description="CRM API for Recruitment",
    version="0.1.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.error(f"Global exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"},
    )

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(ai_tools_db.router, prefix="/api/v1/ai-tools", tags=["ai-tools"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["candidates"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(applications.router, prefix="/api/v1/applications", tags=["applications"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])
app.include_router(messaging.router, prefix="/api/v1", tags=["messaging"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(mongodb_api.router, prefix="/api/v1/mongodb", tags=["mongodb"])

@app.get("/")
async def root():
    return {"message": "Welcome to RecrutementPlus CRM API"}

@app.get("/api/health")
async def health_check():
    """API health check endpoint"""
    # Check MongoDB connection
    mongo_status = "ok"
    try:
        mongo_connected = await mongodb.check_connection()
        if not mongo_connected:
            mongo_status = "disconnected"
    except Exception as e:
        logger.error(f"MongoDB health check failed: {str(e)}")
        mongo_status = "error"
    
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
        "database": {
            "sql": "ok",  # We'll need to replace this with actual SQL health check
            "mongodb": mongo_status
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize MongoDB on startup"""
    from app.db.mongo_init_db import init_mongodb
    try:
        await init_mongodb(app)
        logger.info("MongoDB initialized successfully")
    except Exception as e:
        logger.error(f"MongoDB initialization failed: {str(e)}")

# Note: We don't need the shutdown event here as it's handled by init_mongodb()