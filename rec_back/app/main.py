from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1 import ai_tools_db, candidates, companies, jobs, skills, users, messaging, auth, analytics, applications, search

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

@app.get("/")
async def root():
    return {"message": "Welcome to RecrutementPlus CRM API"}

@app.get("/api/health")
async def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": "development"
    }