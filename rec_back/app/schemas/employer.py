from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, validator
from uuid import UUID


# Base schemas for Company
class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    industry: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    
    # Contact information
    website: Optional[str] = Field(None, max_length=500)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    
    # Address information
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    
    # Company details
    company_size: Optional[str] = Field(None, pattern="^(1-10|10-50|50-200|200-1000|1000\+)$")
    founded_year: Optional[int] = Field(None, ge=1800, le=2030)
    
    # Business information
    registration_number: Optional[str] = Field(None, max_length=50)
    tax_id: Optional[str] = Field(None, max_length=50)
    
    # Additional information
    logo_url: Optional[str] = Field(None, max_length=500)
    cover_image_url: Optional[str] = Field(None, max_length=500)
    social_media: Optional[Dict[str, str]] = None
    
    # Settings
    is_verified: Optional[bool] = False
    is_premium: Optional[bool] = False
    
    # Notes
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(CompanyBase):
    name: Optional[str] = Field(None, min_length=1, max_length=200)


class Company(CompanyBase):
    id: UUID
    total_employees: Optional[int] = 0
    active_jobs: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Base schemas for Company Contact
class CompanyContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    title: Optional[str] = Field(None, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    is_primary: Optional[bool] = False


class CompanyContactCreate(CompanyContactBase):
    company_id: UUID


class CompanyContactUpdate(CompanyContactBase):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None


class CompanyContact(CompanyContactBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Base schemas for Company Hiring Preferences
class CompanyHiringPreferencesBase(BaseModel):
    preferred_experience_years: Optional[str] = None
    required_education: Optional[str] = None
    culture_values: Optional[List[str]] = None
    interview_process: Optional[List[str]] = None


class CompanyHiringPreferencesCreate(CompanyHiringPreferencesBase):
    company_id: UUID


class CompanyHiringPreferencesUpdate(CompanyHiringPreferencesBase):
    pass


class CompanyHiringPreferences(CompanyHiringPreferencesBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Base schemas for Recruitment History
class RecruitmentHistoryBase(BaseModel):
    job_title: str = Field(..., min_length=1, max_length=200)
    date_filled: Optional[date] = None
    time_to_fill: Optional[int] = Field(None, ge=0)  # Days
    consultant_id: Optional[UUID] = None


class RecruitmentHistoryCreate(RecruitmentHistoryBase):
    company_id: UUID


class RecruitmentHistoryUpdate(RecruitmentHistoryBase):
    job_title: Optional[str] = Field(None, min_length=1, max_length=200)


class RecruitmentHistory(RecruitmentHistoryBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    consultant_name: Optional[str] = None

    class Config:
        from_attributes = True


# Base schemas for Employer Profile
class EmployerProfileBase(BaseModel):
    # Company role information
    position: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    
    # Contact preferences
    phone_number: Optional[str] = Field(None, max_length=20)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    
    # Hiring information
    can_post_jobs: Optional[bool] = True
    hiring_budget: Optional[Decimal] = Field(None, ge=0)
    hiring_budget_currency: Optional[str] = Field("EUR", max_length=3)
    
    # Preferences
    preferred_communication: Optional[str] = Field("email", pattern="^(email|phone|both)$")
    notification_settings: Optional[Dict[str, Any]] = None
    
    # Additional information
    bio: Optional[str] = None
    hiring_experience_years: Optional[int] = Field(None, ge=0, le=50)
    
    # Notes
    notes: Optional[str] = None


class EmployerProfileCreate(EmployerProfileBase):
    user_id: UUID
    company_id: UUID


class EmployerProfileUpdate(EmployerProfileBase):
    company_id: Optional[UUID] = None


class EmployerProfile(EmployerProfileBase):
    id: UUID
    user_id: UUID
    company_id: UUID
    jobs_posted: Optional[int] = 0
    successful_hires: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Comprehensive employer response with user and company info
class EmployerFullProfile(BaseModel):
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
    profile: Optional[EmployerProfile] = None
    
    # Company information
    company: Optional[Company] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class CompanySearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="General search query")
    name: Optional[str] = Field(None, description="Company name search")
    industry: Optional[str] = Field(None, description="Industry filter")
    company_size: Optional[str] = Field(None, description="Company size filter")
    location: Optional[str] = Field(None, description="Location filter")
    is_active: Optional[bool] = Field(None, description="Active companies only")
    is_verified: Optional[bool] = Field(None, description="Verified companies only")
    is_premium: Optional[bool] = Field(None, description="Premium companies only")
    founded_after: Optional[int] = Field(None, description="Founded after year")
    founded_before: Optional[int] = Field(None, description="Founded before year")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|updated_at|name|active_jobs)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class EmployerSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="General search query")
    company_id: Optional[UUID] = Field(None, description="Filter by company")
    position: Optional[str] = Field(None, description="Position filter")
    department: Optional[str] = Field(None, description="Department filter")
    can_post_jobs: Optional[bool] = Field(None, description="Can post jobs filter")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|updated_at|jobs_posted|successful_hires)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class CompanyListResponse(BaseModel):
    companies: List[Company]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class EmployerListResponse(BaseModel):
    employers: List[EmployerFullProfile]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


# Company statistics
class CompanyStats(BaseModel):
    company_id: UUID
    total_jobs_posted: int
    active_jobs: int
    total_applications: int
    total_hires: int
    average_time_to_hire: Optional[float] = None  # in days
    top_skills_requested: List[Dict[str, Any]]
    hiring_trends: Dict[str, Any]

    class Config:
        from_attributes = True