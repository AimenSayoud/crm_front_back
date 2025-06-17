from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, field_validator, Field, model_validator
from uuid import UUID
from app.models.job import JobStatus, JobType, ExperienceLevel
from app.models.enums import ContractType


# Base schemas for Job Skill Requirements
class JobSkillRequirementBase(BaseModel):
    skill_id: UUID
    is_required: Optional[bool] = True
    proficiency_level: Optional[str] = Field(None, pattern="^(Beginner|Intermediate|Advanced|Expert)$")
    years_experience: Optional[int] = Field(None, ge=0, le=50)


class JobSkillRequirementCreate(JobSkillRequirementBase):
    job_id: UUID


class JobSkillRequirementUpdate(JobSkillRequirementBase):
    skill_id: Optional[UUID] = None


class JobSkillRequirement(JobSkillRequirementBase):
    id: UUID
    job_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Base schemas for Jobs
class JobBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    responsibilities: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    
    # Location and work arrangement
    location: Optional[str] = Field(None, max_length=200)
    is_remote: Optional[bool] = False
    is_hybrid: Optional[bool] = False
    
    # Employment details
    contract_type: Optional[ContractType] = ContractType.PERMANENT
    job_type: Optional[JobType] = JobType.FULL_TIME
    experience_level: Optional[ExperienceLevel] = ExperienceLevel.MID_LEVEL
    
    # Salary information
    salary_min: Optional[Decimal] = Field(None, ge=0)
    salary_max: Optional[Decimal] = Field(None, ge=0)
    salary_currency: Optional[str] = Field("EUR", max_length=3)
    
    # Job posting details
    deadline_date: Optional[date] = None
    posting_date: Optional[date] = None
    
    # Additional details
    benefits: Optional[List[str]] = None
    company_culture: Optional[str] = None
    
    # Settings
    is_featured: Optional[bool] = False
    requires_cover_letter: Optional[bool] = False
    
    # Internal fields
    internal_notes: Optional[str] = None

    @model_validator(mode='after')
    def validate_salary_range(self):
        if self.salary_max is not None and self.salary_min is not None:
            if self.salary_max < self.salary_min:
                raise ValueError('salary_max must be greater than or equal to salary_min')
        return self


class JobCreate(JobBase):
    company_id: UUID
    posted_by: UUID


class JobUpdate(JobBase):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[JobStatus] = None


class Job(JobBase):
    id: UUID
    company_id: UUID
    posted_by: UUID
    assigned_consultant_id: Optional[UUID] = None
    status: JobStatus
    application_count: Optional[int] = 0
    view_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    skill_requirements: Optional[List[JobSkillRequirement]] = None

    class Config:
        from_attributes = True


# Job with company and poster information
class JobWithDetails(Job):
    company_name: Optional[str] = None
    posted_by_name: Optional[str] = None
    assigned_consultant_name: Optional[str] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class JobSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="General search query")
    company_id: Optional[UUID] = Field(None, description="Filter by company")
    location: Optional[str] = Field(None, description="Location filter")
    is_remote: Optional[bool] = Field(None, description="Remote jobs only")
    job_type: Optional[JobType] = Field(None, description="Job type filter")
    experience_level: Optional[ExperienceLevel] = Field(None, description="Experience level filter")
    salary_min: Optional[Decimal] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[Decimal] = Field(None, ge=0, description="Maximum salary")
    skills: Optional[List[str]] = Field(None, description="Required skills")
    status: Optional[JobStatus] = Field(None, description="Job status filter")
    posted_after: Optional[date] = Field(None, description="Posted after date")
    posted_before: Optional[date] = Field(None, description="Posted before date")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|updated_at|title|salary_min|application_count|relevance)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class JobListResponse(BaseModel):
    jobs: List[JobWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


# Application-related schemas
class JobApplicationSummary(BaseModel):
    job_id: UUID
    total_applications: int
    new_applications: int
    under_review: int
    interviewed: int
    offered: int
    hired: int
    rejected: int

    class Config:
        from_attributes = True