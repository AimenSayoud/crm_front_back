from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
from app.models.enums import UserRole, OfficeId


class User(BaseModel):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    phone = Column(String, nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    employer_profiles = relationship("EmployerProfile", back_populates="user", cascade="all, delete-orphan")
    consultant_profile = relationship("ConsultantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("AdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    superadmin_profile = relationship("SuperAdminProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Jobs posted by employers
    posted_jobs = relationship("Job", back_populates="posted_by_user", foreign_keys="Job.posted_by")
    
    # Messages sent
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    
    # Remove the problematic applications relationship - applications are accessed through candidate_profile

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"