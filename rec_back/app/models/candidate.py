from sqlalchemy import Column, String, Boolean, Integer, Date, Text, ForeignKey, ARRAY, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import ContractType, ProficiencyLevel


class CandidateProfile(BaseModel):
    __tablename__ = "candidate_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Personal Information
    current_position = Column(String(200), nullable=True)
    current_company = Column(String(200), nullable=True)
    summary = Column(Text, nullable=True)
    years_of_experience = Column(Integer, nullable=True, default=0)
    date_of_birth = Column(Date, nullable=True)
    nationality = Column(String(100), nullable=True)
    
    # Location
    location = Column(String, nullable=True)  # Kept for backward compatibility
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    address = Column(String(500), nullable=True)
    postal_code = Column(String(20), nullable=True)
    
    # Profile Status
    profile_completed = Column(Boolean, default=False, nullable=False)
    profile_visibility = Column(String(20), default="public", nullable=False)
    is_open_to_opportunities = Column(Boolean, default=True, nullable=False)
    
    # Documents
    cv_urls = Column(JSONB, nullable=True)  # Array of CV file URLs
    cover_letter_url = Column(String(500), nullable=True)
    
    # Social/Professional Links
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    
    # Additional Information
    languages = Column(JSONB, nullable=True)  # Array of language objects
    certifications = Column(JSONB, nullable=True)  # Array of certification objects
    awards = Column(JSONB, nullable=True)  # Array of award objects
    publications = Column(JSONB, nullable=True)  # Array of publication objects
    
    # Preferences
    willing_to_relocate = Column(Boolean, default=False, nullable=False)
    salary_expectation = Column(Integer, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="candidate_profile")
    preferences = relationship("CandidatePreferences", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    notification_settings = relationship("CandidateNotificationSettings", back_populates="candidate", uselist=False, cascade="all, delete-orphan")
    education_records = relationship("CandidateEducation", back_populates="candidate", cascade="all, delete-orphan")
    experience_records = relationship("CandidateExperience", back_populates="candidate", cascade="all, delete-orphan")
    skills = relationship("CandidateSkill", back_populates="candidate", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    consultant_assignments = relationship("ConsultantCandidate", back_populates="candidate")
    

    def __repr__(self):
        return f"<CandidateProfile(id={self.id}, user_id={self.user_id})>"


class CandidatePreferences(BaseModel):
    __tablename__ = "candidate_preferences"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False, unique=True)
    job_types = Column(ARRAY(String), nullable=True)
    industries = Column(ARRAY(String), nullable=True)
    locations = Column(ARRAY(String), nullable=True)
    remote_work = Column(Boolean, default=False, nullable=True)
    salary_expectation_min = Column(Integer, nullable=True)
    salary_expectation_max = Column(Integer, nullable=True)
    availability_date = Column(Date, nullable=True)
    willing_to_relocate = Column(Boolean, default=False, nullable=True)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="preferences")


class CandidateNotificationSettings(BaseModel):
    __tablename__ = "candidate_notification_settings"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False, unique=True)
    email_alerts = Column(Boolean, default=True, nullable=False)
    job_matches = Column(Boolean, default=True, nullable=False)
    application_updates = Column(Boolean, default=True, nullable=False)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="notification_settings")


class CandidateEducation(BaseModel):
    __tablename__ = "candidate_education"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    field_of_study = Column(String, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=False, nullable=False)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="education_records")

    def __repr__(self):
        return f"<CandidateEducation(id={self.id}, degree={self.degree}, institution={self.institution})>"


class CandidateExperience(BaseModel):
    __tablename__ = "candidate_experience"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    current = Column(Boolean, default=False, nullable=False)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="experience_records")

    def __repr__(self):
        return f"<CandidateExperience(id={self.id}, title={self.title}, company={self.company})>"


class CandidateSkill(BaseModel):
    __tablename__ = "candidate_skills"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    proficiency_level = Column(SQLEnum(ProficiencyLevel), nullable=True)
    years_experience = Column(Integer, nullable=True)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="skills")
    skill = relationship("Skill", back_populates="candidate_skills")

    def __repr__(self):
        return f"<CandidateSkill(candidate_id={self.candidate_id}, skill_id={self.skill_id}, level={self.proficiency_level})>"