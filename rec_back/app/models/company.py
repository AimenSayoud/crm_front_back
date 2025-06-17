from sqlalchemy import Column, String, Text, Boolean, Date, Integer, ForeignKey, ARRAY, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import CompanySize


class Company(BaseModel):
    __tablename__ = "companies"

    name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    size = Column(SQLEnum(CompanySize), nullable=True)
    company_size = Column(SQLEnum(CompanySize), nullable=True)  # Alias for backward compatibility
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    
    # Additional fields to match schema
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    founded_year = Column(Integer, nullable=True)
    registration_number = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)
    cover_image_url = Column(String, nullable=True)
    social_media = Column(JSONB, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_premium = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)
    total_employees = Column(Integer, default=0, nullable=True)
    active_jobs = Column(Integer, default=0, nullable=True)

    # Relationships
    employer_profiles = relationship("EmployerProfile", back_populates="company", cascade="all, delete-orphan")
    contacts = relationship("CompanyContact", back_populates="company", cascade="all, delete-orphan")
    hiring_preferences = relationship("CompanyHiringPreferences", back_populates="company", uselist=False, cascade="all, delete-orphan")
    recruitment_history = relationship("RecruitmentHistory", back_populates="company", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="company", cascade="all, delete-orphan")
    consultant_assignments = relationship("ConsultantClient", back_populates="company")

    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name}, industry={self.industry})>"


class EmployerProfile(BaseModel):
    __tablename__ = "employer_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Job title and position
    title = Column(String, nullable=True)  # Kept for backward compatibility
    position = Column(String(200), nullable=True)  # HR Director, CEO, etc.
    department = Column(String(200), nullable=True)
    
    # Permissions
    is_primary_contact = Column(Boolean, default=False, nullable=False)
    can_post_jobs = Column(Boolean, default=True, nullable=False)
    
    # Statistics
    jobs_posted = Column(Integer, default=0, nullable=False)
    successful_hires = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="employer_profiles")
    company = relationship("Company", back_populates="employer_profiles")

    def __repr__(self):
        return f"<EmployerProfile(id={self.id}, user_id={self.user_id}, company_id={self.company_id})>"


class CompanyContact(BaseModel):
    __tablename__ = "company_contacts"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    title = Column(String, nullable=True)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="contacts")

    def __repr__(self):
        return f"<CompanyContact(id={self.id}, name={self.name}, email={self.email})>"


class CompanyHiringPreferences(BaseModel):
    __tablename__ = "company_hiring_preferences"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, unique=True)
    preferred_experience_years = Column(String, nullable=True)
    required_education = Column(Text, nullable=True)
    culture_values = Column(ARRAY(String), nullable=True)
    interview_process = Column(ARRAY(String), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="hiring_preferences")

    def __repr__(self):
        return f"<CompanyHiringPreferences(id={self.id}, company_id={self.company_id})>"


class RecruitmentHistory(BaseModel):
    __tablename__ = "recruitment_history"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    job_title = Column(String, nullable=False)
    date_filled = Column(Date, nullable=True)
    time_to_fill = Column(Integer, nullable=True)  # Days
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="recruitment_history")
    consultant = relationship("ConsultantProfile", back_populates="recruitment_history")

    def __repr__(self):
        return f"<RecruitmentHistory(id={self.id}, job_title={self.job_title}, company_id={self.company_id})>"