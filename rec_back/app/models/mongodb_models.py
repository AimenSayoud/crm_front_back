from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from uuid import UUID, uuid4
from beanie import Document, Link
from pydantic import Field, EmailStr, ConfigDict


class BaseDocument(Document):
    """Base document with common fields for all collections."""
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    deleted_at: Optional[datetime] = None
    
    def dict(self, *args, **kwargs):
        """Convert to dict with string IDs."""
        d = super().dict(*args, **kwargs)
        if "id" in d:
            d["id"] = str(d["id"])
        return d
    
    class Settings:
        use_state_management = True


class UserDocument(BaseDocument):
    """User document for MongoDB."""
    email: EmailStr
    password_hash: str
    first_name: str
    last_name: str
    role: str  # "candidate", "employer", "consultant", "admin", "superadmin"
    is_verified: bool = False
    phone: Optional[str] = None
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            "email",
            "role",
            ("email", "role", {"unique": True})
        ]


class SkillDocument(BaseDocument):
    """Skill document for MongoDB."""
    name: str
    category: Optional[str] = None
    description: Optional[str] = None

    class Settings:
        name = "skills"
        indexes = [
            "name",
            "category"
        ]


class CandidateSkillDocument(BaseDocument):
    """Candidate skill relationship document."""
    candidate_id: UUID
    skill_id: UUID
    proficiency_level: Optional[str] = None  # "Beginner", "Intermediate", "Advanced", "Expert"
    years_experience: Optional[int] = None

    class Settings:
        name = "candidate_skills"
        indexes = [
            "candidate_id",
            "skill_id",
            ("candidate_id", "skill_id", {"unique": True})
        ]


class EducationDocument(BaseDocument):
    """Education document for MongoDB."""
    candidate_id: UUID
    institution: str
    degree: str
    field_of_study: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_current: bool = False

    class Settings:
        name = "education"
        indexes = [
            "candidate_id"
        ]


class ExperienceDocument(BaseDocument):
    """Work experience document for MongoDB."""
    candidate_id: UUID
    company: str
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    current: bool = False

    class Settings:
        name = "experience"
        indexes = [
            "candidate_id"
        ]


class CandidateDocument(BaseDocument):
    """Candidate document for MongoDB."""
    user_id: UUID
    current_position: Optional[str] = None
    current_company: Optional[str] = None
    summary: Optional[str] = None
    years_of_experience: Optional[int] = None
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    
    # Location
    location: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Profile Status
    profile_completed: bool = False
    profile_visibility: str = "public"
    is_open_to_opportunities: bool = True
    
    # Documents
    cv_urls: Optional[Dict[str, str]] = None
    cover_letter_url: Optional[str] = None
    
    # Social/Professional Links
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    # Additional Info
    languages: Optional[List[Dict[str, str]]] = None
    certifications: Optional[List[Dict[str, str]]] = None
    awards: Optional[List[Dict[str, str]]] = None
    publications: Optional[List[Dict[str, str]]] = None
    
    # Preferences
    willing_to_relocate: bool = False
    salary_expectation: Optional[int] = None
    
    # Notes
    notes: Optional[str] = None

    class Settings:
        name = "candidates"
        indexes = [
            "user_id",
            "current_position",
            "years_of_experience",
            "country",
            "city"
        ]


class CompanyDocument(BaseDocument):
    """Company document for MongoDB."""
    name: str
    industry: Optional[str] = None
    size: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    created_by: Optional[UUID] = None
    logo_url: Optional[str] = None

    class Settings:
        name = "companies"
        indexes = [
            "name",
            "industry",
            "location"
        ]


class JobSkillDocument(BaseDocument):
    """Job skill relationship document."""
    job_id: UUID
    skill_id: UUID
    is_required: bool = True
    proficiency_level: Optional[str] = None
    years_experience: Optional[int] = None

    class Settings:
        name = "job_skills"
        indexes = [
            "job_id",
            "skill_id",
            ("job_id", "skill_id", {"unique": True})
        ]


