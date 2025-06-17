from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.admin import (
    AdminProfile, SuperAdminProfile, AdminAuditLog, 
    SystemConfiguration, AdminNotification, AdminStatus
)
from app.models.user import User
from app.schemas.admin import (
    AdminProfileCreate, AdminProfileUpdate,
    SuperAdminProfileCreate, SuperAdminProfileUpdate,
    AdminAuditLogCreate, SystemConfigurationCreate, SystemConfigurationUpdate,
    AdminNotificationCreate
)


class CRUDAdminProfile(CRUDBase[AdminProfile, AdminProfileCreate, AdminProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> Optional[AdminProfile]:
        """Get admin profile by user ID"""
        return db.query(AdminProfile)\
            .options(joinedload(AdminProfile.user))\
            .filter(AdminProfile.user_id == user_id)\
            .first()
    
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[AdminProfile]:
        """Get admin profile with all related data"""
        return db.query(AdminProfile)\
            .options(
                joinedload(AdminProfile.user),
                joinedload(AdminProfile.supervisor),
                selectinload(AdminProfile.supervised_admins)
            )\
            .filter(AdminProfile.id == id)\
            .first()
    
    def get_by_status(self, db: Session, *, status: AdminStatus, skip: int = 0, limit: int = 100) -> List[AdminProfile]:
        """Get admin profiles by status"""
        return db.query(AdminProfile)\
            .options(joinedload(AdminProfile.user))\
            .filter(AdminProfile.status == status)\
            .order_by(desc(AdminProfile.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_level(self, db: Session, *, min_level: int, max_level: int = None, skip: int = 0, limit: int = 100) -> List[AdminProfile]:
        """Get admin profiles by access level"""
        query = db.query(AdminProfile)\
            .options(joinedload(AdminProfile.user))\
            .filter(AdminProfile.admin_level >= min_level)
        
        if max_level:
            query = query.filter(AdminProfile.admin_level <= max_level)
        
        return query.order_by(desc(AdminProfile.admin_level))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def update_login_info(self, db: Session, *, admin_id: UUID, success: bool = True) -> Optional[AdminProfile]:
        """Update admin login information"""
        admin = self.get(db, id=admin_id)
        if not admin:
            return None
        
        if success:
            admin.last_login = datetime.utcnow()
            admin.login_count = (admin.login_count or 0) + 1
            admin.failed_login_attempts = 0
        else:
            admin.failed_login_attempts = (admin.failed_login_attempts or 0) + 1
            admin.last_failed_login = datetime.utcnow()
        
        db.commit()
        db.refresh(admin)
        return admin
    
    def get_supervised_admins(self, db: Session, *, supervisor_id: UUID) -> List[AdminProfile]:
        """Get admins supervised by a specific admin"""
        return db.query(AdminProfile)\
            .options(joinedload(AdminProfile.user))\
            .filter(AdminProfile.supervisor_id == supervisor_id)\
            .order_by(asc(AdminProfile.admin_level))\
            .all()
    
    def check_permissions(self, db: Session, *, admin_id: UUID, required_permissions: List[str]) -> bool:
        """Check if admin has required permissions"""
        admin = self.get(db, id=admin_id)
        if not admin or admin.status != AdminStatus.ACTIVE:
            return False
        
        admin_permissions = admin.permissions or []
        return all(perm in admin_permissions for perm in required_permissions)


class CRUDSuperAdminProfile(CRUDBase[SuperAdminProfile, SuperAdminProfileCreate, SuperAdminProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> Optional[SuperAdminProfile]:
        """Get superadmin profile by user ID"""
        return db.query(SuperAdminProfile)\
            .options(joinedload(SuperAdminProfile.user))\
            .filter(SuperAdminProfile.user_id == user_id)\
            .first()
    
    def get_with_highest_access(self, db: Session) -> List[SuperAdminProfile]:
        """Get superadmins with highest access levels"""
        return db.query(SuperAdminProfile)\
            .options(joinedload(SuperAdminProfile.user))\
            .order_by(desc(SuperAdminProfile.access_level))\
            .all()
    
    def update_system_access(self, db: Session, *, superadmin_id: UUID) -> Optional[SuperAdminProfile]:
        """Update last system change timestamp"""
        superadmin = self.get(db, id=superadmin_id)
        if superadmin:
            superadmin.last_system_change = datetime.utcnow()
            superadmin.critical_actions_count = (superadmin.critical_actions_count or 0) + 1
            db.commit()
            db.refresh(superadmin)
        return superadmin
    
    def check_emergency_access(self, db: Session, *, user_id: UUID) -> bool:
        """Check if user has emergency access"""
        superadmin = self.get_by_user_id(db, user_id=user_id)
        return superadmin and superadmin.emergency_access_enabled


class CRUDAdminAuditLog(CRUDBase[AdminAuditLog, AdminAuditLogCreate, dict]):
    def create_log_entry(
        self, 
        db: Session, 
        *, 
        admin_id: Optional[UUID] = None,
        superadmin_id: Optional[UUID] = None,
        action_type: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[UUID] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "success",
        error_message: Optional[str] = None,
        reason: Optional[str] = None
    ) -> AdminAuditLog:
        """Create audit log entry"""
        log_entry = AdminAuditLog(
            admin_id=admin_id,
            superadmin_id=superadmin_id,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status,
            error_message=error_message,
            reason=reason
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    
    def get_by_admin(self, db: Session, *, admin_id: UUID, skip: int = 0, limit: int = 100) -> List[AdminAuditLog]:
        """Get audit logs for an admin"""
        return db.query(AdminAuditLog)\
            .filter(AdminAuditLog.admin_id == admin_id)\
            .order_by(desc(AdminAuditLog.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_action_type(self, db: Session, *, action_type: str, skip: int = 0, limit: int = 100) -> List[AdminAuditLog]:
        """Get audit logs by action type"""
        return db.query(AdminAuditLog)\
            .filter(AdminAuditLog.action_type == action_type)\
            .order_by(desc(AdminAuditLog.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_failed_actions(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[AdminAuditLog]:
        """Get failed action attempts"""
        return db.query(AdminAuditLog)\
            .filter(AdminAuditLog.status == "failed")\
            .order_by(desc(AdminAuditLog.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_critical_actions(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[AdminAuditLog]:
        """Get critical system actions"""
        critical_actions = ["delete_user", "system_config_change", "emergency_access", "backup_restore"]
        return db.query(AdminAuditLog)\
            .filter(AdminAuditLog.action_type.in_(critical_actions))\
            .order_by(desc(AdminAuditLog.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()


class CRUDSystemConfiguration(CRUDBase[SystemConfiguration, SystemConfigurationCreate, SystemConfigurationUpdate]):
    def get_by_key(self, db: Session, *, config_key: str) -> Optional[SystemConfiguration]:
        """Get configuration by key"""
        return db.query(SystemConfiguration)\
            .filter(SystemConfiguration.config_key == config_key)\
            .first()
    
    def get_by_category(self, db: Session, *, category: str) -> List[SystemConfiguration]:
        """Get configurations by category"""
        return db.query(SystemConfiguration)\
            .filter(SystemConfiguration.category == category)\
            .order_by(asc(SystemConfiguration.config_key))\
            .all()
    
    def get_public_configs(self, db: Session) -> List[SystemConfiguration]:
        """Get public configurations"""
        return db.query(SystemConfiguration)\
            .filter(
                and_(
                    SystemConfiguration.is_public == True,
                    SystemConfiguration.is_active == True
                )
            )\
            .order_by(asc(SystemConfiguration.config_key))\
            .all()
    
    def update_config(
        self, 
        db: Session, 
        *, 
        config_key: str, 
        config_value: Any,
        modified_by: UUID
    ) -> Optional[SystemConfiguration]:
        """Update configuration value"""
        config = self.get_by_key(db, config_key=config_key)
        if not config:
            return None
        
        config.config_value = config_value
        config.last_modified_by = modified_by
        config.last_modified_at = datetime.utcnow()
        config.version = (config.version or 0) + 1
        
        db.commit()
        db.refresh(config)
        return config


class CRUDAdminNotification(CRUDBase[AdminNotification, AdminNotificationCreate, dict]):
    def get_for_admin(self, db: Session, *, admin_id: UUID, include_read: bool = False) -> List[AdminNotification]:
        """Get notifications for admin"""
        query = db.query(AdminNotification)\
            .filter(AdminNotification.admin_id == admin_id)
        
        if not include_read:
            query = query.filter(AdminNotification.is_read == False)
        
        return query.order_by(desc(AdminNotification.created_at))\
            .all()
    
    def get_for_superadmin(self, db: Session, *, superadmin_id: UUID, include_read: bool = False) -> List[AdminNotification]:
        """Get notifications for superadmin"""
        query = db.query(AdminNotification)\
            .filter(AdminNotification.superadmin_id == superadmin_id)
        
        if not include_read:
            query = query.filter(AdminNotification.is_read == False)
        
        return query.order_by(desc(AdminNotification.created_at))\
            .all()
    
    def mark_as_read(self, db: Session, *, notification_id: UUID) -> Optional[AdminNotification]:
        """Mark notification as read"""
        notification = self.get(db, id=notification_id)
        if notification:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        return notification
    
    def dismiss_notification(self, db: Session, *, notification_id: UUID) -> Optional[AdminNotification]:
        """Dismiss notification"""
        notification = self.get(db, id=notification_id)
        if notification:
            notification.is_dismissed = True
            notification.dismissed_at = datetime.utcnow()
            db.commit()
            db.refresh(notification)
        return notification
    
    def get_critical_notifications(self, db: Session) -> List[AdminNotification]:
        """Get critical unread notifications"""
        return db.query(AdminNotification)\
            .filter(
                and_(
                    AdminNotification.priority == "critical",
                    AdminNotification.is_read == False,
                    AdminNotification.is_dismissed == False
                )
            )\
            .order_by(desc(AdminNotification.created_at))\
            .all()


# Create CRUD instances
admin_profile = CRUDAdminProfile(AdminProfile)
superadmin_profile = CRUDSuperAdminProfile(SuperAdminProfile)
admin_audit_log = CRUDAdminAuditLog(AdminAuditLog)
system_configuration = CRUDSystemConfiguration(SystemConfiguration)
admin_notification = CRUDAdminNotification(AdminNotification)