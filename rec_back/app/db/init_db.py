import logging
from sqlalchemy.orm import Session
from typing import Optional
import json
from datetime import datetime

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import *  # Import all models
from app.db.session import engine
from app.models.user import User
from app.models.enums import UserRole
from app.models.admin import AdminProfile, SuperAdminProfile, SystemConfiguration
from app.models.skill import SkillCategory, Skill
from app.models.company import Company

logger = logging.getLogger(__name__)


def init_db(db: Session) -> None:
    """
    Initialize database with essential data
    """
    logger.info("Starting database initialization...")
    
    # Create super admin user if not exists
    create_superadmin(db)
    
    # Create default system configurations
    create_default_configurations(db)
    
    # Create default skill categories and skills
    create_default_skills(db)
    
    # Create test data if in development mode
    if settings.ENVIRONMENT == "development":
        create_test_data(db)
    
    logger.info("Database initialization completed!")


def create_superadmin(db: Session) -> Optional[User]:
    """Create the first superadmin user"""
    superadmin_email = settings.FIRST_SUPERUSER_EMAIL
    
    # Check if superadmin already exists
    user = db.query(User).filter(User.email == superadmin_email).first()
    if user:
        logger.info(f"Superadmin {superadmin_email} already exists")
        return user
    
    # Create superadmin user
    user = User(
        email=superadmin_email,
        password_hash=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
        first_name="Super",
        last_name="Admin",
        role=UserRole.SUPERADMIN,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    db.flush()  # Get the user ID
    
    # Create SuperAdminProfile
    superadmin_profile = SuperAdminProfile(
        user_id=user.id,
        access_level=10,
        master_key_access=True,
        system_config_access=True,
        user_management_access=True,
        financial_access=True,
        emergency_access_enabled=True,
        backup_access=True,
        recovery_key_access=True,
        api_key_management=True,
        rate_limit_override=True
    )
    db.add(superadmin_profile)
    
    db.commit()
    logger.info(f"Created superadmin user: {superadmin_email}")
    return user


def create_default_configurations(db: Session) -> None:
    """Create default system configurations"""
    default_configs = [
        {
            "config_key": "system.maintenance_mode",
            "config_value": False,
            "config_type": "boolean",
            "description": "Enable/disable system maintenance mode",
            "category": "system",
            "is_sensitive": False,
            "is_public": False
        },
        {
            "config_key": "email.smtp_host",
            "config_value": settings.SMTP_HOST,
            "config_type": "string",
            "description": "SMTP server host",
            "category": "email",
            "is_sensitive": True,
            "is_public": False
        },
        {
            "config_key": "email.smtp_port",
            "config_value": settings.SMTP_PORT,
            "config_type": "number",
            "description": "SMTP server port",
            "category": "email",
            "is_sensitive": False,
            "is_public": False
        },
        {
            "config_key": "recruitment.auto_match_enabled",
            "config_value": True,
            "config_type": "boolean",
            "description": "Enable automatic job-candidate matching",
            "category": "recruitment",
            "is_sensitive": False,
            "is_public": False
        },
        {
            "config_key": "recruitment.match_threshold",
            "config_value": 0.7,
            "config_type": "number",
            "description": "Minimum score for job-candidate matching",
            "category": "recruitment",
            "is_sensitive": False,
            "is_public": False,
            "validation_rules": {"min": 0, "max": 1}
        },
        {
            "config_key": "security.max_login_attempts",
            "config_value": 5,
            "config_type": "number",
            "description": "Maximum failed login attempts before lockout",
            "category": "security",
            "is_sensitive": False,
            "is_public": False,
            "validation_rules": {"min": 3, "max": 10}
        },
        {
            "config_key": "security.session_timeout_minutes",
            "config_value": 60,
            "config_type": "number",
            "description": "Session timeout in minutes",
            "category": "security",
            "is_sensitive": False,
            "is_public": False,
            "validation_rules": {"min": 5, "max": 480}
        },
        {
            "config_key": "notification.email_enabled",
            "config_value": True,
            "config_type": "boolean",
            "description": "Enable email notifications",
            "category": "notification",
            "is_sensitive": False,
            "is_public": False
        },
        {
            "config_key": "notification.sms_enabled",
            "config_value": False,
            "config_type": "boolean",
            "description": "Enable SMS notifications",
            "category": "notification",
            "is_sensitive": False,
            "is_public": False
        },
        {
            "config_key": "limits.max_applications_per_day",
            "config_value": 50,
            "config_type": "number",
            "description": "Maximum applications a candidate can submit per day",
            "category": "limits",
            "is_sensitive": False,
            "is_public": True,
            "validation_rules": {"min": 10, "max": 100}
        },
        {
            "config_key": "limits.max_jobs_per_company",
            "config_value": 100,
            "config_type": "number",
            "description": "Maximum active jobs per company",
            "category": "limits",
            "is_sensitive": False,
            "is_public": True,
            "validation_rules": {"min": 10, "max": 500}
        }
    ]
    
    for config_data in default_configs:
        # Check if config already exists
        existing = db.query(SystemConfiguration).filter(
            SystemConfiguration.config_key == config_data["config_key"]
        ).first()
        
        if not existing:
            config = SystemConfiguration(**config_data)
            db.add(config)
            logger.info(f"Created system configuration: {config_data['config_key']}")
    
    db.commit()


def create_default_skills(db: Session) -> None:
    """Create default skill categories and popular skills"""
    
    # Default skill categories
    categories_data = [
        {
            "name": "Programming Languages",
            "description": "Programming and scripting languages",
            "skills": ["Python", "JavaScript", "Java", "C++", "C#", "Go", "Ruby", "PHP", "Swift", "Kotlin", "TypeScript", "Rust"]
        },
        {
            "name": "Web Development",
            "description": "Web development frameworks and technologies",
            "skills": ["React", "Vue.js", "Angular", "Node.js", "Django", "Flask", "FastAPI", "Express.js", "Next.js", "HTML5", "CSS3", "Tailwind CSS"]
        },
        {
            "name": "Databases",
            "description": "Database management systems",
            "skills": ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Oracle", "SQL Server", "DynamoDB", "Cassandra"]
        },
        {
            "name": "Cloud & DevOps",
            "description": "Cloud platforms and DevOps tools",
            "skills": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Jenkins", "GitLab CI", "Terraform", "Ansible"]
        },
        {
            "name": "Data Science & AI",
            "description": "Data science and artificial intelligence",
            "skills": ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn", "NLP", "Computer Vision"]
        },
        {
            "name": "Mobile Development",
            "description": "Mobile application development",
            "skills": ["React Native", "Flutter", "iOS Development", "Android Development", "Xamarin"]
        },
        {
            "name": "Soft Skills",
            "description": "Professional and interpersonal skills",
            "skills": ["Leadership", "Communication", "Problem Solving", "Team Work", "Project Management", "Time Management", "Critical Thinking"]
        },
        {
            "name": "Business & Management",
            "description": "Business and management skills",
            "skills": ["Strategic Planning", "Business Analysis", "Financial Management", "Marketing", "Sales", "HR Management", "Operations Management"]
        }
    ]
    
    for cat_data in categories_data:
        # Check if category exists
        category = db.query(SkillCategory).filter(
            SkillCategory.name == cat_data["name"]
        ).first()
        
        if not category:
            category = SkillCategory(
                name=cat_data["name"],
                description=cat_data["description"]
            )
            db.add(category)
            db.flush()
            logger.info(f"Created skill category: {cat_data['name']}")
        
        # Add skills to category
        for skill_name in cat_data["skills"]:
            skill = db.query(Skill).filter(Skill.name == skill_name).first()
            if not skill:
                skill = Skill(
                    name=skill_name,
                    category_id=category.id
                    # Removed skill_type since it doesn't exist in your Skill model
                )
                db.add(skill)
                logger.info(f"Created skill: {skill_name}")
    
    db.commit()


def create_test_data(db: Session) -> None:
    """Create test data for development environment"""
    logger.info("Creating test data for development...")
    
    # Create test companies
    test_companies = [
        {
            "name": "TechCorp Solutions",
            "industry": "Information Technology",
            "description": "Leading technology solutions provider",
            "size": "LARGE",  # Use enum value
            "city": "San Francisco",
            "country": "USA",
            "website": "https://techcorp.example.com",
            "is_verified": True
        },
        {
            "name": "DataDrive Analytics",
            "industry": "Data Analytics",
            "description": "Big data and analytics company",
            "size": "MEDIUM",  # Use enum value
            "city": "New York",
            "country": "USA",
            "website": "https://datadrive.example.com",
            "is_verified": True
        },
        {
            "name": "CloudFirst Inc",
            "industry": "Cloud Computing",
            "description": "Cloud infrastructure and services",
            "size": "SMALL",  # Use enum value
            "city": "Seattle",
            "country": "USA",
            "website": "https://cloudfirst.example.com",
            "is_verified": False
        }
    ]
    
    for company_data in test_companies:
        company = db.query(Company).filter(Company.name == company_data["name"]).first()
        if not company:
            company = Company(**company_data)
            db.add(company)
            logger.info(f"Created test company: {company_data['name']}")
    
    # Create test users of different roles
    test_users = [
        {
            "email": "candidate@example.com",
            "password": "testpass123",
            "first_name": "John",
            "last_name": "Candidate",
            "role": UserRole.CANDIDATE
        },
        {
            "email": "employer@example.com",
            "password": "testpass123",
            "first_name": "Jane",
            "last_name": "Employer",
            "role": UserRole.EMPLOYER
        },
        {
            "email": "consultant@example.com",
            "password": "testpass123",
            "first_name": "Mike",
            "last_name": "Consultant",
            "role": UserRole.CONSULTANT
        },
        {
            "email": "admin@example.com",
            "password": "testpass123",
            "first_name": "Sarah",
            "last_name": "Admin",
            "role": UserRole.ADMIN
        }
    ]
    
    for user_data in test_users:
        user = db.query(User).filter(User.email == user_data["email"]).first()
        if not user:
            password = user_data.pop("password")
            user = User(
                **user_data,
                password_hash=get_password_hash(password),
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()
            
            # Create role-specific profiles
            if user.role == UserRole.ADMIN:
                admin_profile = AdminProfile(
                    user_id=user.id,
                    admin_level=3,
                    permissions=["read_users", "write_users", "read_jobs", "write_jobs"],
                    department="Human Resources"
                )
                db.add(admin_profile)
            
            logger.info(f"Created test user: {user_data['email']}")
    
    db.commit()
    logger.info("Test data creation completed!")


def reset_database(db: Session) -> None:
    """
    Reset database - DANGEROUS! Only use in development
    """
    if settings.ENVIRONMENT != "development":
        raise Exception("Database reset is only allowed in development environment!")
    
    logger.warning("Resetting database - all data will be lost!")
    
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    logger.info("All tables dropped")
    
    # Recreate all tables
    Base.metadata.create_all(bind=engine)
    logger.info("All tables recreated")
    
    # Initialize with default data
    init_db(db)


if __name__ == "__main__":
    # Run initialization when script is executed directly
    from app.db.session import SessionLocal
    
    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    
    try:
        # For development, you might want to reset and reinitialize
        if settings.ENVIRONMENT == "development" and input("Reset database? (y/N): ").lower() == "y":
            reset_database(db)
        else:
            init_db(db)
    finally:
        db.close()