from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from uuid import UUID
from app.models.admin import AdminStatus, AdminRole, PermissionLevel


# Base schemas for Admin Profile
class AdminProfileBase(BaseModel):
    employee_id: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, max_length=100)
    position: Optional[str] = Field(None, max_length=100)
    admin_level: Optional[int] = Field(1, ge=1, le=5)
    status: Optional[AdminStatus] = AdminStatus.ACTIVE
    phone_number: Optional[str] = Field(None, max_length=20)
    emergency_contact: Optional[Dict[str, Any]] = None
    roles: Optional[List[str]] = None
    permissions: Optional[List[str]] = None
    restricted_actions: Optional[List[str]] = None
    hire_date: Optional[datetime] = None
    two_factor_enabled: Optional[bool] = False
    session_timeout: Optional[int] = Field(None, ge=5, le=480)  # 5 minutes to 8 hours
    allowed_ip_ranges: Optional[List[str]] = None
    supervisor_id: Optional[UUID] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None


class AdminProfileCreate(AdminProfileBase):
    user_id: UUID


class AdminProfileUpdate(AdminProfileBase):
    pass


class AdminProfile(AdminProfileBase):
    id: UUID
    user_id: UUID
    last_login: Optional[datetime] = None
    login_count: Optional[int] = 0
    failed_login_attempts: Optional[int] = 0
    last_failed_login: Optional[datetime] = None
    total_actions_performed: Optional[int] = 0
    last_action_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Admin profile with user details
class AdminProfileWithDetails(AdminProfile):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    supervisor_name: Optional[str] = None
    supervised_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Base schemas for SuperAdmin Profile
class SuperAdminProfileBase(BaseModel):
    access_level: Optional[int] = Field(10, ge=1, le=10)
    master_key_access: Optional[bool] = False
    system_config_access: Optional[bool] = True
    user_management_access: Optional[bool] = True
    financial_access: Optional[bool] = False
    emergency_access_enabled: Optional[bool] = True
    emergency_contact_info: Optional[Dict[str, Any]] = None
    backup_access: Optional[bool] = True
    recovery_key_access: Optional[bool] = False
    api_key_management: Optional[bool] = True
    rate_limit_override: Optional[bool] = False
    appointment_notes: Optional[str] = None
    security_clearance_notes: Optional[str] = None


class SuperAdminProfileCreate(SuperAdminProfileBase):
    user_id: UUID


class SuperAdminProfileUpdate(SuperAdminProfileBase):
    pass


class SuperAdminProfile(SuperAdminProfileBase):
    id: UUID
    user_id: UUID
    last_system_change: Optional[datetime] = None
    critical_actions_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# SuperAdmin profile with user details
class SuperAdminProfileWithDetails(SuperAdminProfile):
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


# Base schemas for Admin Audit Log
class AdminAuditLogBase(BaseModel):
    action_type: str = Field(..., max_length=100)
    resource_type: Optional[str] = Field(None, max_length=100)
    resource_id: Optional[UUID] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = Field(None, max_length=500)
    session_id: Optional[str] = Field(None, max_length=100)
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    changes_summary: Optional[str] = None
    status: Optional[str] = Field("success", max_length=20)
    error_message: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class AdminAuditLogCreate(AdminAuditLogBase):
    admin_id: Optional[UUID] = None
    superadmin_id: Optional[UUID] = None


class AdminAuditLog(AdminAuditLogBase):
    id: UUID
    admin_id: Optional[UUID] = None
    superadmin_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Audit log with user details
class AdminAuditLogWithDetails(AdminAuditLog):
    admin_name: Optional[str] = None
    superadmin_name: Optional[str] = None

    class Config:
        from_attributes = True


# Base schemas for System Configuration
class SystemConfigurationBase(BaseModel):
    config_key: str = Field(..., max_length=100)
    config_value: Optional[Any] = None
    config_type: str = Field(..., max_length=50)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    is_sensitive: Optional[bool] = False
    is_public: Optional[bool] = False
    validation_rules: Optional[Dict[str, Any]] = None
    default_value: Optional[Any] = None
    is_active: Optional[bool] = True


class SystemConfigurationCreate(SystemConfigurationBase):
    pass


class SystemConfigurationUpdate(SystemConfigurationBase):
    config_key: Optional[str] = Field(None, max_length=100)
    config_type: Optional[str] = Field(None, max_length=50)


