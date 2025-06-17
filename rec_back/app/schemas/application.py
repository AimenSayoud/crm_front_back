from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field, validator
from uuid import UUID
from app.models.enums import ApplicationStatus


# Base schemas for Application Status History
class ApplicationStatusHistoryBase(BaseModel):
    status: ApplicationStatus
    comment: Optional[str] = None
    changed_by: Optional[UUID] = None


class ApplicationStatusHistoryCreate(ApplicationStatusHistoryBase):
    application_id: UUID


class ApplicationStatusHistory(ApplicationStatusHistoryBase):
    id: UUID
    application_id: UUID
    changed_at: datetime
    
    # Changed by user info (populated via join)
    changed_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# Base schemas for Application Notes
class ApplicationNoteBase(BaseModel):
    note_text: str = Field(..., min_length=1)
    is_private: Optional[bool] = False


class ApplicationNoteCreate(ApplicationNoteBase):
    application_id: UUID
    consultant_id: UUID


class ApplicationNoteUpdate(ApplicationNoteBase):
    note_text: Optional[str] = Field(None, min_length=1)


class ApplicationNote(ApplicationNoteBase):
    id: UUID
    application_id: UUID
    consultant_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    consultant_name: Optional[str] = None

    class Config:
        from_attributes = True


# Base schemas for Applications
class ApplicationBase(BaseModel):
    # Cover letter and documents
    cover_letter: Optional[str] = None
    cv_url: Optional[str] = Field(None, max_length=500)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    
    # Application details
    source: Optional[str] = Field("website", max_length=50)  # website, linkedin, referral, etc.
    referral_source: Optional[str] = Field(None, max_length=200)
    
    # Interview information
    interview_date: Optional[datetime] = None
    interview_type: Optional[str] = Field(None, pattern="^(phone|video|in_person|panel)$")
    interview_feedback: Optional[str] = None
    interview_rating: Optional[int] = Field(None, ge=1, le=5)
    
    # Offer information
    offer_salary: Optional[float] = Field(None, ge=0)
    offer_currency: Optional[str] = Field("EUR", max_length=3)
    offer_date: Optional[date] = None
    offer_expiry_date: Optional[date] = None
    offer_response: Optional[str] = Field(None, pattern="^(pending|accepted|rejected|negotiating)$")
    
    # Feedback and notes
    candidate_feedback: Optional[str] = None
    employer_feedback: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # Rejection information
    rejection_reason: Optional[str] = None
    rejection_feedback: Optional[str] = None
    
    # Additional metadata
    application_metadata: Optional[Dict[str, Any]] = None


class ApplicationCreate(ApplicationBase):
    candidate_id: UUID
    job_id: UUID


class ApplicationUpdate(ApplicationBase):
    status: Optional[ApplicationStatus] = None
    consultant_id: Optional[UUID] = None


class Application(ApplicationBase):
    id: UUID
    candidate_id: UUID
    job_id: UUID
    consultant_id: Optional[UUID] = None
    status: ApplicationStatus
    applied_at: datetime
    last_updated: datetime
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    status_history: Optional[List[ApplicationStatusHistory]] = None
    notes: Optional[List[ApplicationNote]] = None

    class Config:
        from_attributes = True


# Application with detailed information
class ApplicationWithDetails(Application):
    # Candidate information
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    
    # Job information
    job_title: Optional[str] = None
    job_location: Optional[str] = None
    company_name: Optional[str] = None
    
    # Consultant information
    consultant_name: Optional[str] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class ApplicationSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="General search query")
    candidate_id: Optional[UUID] = Field(None, description="Filter by candidate")
    job_id: Optional[UUID] = Field(None, description="Filter by job")
    company_id: Optional[UUID] = Field(None, description="Filter by company")
    consultant_id: Optional[UUID] = Field(None, description="Filter by consultant")
    status: Optional[ApplicationStatus] = Field(None, description="Filter by status")
    statuses: Optional[List[ApplicationStatus]] = Field(None, description="Filter by multiple statuses")
    source: Optional[str] = Field(None, description="Filter by application source")
    interview_scheduled: Optional[bool] = Field(None, description="Filter applications with scheduled interviews")
    offer_pending: Optional[bool] = Field(None, description="Filter applications with pending offers")
    applied_after: Optional[date] = Field(None, description="Applied after date")
    applied_before: Optional[date] = Field(None, description="Applied before date")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("applied_at", pattern="^(applied_at|last_updated|status|candidate_name|job_title)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class ApplicationListResponse(BaseModel):
    applications: List[ApplicationWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


# Application statistics
class ApplicationStats(BaseModel):
    total_applications: int
    new_applications: int
    under_review: int
    interviewed: int
    offered: int
    hired: int
    rejected: int
    
    # Time-based stats
    applications_this_week: int
    applications_this_month: int
    
    # Conversion rates
    interview_rate: Optional[float] = None
    offer_rate: Optional[float] = None
    hire_rate: Optional[float] = None
    
    # Average times (in days)
    avg_time_to_interview: Optional[float] = None
    avg_time_to_offer: Optional[float] = None
    avg_time_to_hire: Optional[float] = None

    class Config:
        from_attributes = True


# Bulk application operations
class BulkApplicationUpdate(BaseModel):
    application_ids: List[UUID]
    status: Optional[ApplicationStatus] = None
    consultant_id: Optional[UUID] = None
    add_note: Optional[str] = None


class BulkApplicationResponse(BaseModel):
    updated_count: int
    failed_count: int
    errors: List[str] = []


# Application actions
class ApplicationStatusChange(BaseModel):
    new_status: ApplicationStatus
    comment: Optional[str] = None
    notify_candidate: Optional[bool] = True
    notify_employer: Optional[bool] = False


class ScheduleInterview(BaseModel):
    interview_date: datetime
    interview_type: str = Field(..., pattern="^(phone|video|in_person|panel)$")
    location: Optional[str] = None
    notes: Optional[str] = None
    notify_candidate: Optional[bool] = True


class MakeOffer(BaseModel):
    salary_amount: float = Field(..., ge=0)
    currency: str = Field("EUR", max_length=3)
    start_date: Optional[date] = None
    offer_expiry_date: Optional[date] = None
    benefits: Optional[List[str]] = None
    notes: Optional[str] = None
    notify_candidate: Optional[bool] = True