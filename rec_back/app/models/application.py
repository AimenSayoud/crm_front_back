from sqlalchemy import Column, String, Text, Date, ForeignKey, Enum as SQLEnum, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import ApplicationStatus


class Application(BaseModel):
    __tablename__ = "applications"

    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidate_profiles.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=True)
    
    # Application details
    cover_letter = Column(Text, nullable=True)
    source = Column(String(100), nullable=True)  # website, referral, direct, etc.
    
    # Dates
    applied_at = Column(DateTime, nullable=False, server_default=func.now())
    last_updated = Column(DateTime, nullable=True, onupdate=func.now())
    
    # Status
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False)
    
    # Interview details
    interview_date = Column(DateTime, nullable=True)
    interview_type = Column(String(50), nullable=True)  # phone, video, in-person
    
    # Offer details
    offer_salary = Column(Integer, nullable=True)
    offer_currency = Column(String(3), nullable=True, default="GBP")
    offer_date = Column(Date, nullable=True)
    offer_expiry_date = Column(Date, nullable=True)
    offer_response = Column(String(20), nullable=True)  # pending, accepted, rejected, negotiating
    
    # Notes
    internal_notes = Column(Text, nullable=True)

    # Relationships
    candidate = relationship("CandidateProfile", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    consultant = relationship("ConsultantProfile", back_populates="managed_applications")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", cascade="all, delete-orphan")
    notes = relationship("ApplicationNote", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Application(id={self.id}, candidate_id={self.candidate_id}, job_id={self.job_id}, status={self.status})>"


class ApplicationStatusHistory(BaseModel):
    __tablename__ = "application_status_history"

    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    status = Column(SQLEnum(ApplicationStatus), nullable=False)
    comment = Column(Text, nullable=True)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    application = relationship("Application", back_populates="status_history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])

    def __repr__(self):
        return f"<ApplicationStatusHistory(id={self.id}, application_id={self.application_id}, status={self.status})>"


class ApplicationNote(BaseModel):
    __tablename__ = "application_notes"

    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("consultant_profiles.id"), nullable=False)
    note_text = Column(Text, nullable=False)

    # Relationships
    application = relationship("Application", back_populates="notes")
    consultant = relationship("ConsultantProfile", back_populates="application_notes")

    def __repr__(self):
        return f"<ApplicationNote(id={self.id}, application_id={self.application_id}, consultant_id={self.consultant_id})>"