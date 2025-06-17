# Import all the models here to ensure they are registered with SQLAlchemy
# This is crucial for Alembic migrations to detect all tables

from app.models.base import Base  # Import Base first

# Import all models to register them with SQLAlchemy
from app.models.user import User
from app.models.candidate import (
    CandidateProfile, CandidateEducation, CandidateExperience,
    CandidatePreferences, CandidateSkill, CandidateNotificationSettings
)
from app.models.company import (
    Company, EmployerProfile, CompanyContact,
    CompanyHiringPreferences, RecruitmentHistory
)
from app.models.job import Job, JobSkillRequirement
from app.models.skill import Skill, SkillCategory
from app.models.application import Application, ApplicationStatusHistory, ApplicationNote
from app.models.consultant import (
    ConsultantProfile, ConsultantTarget, ConsultantPerformanceReview,
    ConsultantCandidate, ConsultantClient, consultant_skills
)
from app.models.messaging import (
    Conversation, Message, MessageAttachment, MessageReadReceipt,
    MessageReaction, EmailTemplate, conversation_participants
)
from app.models.admin import (
    AdminProfile, SuperAdminProfile, AdminAuditLog,
    SystemConfiguration, AdminNotification
)

# This ensures all models are imported and registered
__all__ = ["Base"]