class SystemConfiguration(SystemConfigurationBase):
    id: UUID
    last_modified_by: Optional[UUID] = None
    last_modified_at: Optional[datetime] = None
    version: Optional[int] = 1
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# System configuration with modifier details
class SystemConfigurationWithDetails(SystemConfiguration):
    last_modified_by_name: Optional[str] = None

    class Config:
        from_attributes = True


# Base schemas for Admin Notification
class AdminNotificationBase(BaseModel):
    title: str = Field(..., max_length=200)
    message: str = Field(..., min_length=1)
    notification_type: str = Field(..., max_length=50)
    priority: Optional[str] = Field("medium", pattern="^(low|medium|high|critical)$")
    action_required: Optional[bool] = False
    action_url: Optional[str] = Field(None, max_length=500)
    action_data: Optional[Dict[str, Any]] = None
    expires_at: Optional[datetime] = None
    source_type: Optional[str] = Field(None, max_length=50)
    source_id: Optional[UUID] = None


class AdminNotificationCreate(AdminNotificationBase):
    admin_id: Optional[UUID] = None
    superadmin_id: Optional[UUID] = None


class AdminNotification(AdminNotificationBase):
    id: UUID
    admin_id: Optional[UUID] = None
    superadmin_id: Optional[UUID] = None
    is_read: Optional[bool] = False
    read_at: Optional[datetime] = None
    is_dismissed: Optional[bool] = False
    dismissed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Search and filter schemas
class AdminSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="Search in name, email, or employee ID")
    status: Optional[AdminStatus] = Field(None, description="Filter by admin status")
    department: Optional[str] = Field(None, description="Filter by department")
    admin_level: Optional[int] = Field(None, description="Filter by admin level")
    supervisor_id: Optional[UUID] = Field(None, description="Filter by supervisor")
    has_two_factor: Optional[bool] = Field(None, description="Filter by 2FA status")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|last_login|admin_level|user_name)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class AuditLogSearchFilters(BaseModel):
    admin_id: Optional[UUID] = Field(None, description="Filter by admin")
    action_type: Optional[str] = Field(None, description="Filter by action type")
    resource_type: Optional[str] = Field(None, description="Filter by resource type")
    status: Optional[str] = Field(None, description="Filter by status")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)
    
    # Sorting
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|action_type|status)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")


class SystemConfigSearchFilters(BaseModel):
    category: Optional[str] = Field(None, description="Filter by category")
    is_public: Optional[bool] = Field(None, description="Filter by public configs")
    is_active: Optional[bool] = Field(None, description="Filter by active configs")
    query: Optional[str] = Field(None, description="Search in key or description")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("config_key", pattern="^(config_key|category|last_modified_at)$")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$")


# Response schemas
class AdminListResponse(BaseModel):
    admins: List[AdminProfileWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class SuperAdminListResponse(BaseModel):
    superadmins: List[SuperAdminProfileWithDetails]
    total: int

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: List[AdminAuditLogWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class SystemConfigListResponse(BaseModel):
    configurations: List[SystemConfigurationWithDetails]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[AdminNotification]
    total: int
    unread_count: int

    class Config:
        from_attributes = True


# Action schemas
class UpdateAdminPermissionsRequest(BaseModel):
    permissions: List[str] = Field(..., description="List of permissions to grant")
    restricted_actions: Optional[List[str]] = Field(None, description="List of restricted actions")


class UpdateSystemConfigRequest(BaseModel):
    config_value: Any = Field(..., description="New configuration value")
    reason: Optional[str] = Field(None, description="Reason for the change")


class CreateAuditLogRequest(BaseModel):
    action_type: str = Field(..., description="Type of action performed")
    resource_type: Optional[str] = Field(None, description="Type of resource affected")
    resource_id: Optional[UUID] = Field(None, description="ID of affected resource")
    reason: Optional[str] = Field(None, description="Reason for the action")


class AdminLoginRequest(BaseModel):
    admin_id: UUID
    success: bool = True
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


# Statistics schemas
class AdminStats(BaseModel):
    total_admins: int
    active_admins: int
    inactive_admins: int
    suspended_admins: int
    admins_with_2fa: int
    recent_logins: int  # Last 24 hours
    failed_login_attempts: int  # Last 24 hours

    class Config:
        from_attributes = True


class SystemStats(BaseModel):
    total_configurations: int
    active_configurations: int
    public_configurations: int
    recent_changes: int  # Last 24 hours
    critical_notifications: int

    class Config:
        from_attributes = True