class JobDocument(BaseDocument):
    """Job document for MongoDB."""
    company_id: UUID
    posted_by: UUID
    assigned_consultant_id: Optional[UUID] = None
    
    # Job details
    title: str
    description: str
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    
    # Location and type
    location: str
    contract_type: str  # "Permanent", "Contract", "Freelance", "Internship", "Temporary"
    job_type: Optional[str] = None  # "full_time", "part_time", "contract", "freelance", "internship", "temporary"
    experience_level: Optional[str] = None  # "entry_level", "junior", "mid_level", "senior", "lead", "principal"
    
    # Remote work
    remote_option: bool = False
    is_remote: bool = False
    is_hybrid: bool = False
    
    # Salary
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_currency: str = "GBP"
    
    # Status and dates
    status: str = "draft"  # "draft", "open", "closed", "filled", "cancelled"
    posting_date: Optional[datetime] = None
    deadline_date: Optional[datetime] = None
    
    # Additional details
    benefits: Optional[List[str]] = None
    company_culture: Optional[str] = None
    requires_cover_letter: bool = False
    internal_notes: Optional[str] = None
    
    # Visibility and metrics
    is_featured: bool = False
    view_count: int = 0
    application_count: int = 0

    class Settings:
        name = "jobs"
        indexes = [
            "company_id",
            "title",
            "location",
            "status",
            "posting_date",
            "experience_level",
            "is_remote"
        ]


class ApplicationDocument(BaseDocument):
    """Application document for MongoDB."""
    job_id: UUID
    candidate_id: UUID
    status: str = "submitted"  # "submitted", "under_review", "interviewed", "offered", "hired", "rejected", "withdrawn"
    application_date: datetime = Field(default_factory=datetime.utcnow)
    resume_url: Optional[str] = None
    cover_letter_text: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None

    class Settings:
        name = "applications"
        indexes = [
            "job_id",
            "candidate_id",
            "status",
            "application_date",
            ("job_id", "candidate_id", {"unique": True})
        ]


class MessageDocument(BaseDocument):
    """Message document for MongoDB."""
    conversation_id: UUID
    sender_id: UUID
    content: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False
    attachment_url: Optional[str] = None
    message_type: str = "text"  # "text", "file", "image", "system", "template"

    class Settings:
        name = "messages"
        indexes = [
            "conversation_id",
            "sender_id",
            "sent_at"
        ]


class ConversationParticipantDocument(BaseDocument):
    """Conversation participant document for MongoDB."""
    conversation_id: UUID
    user_id: UUID
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "conversation_participants"
        indexes = [
            "conversation_id",
            "user_id",
            ("conversation_id", "user_id", {"unique": True})
        ]


class ConversationDocument(BaseDocument):
    """Conversation document for MongoDB."""
    title: Optional[str] = None
    last_message_at: Optional[datetime] = None
    conversation_type: str = "direct"  # "direct", "group", "broadcast", "system"

    class Settings:
        name = "conversations"
        indexes = [
            "last_message_at"
        ]


class EmailTemplateDocument(BaseDocument):
    """Email template document for MongoDB."""
    name: str
    subject: str
    body: str
    description: Optional[str] = None
    category: Optional[str] = None
    template_type: str  # "interview_invitation", "job_offer", "rejection", etc.
    conversation_metadata: Optional[Dict[str, Any]] = None
    created_by: Optional[UUID] = None

    class Settings:
        name = "email_templates"
        indexes = [
            "name",
            "template_type"
        ]


class AIInteractionDocument(BaseDocument):
    """AI interaction document for MongoDB."""
    user_id: Optional[UUID] = None
    interaction_type: str  # "cv_analysis", "job_match", "email_generation", etc.
    prompt: Optional[str] = None
    response: Optional[Dict[str, Any]] = None
    entity_type: Optional[str] = None  # "candidate", "job", etc.
    entity_id: Optional[UUID] = None
    tokens_used: Optional[int] = None
    success: bool = True
    error_message: Optional[str] = None

    class Settings:
        name = "ai_interactions"
        indexes = [
            "user_id",
            "interaction_type",
            "created_at"
        ]