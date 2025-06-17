from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_admin_user, get_superadmin_user,
    get_pagination_params, PaginationParams,
    get_common_filters, CommonFilters
)
from app.services.admin import admin_service
from app.schemas.admin import (
    AdminProfileCreate, AdminProfileUpdate, AdminProfile, AdminProfileWithDetails,
    AdminSearchFilters, AdminListResponse,
    AdminAuditLog, AdminAuditLogCreate, AuditLogSearchFilters, AuditLogListResponse,
    SystemConfiguration, SystemConfigurationCreate, SystemConfigurationUpdate,
    SystemConfigSearchFilters, SystemConfigListResponse,
    AdminNotification, AdminNotificationCreate,
    UpdateAdminPermissionsRequest, UpdateSystemConfigRequest, CreateAuditLogRequest,
    AdminStats, SystemStats
)
from app.models.user import User
from app.models.enums import UserRole, AdminStatus, AdminRole, PermissionLevel

router = APIRouter()

# ============== ADMIN PROFILE MANAGEMENT ==============

@router.get("/users", response_model=AdminListResponse)
async def list_admin_users(
    # Search and filtering
    status: Optional[AdminStatus] = Query(None, description="Filter by admin status"),
    role: Optional[AdminRole] = Query(None, description="Filter by admin role"),
    department: Optional[str] = Query(None, description="Filter by department"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    List all admin users with filtering.
    Only admins and superadmins can view admin users.
    """
    try:
        # Build search filters
        search_filters = AdminSearchFilters(
            query=filters.q,
            status=status,
            role=role,
            department=department,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "created_at",
            sort_order=filters.sort_order
        )
        
        admins, total = admin_service.get_admins_with_search(
            db, filters=search_filters
        )
        
        return AdminListResponse(
            items=admins,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving admin users: {str(e)}"
        )

@router.post("/users", response_model=AdminProfile)
async def create_admin_user(
    admin_data: AdminProfileCreate,
    current_user: User = Depends(get_superadmin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new admin user.
    Only superadmins can create admin users.
    """
    try:
        admin = admin_service.create_admin_profile(
            db,
            admin_data=admin_data,
            created_by=current_user.id
        )
        return admin
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating admin user: {str(e)}"
        )

@router.get("/users/{admin_id}", response_model=AdminProfileWithDetails)
async def get_admin_user(
    admin_id: UUID = Path(..., description="Admin ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get admin user details by ID.
    Admins can view admin user details.
    """
    try:
        admin = admin_service.get_admin_with_details(db, id=admin_id)
        if not admin:
            raise HTTPException(
                status_code=404,
                detail="Admin user not found"
            )
        
        return admin
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving admin user: {str(e)}"
        )

@router.put("/users/{admin_id}", response_model=AdminProfile)
async def update_admin_user(
    admin_update: AdminProfileUpdate,
    admin_id: UUID = Path(..., description="Admin ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update admin user profile.
    Admins can update admin profiles.
    """
    try:
        updated_admin = admin_service.update_admin_profile(
            db,
            admin_id=admin_id,
            update_data=admin_update,
            updated_by=current_user.id
        )
        if not updated_admin:
            raise HTTPException(
                status_code=404,
                detail="Admin user not found"
            )
        return updated_admin
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating admin user: {str(e)}"
        )

@router.delete("/users/{admin_id}")
async def delete_admin_user(
    admin_id: UUID = Path(..., description="Admin ID"),
    current_user: User = Depends(get_superadmin_user),
    db: Session = Depends(get_database)
):
    """
    Delete an admin user.
    Only superadmins can delete admin users.
    """
    try:
        success = admin_service.delete_admin_profile(
            db,
            admin_id=admin_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Admin user not found"
            )
        return {"message": "Admin user deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting admin user: {str(e)}"
        )

@router.put("/users/{admin_id}/permissions")
async def update_admin_permissions(
    permissions_update: UpdateAdminPermissionsRequest,
    admin_id: UUID = Path(..., description="Admin ID"),
    current_user: User = Depends(get_superadmin_user),
    db: Session = Depends(get_database)
):
    """
    Update admin user permissions.
    Only superadmins can update admin permissions.
    """
    try:
        success = admin_service.update_admin_permissions(
            db,
            admin_id=admin_id,
            permissions=permissions_update.permissions,
            role=permissions_update.role,
            updated_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Admin user not found"
            )
        return {"message": "Admin permissions updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating admin permissions: {str(e)}"
        )

# ============== SYSTEM STATISTICS ==============

@router.get("/system-stats", response_model=SystemStats)
async def get_system_statistics(
    start_date: Optional[str] = Query(None, description="Start date for statistics"),
    end_date: Optional[str] = Query(None, description="End date for statistics"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get comprehensive system statistics.
    Admins and superadmins can view system statistics.
    """
    try:
        stats = admin_service.get_system_statistics(
            db,
            start_date=start_date,
            end_date=end_date
        )
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving system statistics: {str(e)}"
        )

# ============== AUDIT LOGS ==============

@router.get("/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    # Filtering
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get system audit logs with filtering.
    Admins and superadmins can view audit logs.
    """
    try:
        # Build search filters
        search_filters = AuditLogSearchFilters(
            action_type=action_type,
            user_id=user_id,
            status=status,
            ip_address=ip_address,
            start_date=filters.created_after,
            end_date=filters.created_before,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "created_at",
            sort_order=filters.sort_order
        )
        
        logs, total = admin_service.get_audit_logs_with_search(
            db, filters=search_filters
        )
        
        return AuditLogListResponse(
            items=logs,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving audit logs: {str(e)}"
        )

@router.post("/audit-logs", response_model=AdminAuditLog)
async def create_audit_log(
    log_data: CreateAuditLogRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new audit log entry.
    Admins can create audit log entries.
    """
    try:
        log = admin_service.create_audit_log(
            db,
            admin_id=current_user.admin_profile.id,
            action_type=log_data.action_type,
            details=log_data.details,
            ip_address=log_data.ip_address,
            user_agent=log_data.user_agent,
            status=log_data.status
        )
        return log
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating audit log: {str(e)}"
        )

# ============== SYSTEM CONFIGURATION ==============

@router.get("/settings", response_model=SystemConfigListResponse)
async def get_system_settings(
    category: Optional[str] = Query(None, description="Filter by configuration category"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get system configuration settings.
    Admins and superadmins can view system settings.
    """
    try:
        search_filters = SystemConfigSearchFilters(
            category=category,
            is_active=is_active,
            page=pagination.page,
            page_size=pagination.page_size
        )
        
        configs, total = admin_service.get_system_configurations(
            db, filters=search_filters
        )
        
        return SystemConfigListResponse(
            items=configs,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving system settings: {str(e)}"
        )

@router.put("/settings", response_model=List[SystemConfiguration])
async def update_system_settings(
    settings_update: UpdateSystemConfigRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update system configuration settings.
    Admins can update system settings.
    """
    try:
        updated_configs = admin_service.update_system_configurations(
            db,
            configurations=settings_update.configurations,
            updated_by=current_user.id
        )
        return updated_configs
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating system settings: {str(e)}"
        )

@router.get("/settings/{config_id}", response_model=SystemConfiguration)
async def get_system_setting(
    config_id: UUID = Path(..., description="Configuration ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get a specific system configuration setting.
    Admins can view system configuration settings.
    """
    try:
        config = admin_service.get_system_configuration(db, id=config_id)
        if not config:
            raise HTTPException(
                status_code=404,
                detail="Configuration setting not found"
            )
        return config
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving configuration setting: {str(e)}"
        )

# ============== ADMIN NOTIFICATIONS ==============

@router.get("/notifications", response_model=List[AdminNotification])
async def get_admin_notifications(
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get admin notifications.
    Admins can view their own notifications.
    """
    try:
        notifications = admin_service.get_admin_notifications(
            db,
            admin_id=current_user.admin_profile.id,
            is_read=is_read,
            priority=priority,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        return notifications
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving admin notifications: {str(e)}"
        )

@router.post("/notifications", response_model=AdminNotification)
async def create_admin_notification(
    notification_data: AdminNotificationCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new admin notification.
    Admins can create notifications.
    """
    try:
        notification = admin_service.create_admin_notification(
            db,
            notification_data=notification_data,
            created_by=current_user.id
        )
        return notification
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating admin notification: {str(e)}"
        )

@router.put("/notifications/{notification_id}")
async def mark_notification_as_read(
    notification_id: UUID = Path(..., description="Notification ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Mark an admin notification as read.
    Admins can mark their own notifications as read.
    """
    try:
        success = admin_service.mark_notification_as_read(
            db,
            notification_id=notification_id,
            admin_id=current_user.admin_profile.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )
        return {"message": "Notification marked as read"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking notification as read: {str(e)}"
        )

@router.delete("/notifications/{notification_id}")
async def delete_admin_notification(
    notification_id: UUID = Path(..., description="Notification ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete an admin notification.
    Admins can delete notifications.
    """
    try:
        success = admin_service.delete_admin_notification(
            db,
            notification_id=notification_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )
        return {"message": "Notification deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting notification: {str(e)}"
        )

# ============== SYSTEM MANAGEMENT ==============

@router.post("/backup")
async def create_system_backup(
    backup_type: str = Query("full", description="Type of backup (full, incremental)"),
    current_user: User = Depends(get_superadmin_user),
    db: Session = Depends(get_database)
):
    """
    Create a system backup.
    Only superadmins can create system backups.
    """
    try:
        backup_info = admin_service.create_system_backup(
            db,
            backup_type=backup_type,
            initiated_by=current_user.id
        )
        return backup_info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating system backup: {str(e)}"
        )

@router.post("/maintenance-mode")
async def toggle_maintenance_mode(
    enabled: bool = Query(..., description="Enable or disable maintenance mode"),
    message: Optional[str] = Query(None, description="Maintenance message"),
    current_user: User = Depends(get_superadmin_user),
    db: Session = Depends(get_database)
):
    """
    Toggle system maintenance mode.
    Only superadmins can toggle maintenance mode.
    """
    try:
        result = admin_service.toggle_maintenance_mode(
            db,
            enabled=enabled,
            message=message,
            updated_by=current_user.id
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error toggling maintenance mode: {str(e)}"
        )

@router.get("/performance")
async def get_system_performance_metrics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get system performance metrics.
    Admins and superadmins can view performance metrics.
    """
    try:
        metrics = admin_service.get_system_performance_metrics(db)
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving performance metrics: {str(e)}"
        )