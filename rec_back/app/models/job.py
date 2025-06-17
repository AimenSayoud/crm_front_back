from sqlalchemy import Column, String, Text, Integer, Date, DateTime, Boolean, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import ContractType, JobStatus, ProficiencyLevel, JobType, ExperienceLevel


class Job(BaseModel):
    __tablename__ = "jobs"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=True)
    
    # Job details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    responsibilities = Column(JSONB, nullable=True)  # Array of responsibilities
    requirements = Column(JSONB, nullable=True)  # Array of requirements
    
    # Location and type
    location = Column(String, nullable=False)
    contract_type = Column(SQLEnum(ContractType), nullable=False)
    job_type = Column(SQLEnum(JobType), nullable=True)
    experience_level = Column(SQLEnum(ExperienceLevel), nullable=True)
    
    # Remote work
    remote_option = Column(Boolean, default=False, nullable=False)  # Kept for backward compatibility
    is_remote = Column(Boolean, default=False, nullable=False)  # Alias for CRUD compatibility
    is_hybrid = Column(Boolean, default=False, nullable=False)  # Hybrid work arrangement
    
    # Salary
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_currency = Column(String(3), nullable=True, default="GBP")
    
    # Status and dates
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    posting_date = Column(Date, nullable=True)
    deadline_date = Column(Date, nullable=True)
    
    # Additional details
    benefits = Column(JSONB, nullable=True)  # Array of benefits
    company_culture = Column(Text, nullable=True)
    requires_cover_letter = Column(Boolean, default=False, nullable=False)
    internal_notes = Column(Text, nullable=True)
    
    # Visibility and metrics
    is_featured = Column(Boolean, default=False, nullable=False)
    view_count = Column(Integer, default=0, nullable=False)
    application_count = Column(Integer, default=0, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="jobs")
    posted_by_user = relationship("User", back_populates="posted_jobs", foreign_keys=[posted_by])
    assigned_consultant = relationship("ConsultantProfile", back_populates="assigned_jobs", foreign_keys=[assigned_consultant_id])
    skill_requirements = relationship("JobSkillRequirement", back_populates="job", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    @property
    def salary_range_display(self):
        if self.salary_min and self.salary_max:
            return f"£{self.salary_min:,} - £{self.salary_max:,}"
        elif self.salary_min:
            return f"£{self.salary_min:,}+"
        elif self.salary_max:
            return f"Up to £{self.salary_max:,}"
        return "Salary not specified"

    def __repr__(self):
        return f"<Job(id={self.id}, title={self.title}, company_id={self.company_id}, status={self.status})>"


class JobSkillRequirement(BaseModel):
    __tablename__ = "job_skills"

    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)
    proficiency_level = Column(SQLEnum(ProficiencyLevel), nullable=True)
    years_experience = Column(Integer, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="skill_requirements")
    skill = relationship("Skill", back_populates="job_skills")

    def __repr__(self):
        return f"<JobSkillRequirement(job_id={self.job_id}, skill_id={self.skill_id}, required={self.is_required})>"