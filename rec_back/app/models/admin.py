from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, Integer, DECIMAL
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import BaseModel
from .enums import AdminStatus, AdminRole, PermissionLevel


class AdminProfile(BaseModel):
    __tablename__ = "admin_profiles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    employee_id = Column(String(50), nullable=True, unique=True)
    department = Column(String(100), nullable=True)
    position = Column(String(100), nullable=True)
    admin_level = Column(Integer, nullable=False, default=1)  # 1-5, higher = more access
    status = Column(String(20), nullable=False, default=AdminStatus.ACTIVE)
    
    # Contact information
    phone_number = Column(String(20), nullable=True)
    emergency_contact = Column(JSONB, nullable=True)  # Emergency contact details
    
    # Role and permissions
    roles = Column(JSONB, nullable=True)  # Array of admin roles
    permissions = Column(JSONB, nullable=True)  # Specific permissions
    restricted_actions = Column(JSONB, nullable=True)  # Actions they cannot perform
    
    # Administrative details
    hire_date = Column(DateTime, nullable=True)
    last_login = Column(DateTime, nullable=True)
    login_count = Column(Integer, nullable=False, default=0)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    last_failed_login = Column(DateTime, nullable=True)
    
    # Security settings
    two_factor_enabled = Column(Boolean, nullable=False, default=False)
    session_timeout = Column(Integer, nullable=True)  # in minutes
    allowed_ip_ranges = Column(JSONB, nullable=True)  # Array of allowed IP ranges
    
    # Supervision
    supervisor_id = Column(UUID(as_uuid=True), ForeignKey("admin_profiles.id"), nullable=True)
    
    # Activity tracking
    total_actions_performed = Column(Integer, nullable=False, default=0)
    last_action_at = Column(DateTime, nullable=True)
    
    # Notes
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)  # Internal admin notes
    
    # Relationships
    user = relationship("User", back_populates="admin_profile")
    supervisor = relationship("AdminProfile", remote_side="AdminProfile.id")
    supervised_admins = relationship("AdminProfile", back_populates="supervisor")
    audit_logs = relationship("AdminAuditLog", back_populates="admin")


class SuperAdminProfile(BaseModel):
    __tablename__ = "superadmin_profiles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    access_level = Column(Integer, nullable=False, default=10)  # Highest access level
    
    # Security
    master_key_access = Column(Boolean, nullable=False, default=False)
    system_config_access = Column(Boolean, nullable=False, default=True)
    user_management_access = Column(Boolean, nullable=False, default=True)
    financial_access = Column(Boolean, nullable=False, default=False)
    
    # Emergency access
    emergency_access_enabled = Column(Boolean, nullable=False, default=True)
    emergency_contact_info = Column(JSONB, nullable=True)
    
    # Activity tracking
    last_system_change = Column(DateTime, nullable=True)
    critical_actions_count = Column(Integer, nullable=False, default=0)
    
    # Backup and recovery
    backup_access = Column(Boolean, nullable=False, default=True)
    recovery_key_access = Column(Boolean, nullable=False, default=False)
    
    # API access
    api_key_management = Column(Boolean, nullable=False, default=True)
    rate_limit_override = Column(Boolean, nullable=False, default=False)
    
    # Notes
    appointment_notes = Column(Text, nullable=True)
    security_clearance_notes = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="superadmin_profile")


class AdminAuditLog(BaseModel):
    __tablename__ = "admin_audit_logs"
    
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admin_profiles.id"), nullable=True)
    superadmin_id = Column(UUID(as_uuid=True), ForeignKey("superadmin_profiles.id"), nullable=True)
    
    # Action details
    action_type = Column(String(100), nullable=False)  # create, update, delete, login, etc.
    resource_type = Column(String(100), nullable=True)  # user, job, application, etc.
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Request details
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(String(500), nullable=True)
    session_id = Column(String(100), nullable=True)
    
    # Change tracking
    old_values = Column(JSONB, nullable=True)  # Previous values
    new_values = Column(JSONB, nullable=True)  # New values
    changes_summary = Column(Text, nullable=True)
    
    # Status and outcome
    status = Column(String(20), nullable=False)  # success, failed, unauthorized
    error_message = Column(Text, nullable=True)
    
    # Additional context
    reason = Column(Text, nullable=True)  # Reason for the action
    notes = Column(Text, nullable=True)
    admin_metadata = Column(JSONB, nullable=True)
    
    # Relationships
    admin = relationship("AdminProfile", back_populates="audit_logs")
    superadmin = relationship("SuperAdminProfile", backref="audit_logs")


class SystemConfiguration(BaseModel):
    __tablename__ = "system_configurations"
    
    config_key = Column(String(100), nullable=False, unique=True)
    config_value = Column(JSONB, nullable=True)
    config_type = Column(String(50), nullable=False)  # string, number, boolean, object, array
    
    # Metadata
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # security, email, notifications, etc.
    is_sensitive = Column(Boolean, nullable=False, default=False)
    is_public = Column(Boolean, nullable=False, default=False)
    
    # Change tracking
    last_modified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    last_modified_at = Column(DateTime, nullable=True)
    version = Column(Integer, nullable=False, default=1)
    
    # Validation
    validation_rules = Column(JSONB, nullable=True)  # Validation rules for the value
    default_value = Column(JSONB, nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Relationships
    last_modified_by_user = relationship("User", foreign_keys=[last_modified_by])


class AdminNotification(BaseModel):
    __tablename__ = "admin_notifications"
    
    admin_id = Column(UUID(as_uuid=True), ForeignKey("admin_profiles.id"), nullable=True)
    superadmin_id = Column(UUID(as_uuid=True), ForeignKey("superadmin_profiles.id"), nullable=True)
    
    # Notification details
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # alert, warning, info, success
    priority = Column(String(20), nullable=False, default="medium")  # low, medium, high, critical
    
    # Status
    is_read = Column(Boolean, nullable=False, default=False)
    read_at = Column(DateTime, nullable=True)
    is_dismissed = Column(Boolean, nullable=False, default=False)
    dismissed_at = Column(DateTime, nullable=True)
    
    # Additional data
    action_required = Column(Boolean, nullable=False, default=False)
    action_url = Column(String(500), nullable=True)
    action_data = Column(JSONB, nullable=True)
    
    # Expiration
    expires_at = Column(DateTime, nullable=True)
    
    # Source
    source_type = Column(String(50), nullable=True)  # system, user, automated, etc.
    source_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Relationships
    admin = relationship("AdminProfile", backref="notifications")
    superadmin = relationship("SuperAdminProfile", backref="notifications")