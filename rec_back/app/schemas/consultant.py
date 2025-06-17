from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID
from app.models.enums import ConsultantStatus


# Base schemas for Consultant Profile
class ConsultantProfileBase(BaseModel):
    user_id: UUID
    specialization: Optional[str] = Field(None, max_length=200)
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    status: Optional[ConsultantStatus] = ConsultantStatus.ACTIVE
    commission_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    contact_info: Optional[Dict[str, Any]] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    languages: Optional[List[str]] = None


class ConsultantProfileCreate(ConsultantProfileBase):
    pass


class ConsultantProfileUpdate(ConsultantProfileBase):
    user_id: Optional[UUID] = None


class ConsultantProfile(ConsultantProfileBase):
    id: UUID
    total_placements: Optional[int] = 0
    total_earnings: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Consultant Target schemas
class ConsultantTargetBase(BaseModel):
    consultant_id: UUID
    target_type: str = Field(..., pattern="^(monthly|quarterly|yearly)$")
    target_value: Decimal = Field(..., ge=0)
    target_period: str
    achieved_value: Optional[Decimal] = Field(0, ge=0)


class ConsultantTargetCreate(ConsultantTargetBase):
    pass


class ConsultantTargetUpdate(ConsultantTargetBase):
    consultant_id: Optional[UUID] = None
    target_type: Optional[str] = Field(None, pattern="^(monthly|quarterly|yearly)$")
    target_value: Optional[Decimal] = Field(None, ge=0)
    target_period: Optional[str] = None


class ConsultantTarget(ConsultantTargetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Performance Review schemas
class ConsultantPerformanceReviewBase(BaseModel):
    consultant_id: UUID
    reviewer_id: UUID
    review_period: str
    performance_score: Optional[int] = Field(None, ge=1, le=10)
    strengths: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    goals_next_period: Optional[str] = None
    overall_rating: Optional[str] = Field(None, pattern="^(excellent|good|satisfactory|needs_improvement|unsatisfactory)$")


class ConsultantPerformanceReviewCreate(ConsultantPerformanceReviewBase):
    pass


class ConsultantPerformanceReviewUpdate(ConsultantPerformanceReviewBase):
    consultant_id: Optional[UUID] = None
    reviewer_id: Optional[UUID] = None
    review_period: Optional[str] = None


class ConsultantPerformanceReview(ConsultantPerformanceReviewBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Consultant-Candidate Association schemas
class ConsultantCandidateBase(BaseModel):
    notes: Optional[str] = None
    is_active: Optional[bool] = True


class ConsultantCandidateCreate(ConsultantCandidateBase):
    consultant_id: UUID
    candidate_id: UUID


class ConsultantCandidateUpdate(ConsultantCandidateBase):
    pass


class ConsultantCandidate(ConsultantCandidateBase):
    id: UUID
    consultant_id: UUID
    candidate_id: UUID
    assigned_date: datetime
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    candidate_name: Optional[str] = None
    consultant_name: Optional[str] = None

    class Config:
        from_attributes = True


# Consultant-Client Association schemas
class ConsultantClientBase(BaseModel):
    is_primary: Optional[bool] = False
    is_active: Optional[bool] = True
    notes: Optional[str] = None


class ConsultantClientCreate(ConsultantClientBase):
    consultant_id: UUID
    company_id: UUID


class ConsultantClientUpdate(ConsultantClientBase):
    pass


class ConsultantClient(ConsultantClientBase):
    id: UUID
    consultant_id: UUID
    company_id: UUID
    assigned_date: datetime
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    company_name: Optional[str] = None
    consultant_name: Optional[str] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class ConsultantSearchFilters(BaseModel):
    status: Optional[ConsultantStatus] = None
    specialization: Optional[str] = None
    min_experience_years: Optional[int] = Field(None, ge=0)
    max_experience_years: Optional[int] = Field(None, ge=0)
    skills: Optional[List[str]] = None
    min_commission_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    max_commission_rate: Optional[Decimal] = Field(None, ge=0, le=1)
    languages: Optional[List[str]] = None
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|updated_at|experience_years|total_placements)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class ConsultantListResponse(BaseModel):
    consultants: List[ConsultantProfile]
    total: int
    page: int
    pages: int

    class Config:
        from_attributes = True


# Extended schemas with relationships
class ConsultantProfileWithDetails(ConsultantProfile):
    user: Optional[Dict[str, Any]] = None
    targets: Optional[List[ConsultantTarget]] = None
    performance_reviews: Optional[List[ConsultantPerformanceReview]] = None
    active_clients: Optional[int] = 0
    active_candidates: Optional[int] = 0

    class Config:
        from_attributes = True


# Statistics schemas
class ConsultantStats(BaseModel):
    total_consultants: int
    active_consultants: int
    top_performers: List[Dict[str, Any]]
    average_commission_rate: Optional[Decimal]
    total_placements_this_month: int
    total_earnings_this_month: Optional[Decimal]

    class Config:
        from_attributes = True