import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import FastAPI
from beanie import init_beanie
import json
import os
from datetime import datetime
from uuid import UUID, uuid4
from pathlib import Path

from app.models.mongodb_models import (
    UserDocument, 
    CandidateDocument, 
    JobDocument, 
    ApplicationDocument, 
    CompanyDocument,
    SkillDocument,
    MessageDocument,
    ConversationDocument,
    EmailTemplateDocument
)
from app.core.config import settings
from app.db.mongodb import mongodb

logger = logging.getLogger(__name__)

async def init_mongodb(app: FastAPI):
    """Initialize MongoDB connection and add event handlers."""
    
    @app.on_event("startup")
    async def connect_to_mongodb():
        """Establish MongoDB connection on app startup."""
        try:
            await mongodb.connect_to_database()
            logger.info("MongoDB connection established.")
            
            # Initialize database with seed data if needed
            if settings.ENVIRONMENT == "development":
                await init_sample_data()
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            raise
    
    @app.on_event("shutdown")
    async def close_mongodb_connection():
        """Close MongoDB connection on app shutdown."""
        await mongodb.close_database_connection()
        logger.info("MongoDB connection closed.")


async def init_sample_data():
    """Initialize MongoDB with sample data for development."""
    try:
        logger.info("Checking if sample data initialization is needed...")
        
        # Check if data already exists
        skills_count = await SkillDocument.count()
        if skills_count > 0:
            logger.info("Sample data already initialized. Skipping.")
            return
        
        logger.info("Initializing sample data for development...")
        
        # Load skills
        await _load_skills()
        
        # Load other sample data
        await _load_companies()
        await _load_users()
        await _load_email_templates()
        
        logger.info("Sample data initialization complete.")
    except Exception as e:
        logger.error(f"Error initializing sample data: {e}")
        raise


async def _load_skills():
    """Load skills from JSON file."""
    try:
        # Get the path to the fake_data directory
        base_dir = Path(__file__).resolve().parent.parent.parent
        skills_path = base_dir / "fake_data" / "skills.json"
        
        # Check if file exists
        if not skills_path.exists():
            logger.warning(f"Skills data file not found at {skills_path}")
            return
        
        # Load skills data
        with open(skills_path, "r") as f:
            skills_data = json.load(f)
        
        # Create skills documents
        skills = []
        for skill in skills_data:
            skill_doc = SkillDocument(
                id=UUID(skill.get("id", str(uuid4()))),
                name=skill.get("name"),
                category=skill.get("category"),
                description=skill.get("description"),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            skills.append(skill_doc)
        
        # Insert skills into database
        if skills:
            await SkillDocument.insert_many(skills)
            logger.info(f"Loaded {len(skills)} skills into MongoDB")
    except Exception as e:
        logger.error(f"Error loading skills: {e}")
        raise


async def _load_companies():
    """Load companies from JSON file."""
    try:
        # Get the path to the fake_data directory
        base_dir = Path(__file__).resolve().parent.parent.parent
        companies_path = base_dir / "fake_data" / "company_profiles.json"
        
        # Check if file exists
        if not companies_path.exists():
            logger.warning(f"Companies data file not found at {companies_path}")
            return
        
        # Load companies data
        with open(companies_path, "r") as f:
            companies_data = json.load(f)
        
        # Create companies documents
        companies = []
        for company in companies_data:
            company_doc = CompanyDocument(
                id=UUID(company.get("id", str(uuid4()))),
                name=company.get("name"),
                industry=company.get("industry"),
                size=company.get("size"),
                location=company.get("location"),
                website=company.get("website"),
                description=company.get("description"),
                created_by=UUID(company.get("created_by")) if company.get("created_by") else None,
                logo_url=company.get("logo_url"),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            companies.append(company_doc)
        
        # Insert companies into database
        if companies:
            await CompanyDocument.insert_many(companies)
            logger.info(f"Loaded {len(companies)} companies into MongoDB")
    except Exception as e:
        logger.error(f"Error loading companies: {e}")
        raise


async def _load_users():
    """Load users from JSON file."""
    try:
        # Get the path to the fake_data directory
        base_dir = Path(__file__).resolve().parent.parent.parent
        users_path = base_dir / "fake_data" / "users.json"
        
        # Check if file exists
        if not users_path.exists():
            logger.warning(f"Users data file not found at {users_path}")
            return
        
        # Load users data
        with open(users_path, "r") as f:
            users_data = json.load(f)
        
        # Create users documents
        users = []
        for user in users_data:
            user_doc = UserDocument(
                id=UUID(user.get("id", str(uuid4()))),
                email=user.get("email"),
                password_hash=user.get("password_hash"),
                first_name=user.get("first_name"),
                last_name=user.get("last_name"),
                role=user.get("role"),
                is_verified=user.get("is_verified", False),
                phone=user.get("phone"),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            users.append(user_doc)
        
        # Insert users into database
        if users:
            await UserDocument.insert_many(users)
            logger.info(f"Loaded {len(users)} users into MongoDB")
    except Exception as e:
        logger.error(f"Error loading users: {e}")
        raise


async def _load_email_templates():
    """Load email templates from JSON file."""
    try:
        # Get the path to the fake_data directory
        base_dir = Path(__file__).resolve().parent.parent.parent
        templates_path = base_dir / "fake_data" / "email_templates.json"
        
        # Check if file exists
        if not templates_path.exists():
            logger.warning(f"Email templates data file not found at {templates_path}")
            return
        
        # Load templates data
        with open(templates_path, "r") as f:
            templates_data = json.load(f)
        
        # Create templates documents
        templates = []
        for template in templates_data:
            template_doc = EmailTemplateDocument(
                id=UUID(template.get("id", str(uuid4()))),
                name=template.get("name"),
                subject=template.get("subject"),
                body=template.get("body"),
                description=template.get("description"),
                category=template.get("category"),
                template_type=template.get("template_type"),
                conversation_metadata=template.get("conversation_metadata"),
                created_by=UUID(template.get("created_by")) if template.get("created_by") else None,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            templates.append(template_doc)
        
        # Insert templates into database
        if templates:
            await EmailTemplateDocument.insert_many(templates)
            logger.info(f"Loaded {len(templates)} email templates into MongoDB")
    except Exception as e:
        logger.error(f"Error loading email templates: {e}")
        raise