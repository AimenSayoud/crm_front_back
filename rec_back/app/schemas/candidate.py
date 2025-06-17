from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, field_validator, EmailStr, Field, validator
from uuid import UUID


# Base schemas
class CandidateJobPreferenceBase(BaseModel):
    job_types: Optional[List[str]] = Field(None, description="Preferred job types")
    industries: Optional[List[str]] = Field(None, description="Preferred industries")
    locations: Optional[List[str]] = Field(None, description="Preferred locations")
    remote_work: Optional[bool] = Field(None, description="Open to remote work")
    salary_expectation_min: Optional[Decimal] = Field(None, description="Minimum salary expectation")
    salary_expectation_max: Optional[Decimal] = Field(None, description="Maximum salary expectation")
    availability_date: Optional[date] = Field(None, description="Available start date")
    willing_to_relocate: Optional[bool] = Field(None, description="Willing to relocate")


class CandidateJobPreferenceCreate(CandidateJobPreferenceBase):
    candidate_id: UUID


class CandidateJobPreferenceUpdate(CandidateJobPreferenceBase):
    pass


class CandidateJobPreference(CandidateJobPreferenceBase):
    id: UUID
    candidate_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Notification Settings schemas
class CandidateNotificationSettingsBase(BaseModel):
    email_alerts: Optional[bool] = True
    job_matches: Optional[bool] = True
    application_updates: Optional[bool] = True


class CandidateNotificationSettingsCreate(CandidateNotificationSettingsBase):
    candidate_id: UUID


class CandidateNotificationSettingsUpdate(CandidateNotificationSettingsBase):
    pass


class CandidateNotificationSettings(CandidateNotificationSettingsBase):
    id: UUID
    candidate_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Candidate Skill schemas
class CandidateSkillBase(BaseModel):
    skill_id: UUID
    proficiency_level: Optional[str] = Field(None, pattern="^(Beginner|Intermediate|Advanced|Expert)$")
    years_experience: Optional[int] = Field(None, ge=0, le=50)


class CandidateSkillCreate(CandidateSkillBase):
    candidate_id: UUID


class CandidateSkillUpdate(CandidateSkillBase):
    skill_id: Optional[UUID] = None


class CandidateSkill(CandidateSkillBase):
    id: UUID
    candidate_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    skill_name: Optional[str] = None

    class Config:
        from_attributes = True


# Education schemas
class EducationBase(BaseModel):
    institution: str = Field(..., min_length=1, max_length=200)
    degree: str = Field(..., min_length=1, max_length=100)
    field_of_study: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    gpa: Optional[Decimal] = Field(None, ge=0, le=4.0)
    is_current: Optional[bool] = False
    description: Optional[str] = None


class EducationCreate(EducationBase):
    candidate_id: UUID


class EducationUpdate(EducationBase):
    institution: Optional[str] = Field(None, min_length=1, max_length=200)
    degree: Optional[str] = Field(None, min_length=1, max_length=100)


class Education(EducationBase):
    id: UUID
    candidate_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Work Experience schemas
class WorkExperienceBase(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    position: str = Field(..., min_length=1, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = False
    salary: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = None
    achievements: Optional[List[str]] = None
    technologies_used: Optional[List[str]] = None
    location: Optional[str] = Field(None, max_length=200)


class WorkExperienceCreate(WorkExperienceBase):
    candidate_id: UUID


class WorkExperienceUpdate(WorkExperienceBase):
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    position: Optional[str] = Field(None, min_length=1, max_length=100)


class WorkExperience(WorkExperienceBase):
    id: UUID
    candidate_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Candidate Profile schemas
class CandidateProfileBase(BaseModel):
    linkedin_url: Optional[str] = Field(None, max_length=500)
    github_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    summary: Optional[str] = None
    
    # Personal information
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    
    # Professional information
    current_position: Optional[str] = Field(None, max_length=200)
    current_company: Optional[str] = Field(None, max_length=200)
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    
    # CV and documents
    cv_urls: Optional[List[str]] = None
    cover_letter_url: Optional[str] = Field(None, max_length=500)
    
    # Additional information
    languages: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    awards: Optional[List[Dict[str, Any]]] = None
    publications: Optional[List[Dict[str, Any]]] = None
    
    # Visibility and settings
    profile_visibility: Optional[str] = Field("public", pattern="^(public|private|semi_private)$")
    is_open_to_opportunities: Optional[bool] = True
    
    # Notes
    notes: Optional[str] = None

    @field_validator('cv_urls')
    def validate_cv_urls(cls, v):
        if v is not None and len(v) > 5:
            raise ValueError('Maximum 5 CV files allowed')
        return v


class CandidateProfileCreate(CandidateProfileBase):
    user_id: UUID


class CandidateProfileUpdate(CandidateProfileBase):
    pass


class CandidateProfile(CandidateProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    education: Optional[List[Education]] = None
    work_experience: Optional[List[WorkExperience]] = None
    job_preferences: Optional[CandidateJobPreference] = None
    skills: Optional[List[CandidateSkill]] = None
    notification_settings: Optional[CandidateNotificationSettings] = None

    class Config:
        from_attributes = True


# Comprehensive candidate response with user info
class CandidateFullProfile(BaseModel):
    # User information
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    # Profile information
    profile: Optional[CandidateProfile] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class CandidateSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="General search query")
    skills: Optional[List[str]] = Field(None, description="Required skills")
    experience_min: Optional[int] = Field(None, ge=0, description="Minimum years of experience")
    experience_max: Optional[int] = Field(None, ge=0, description="Maximum years of experience")
    locations: Optional[List[str]] = Field(None, description="Preferred locations")
    industries: Optional[List[str]] = Field(None, description="Industry experience")
    education_level: Optional[str] = Field(None, description="Minimum education level")
    availability: Optional[str] = Field(None, pattern="^(immediate|1_week|2_weeks|1_month|3_months)$")
    remote_only: Optional[bool] = Field(None, description="Remote work only")
    salary_min: Optional[Decimal] = Field(None, ge=0, description="Minimum salary expectation")
    salary_max: Optional[Decimal] = Field(None, ge=0, description="Maximum salary expectation")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|updated_at|experience|relevance)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class CandidateListResponse(BaseModel):
    candidates: List[CandidateFullProfile]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True