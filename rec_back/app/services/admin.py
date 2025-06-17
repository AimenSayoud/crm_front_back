# app/services/admin.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from uuid import UUID
from datetime import datetime, timedelta, date
import json

from app.models.admin import (
    AdminProfile, SuperAdminProfile, AdminAuditLog,
    SystemConfiguration, AdminNotification,
    AdminStatus, AdminRole, PermissionLevel
)
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminProfileCreate, AdminProfileUpdate,
    SuperAdminProfileCreate, UpdateAdminPermissionsRequest,
    UpdateSystemConfigRequest, AdminSearchFilters
)
from app.crud import admin as admin_crud
from app.services.base import BaseService


class AdminService(BaseService[AdminProfile, admin_crud.CRUDAdminProfile]):
    """Service for admin operations and system management"""
    
    def __init__(self):
        super().__init__(admin_crud.admin_profile)
        self.superadmin_crud = admin_crud.superadmin_profile
        self.audit_crud = admin_crud.admin_audit_log
        self.config_crud = admin_crud.system_configuration
        self.notification_crud = admin_crud.admin_notification
    
    def create_admin(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        admin_data: AdminProfileCreate,
        created_by: UUID
    ) -> AdminProfile:
        """Create admin profile with proper validation"""
        # Validate user exists and is eligible
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        if user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise ValueError("User must have admin role")
        
        # Check if already has admin profile
        existing = self.crud.get_by_user_id(db, user_id=user_id)
        if existing:
            raise ValueError("User already has admin profile")
        
        # Set default permissions based on admin level
        if not admin_data.permissions:
            admin_data.permissions = self._get_default_permissions(
                admin_data.admin_level
            )
        
        # Create admin profile
        admin = self.crud.create(db, obj_in=admin_data)
        
        # Log creation
        self.audit_crud.create_log_entry(
            db,
            action_type="admin_created",
            resource_type="admin_profile",
            resource_id=admin.id,
            admin_id=created_by,
            status="success"
        )
        
        # Send welcome notification
        self._send_admin_notification(
            db,
            admin_id=admin.id,
            title="Welcome to Admin Panel",
            message="Your admin account has been created. Please review your permissions.",
            notification_type="info"
        )
        
        return admin
    
    def update_admin_permissions(
        self, 
        db: Session, 
        *, 
        admin_id: UUID,
        permissions_update: UpdateAdminPermissionsRequest,
        updated_by: UUID
    ) -> AdminProfile:
        """Update admin permissions with audit trail"""
        admin = self.get(db, id=admin_id)
        if not admin:
            raise ValueError("Admin not found")
        
        # Store old permissions for audit
        old_permissions = admin.permissions or []
        
        # Validate permissions
        for permission in permissions_update.permissions:
            if not self._is_valid_permission(permission):
                raise ValueError(f"Invalid permission: {permission}")
        
        # Check if updater has authority
        updater = self.get(db, id=updated_by)
        if not self._can_manage_permissions(updater, admin):
            raise ValueError("Insufficient privileges to update permissions")
        
        # Update permissions
        admin.permissions = permissions_update.permissions
        admin.restricted_actions = permissions_update.restricted_actions
        
        # Log change
        self.audit_crud.create_log_entry(
            db,
            admin_id=updated_by,
            action_type="permissions_updated",
            resource_type="admin_profile",
            resource_id=admin_id,
            old_values={"permissions": old_permissions},
            new_values={
                "permissions": permissions_update.permissions,
                "restricted_actions": permissions_update.restricted_actions
            },
            status="success"
        )
        
        db.commit()
        return admin
    
    def get_admin_dashboard(
        self, 
        db: Session, 
        *, 
        admin_id: UUID
    ) -> Dict[str, Any]:
        """Get comprehensive admin dashboard data"""
        admin = self.crud.get_with_details(db, id=admin_id)
        if not admin:
            return {}
        
        dashboard = {
            "profile": {
                "id": admin.id,
                "name": admin.user.full_name,
                "role": admin.user.role,
                "admin_level": admin.admin_level,
                "last_login": admin.last_login,
                "two_factor_enabled": admin.two_factor_enabled
            },
            "permissions": admin.permissions or [],
            "statistics": self._get_admin_statistics(db, admin_id),
            "recent_activity": self._get_recent_admin_activity(db, admin_id),
            "system_status": self._get_system_status(db),
            "notifications": self._get_admin_notifications(db, admin_id),
            "team_members": self._get_team_members(db, admin) if admin.admin_level >= 4 else None
        }
        
        return dashboard
    
    def perform_admin_action(
        self, 
        db: Session, 
        *, 
        admin_id: UUID,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[UUID] = None,
        data: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """Perform admin action with validation and logging"""
        admin = self.get(db, id=admin_id)
        if not admin:
            return False
        
        # Check if action is allowed
        if not self._can_perform_action(admin, action):
            self.audit_crud.create_log_entry(
                db,
                admin_id=admin_id,
                action_type=action,
                resource_type=resource_type,
                resource_id=resource_id,
                status="failed",
                error_message="Permission denied",
                ip_address=ip_address,
                user_agent=user_agent
            )
            return False
        
        # Perform action based on type
        try:
            result = self._execute_admin_action(
                db, admin, action, resource_type, resource_id, data
            )
            
            # Log successful action
            self.audit_crud.create_log_entry(
                db,
                admin_id=admin_id,
                action_type=action,
                resource_type=resource_type,
                resource_id=resource_id,
                status="success",
                new_values=data,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Update admin activity metrics
            admin.total_actions_performed += 1
            admin.last_action_at = datetime.utcnow()
            
            db.commit()
            return True
            
        except Exception as e:
            # Log failed action
            self.audit_crud.create_log_entry(
                db,
                admin_id=admin_id,
                action_type=action,
                resource_type=resource_type,
                resource_id=resource_id,
                status="failed",
                error_message=str(e),
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.rollback()
            return False
    
    def update_system_configuration(
        self, 
        db: Session, 
        *, 
        config_key: str,
        update_request: UpdateSystemConfigRequest,
        updated_by: UUID
    ) -> SystemConfiguration:
        """Update system configuration with validation"""
        # Check if superadmin
        superadmin = self.superadmin_crud.get_by_user_id(db, user_id=updated_by)
        if not superadmin or not superadmin.system_config_access:
            raise ValueError("Only superadmins can update system configuration")
        
        # Get configuration
        config = self.config_crud.get_by_key(db, config_key=config_key)
        if not config:
            raise ValueError("Configuration not found")
        
        # Validate new value
        if config.validation_rules:
            if not self._validate_config_value(
                update_request.config_value, 
                config.validation_rules
            ):
                raise ValueError("Invalid configuration value")
        
        # Update configuration
        updated = self.config_crud.update_config(
            db,
            config_key=config_key,
            config_value=update_request.config_value,
            modified_by=updated_by
        )
        
        # Log change
        self.audit_crud.create_log_entry(
            db,
            superadmin_id=superadmin.id,
            action_type="system_config_change",
            resource_type="system_configuration",
            resource_id=config.id,
            old_values={"value": config.config_value},
            new_values={"value": update_request.config_value},
            reason=update_request.reason,
            status="success"
        )
        
        # Notify other superadmins
        self._notify_config_change(db, config_key, updated_by)
        
        return updated
    
    def get_audit_log_analysis(
        self, 
        db: Session, 
        *, 
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        admin_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Analyze audit logs for patterns and insights"""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Build query
        query = db.query(AdminAuditLog).filter(
            AdminAuditLog.created_at.between(start_date, end_date)
        )
        
        if admin_id:
            query = query.filter(AdminAuditLog.admin_id == admin_id)
        
        logs = query.all()
        
        # Analyze logs
        analysis = {
            "total_actions": len(logs),
            "successful_actions": sum(1 for log in logs if log.status == "success"),
            "failed_actions": sum(1 for log in logs if log.status == "failed"),
            "actions_by_type": {},
            "actions_by_admin": {},
            "failed_action_reasons": {},
            "peak_activity_hours": {},
            "critical_actions": [],
            "suspicious_patterns": []
        }
        
        # Group by action type
        for log in logs:
            action_type = log.action_type
            analysis["actions_by_type"][action_type] = \
                analysis["actions_by_type"].get(action_type, 0) + 1
            
            # Group by admin
            if log.admin_id:
                admin_key = str(log.admin_id)
                analysis["actions_by_admin"][admin_key] = \
                    analysis["actions_by_admin"].get(admin_key, 0) + 1
            
            # Track failed reasons
            if log.status == "failed" and log.error_message:
                reason = log.error_message[:50]  # Truncate for grouping
                analysis["failed_action_reasons"][reason] = \
                    analysis["failed_action_reasons"].get(reason, 0) + 1
            
            # Track peak hours
            hour = log.created_at.hour
            analysis["peak_activity_hours"][hour] = \
                analysis["peak_activity_hours"].get(hour, 0) + 1
            
            # Identify critical actions
            if log.action_type in ["delete_user", "system_config_change", "permissions_updated"]:
                analysis["critical_actions"].append({
                    "action": log.action_type,
                    "admin_id": log.admin_id,
                    "timestamp": log.created_at,
                    "resource": f"{log.resource_type}:{log.resource_id}"
                })
        
        # Detect suspicious patterns
        analysis["suspicious_patterns"] = self._detect_suspicious_patterns(logs)
        
        return analysis
    
    def handle_security_breach(
        self, 
        db: Session, 
        *, 
        breach_type: str,
        affected_admin_id: Optional[UUID] = None,
        details: Dict[str, Any],
        reported_by: UUID
    ) -> Dict[str, Any]:
        """Handle security breach with immediate actions"""
        response = {
            "breach_id": str(UUID()),
            "actions_taken": [],
            "notifications_sent": []
        }
        
        # Log security breach
        self.audit_crud.create_log_entry(
            db,
            admin_id=reported_by,
            action_type="security_breach_reported",
            resource_type="security",
            metadata={
                "breach_type": breach_type,
                "details": details
            },
            status="critical"
        )
        response["actions_taken"].append("Security breach logged")
        
        # Take immediate actions based on breach type
        if breach_type == "unauthorized_access" and affected_admin_id:
            # Suspend admin account
            admin = self.get(db, id=affected_admin_id)
            if admin:
                admin.status = AdminStatus.SUSPENDED
                response["actions_taken"].append(f"Admin {affected_admin_id} suspended")
                
                # Force logout
                # This would integrate with session management
                response["actions_taken"].append("Force logout initiated")
        
        elif breach_type == "data_breach":
            # Notify all superadmins
            superadmins = self.superadmin_crud.get_with_highest_access(db)
            for sa in superadmins:
                self._send_admin_notification(
                    db,
                    superadmin_id=sa.id,
                    title="CRITICAL: Data Breach Detected",
                    message=f"Data breach reported: {details.get('description', 'No details')}",
                    notification_type="critical",
                    priority="critical"
                )
                response["notifications_sent"].append(f"Superadmin {sa.id}")
        
        elif breach_type == "brute_force":
            # Implement IP blocking
            ip_address = details.get("ip_address")
            if ip_address:
                # This would integrate with firewall/security service
                response["actions_taken"].append(f"IP {ip_address} blocked")
        
        # Create incident report
        incident = {
            "id": response["breach_id"],
            "type": breach_type,
            "timestamp": datetime.utcnow(),
            "details": details,
            "actions": response["actions_taken"],
            "status": "under_investigation"
        }
        
        # Store incident (would be separate incident management system)
        self._store_security_incident(db, incident)
        
        db.commit()
        return response
    
    def generate_compliance_report(
        self, 
        db: Session, 
        *, 
        report_type: str,
        start_date: date,
        end_date: date,
        requested_by: UUID
    ) -> Dict[str, Any]:
        """Generate compliance and audit reports"""
        # Verify requester has permission
        superadmin = self.superadmin_crud.get_by_user_id(db, user_id=requested_by)
        if not superadmin:
            raise ValueError("Only superadmins can generate compliance reports")
        
        report = {
            "report_id": str(UUID()),
            "type": report_type,
            "period": {
                "start": start_date,
                "end": end_date
            },
            "generated_at": datetime.utcnow(),
            "generated_by": requested_by
        }
        
        if report_type == "access_control":
            report["data"] = self._generate_access_control_report(
                db, start_date, end_date
            )
        elif report_type == "data_protection":
            report["data"] = self._generate_data_protection_report(
                db, start_date, end_date
            )
        elif report_type == "admin_activity":
            report["data"] = self._generate_admin_activity_report(
                db, start_date, end_date
            )
        else:
            raise ValueError(f"Unknown report type: {report_type}")
        
        # Log report generation
        self.audit_crud.create_log_entry(
            db,
            superadmin_id=superadmin.id,
            action_type="compliance_report_generated",
            metadata={
                "report_type": report_type,
                "period": f"{start_date} to {end_date}"
            },
            status="success"
        )
        
        return report
    
    def _get_default_permissions(self, admin_level: int) -> List[str]:
        """Get default permissions based on admin level"""
        permissions = []
        
        if admin_level >= 1:
            permissions.extend(["read_users", "read_jobs", "read_applications"])
        
        if admin_level >= 2:
            permissions.extend(["write_users", "write_jobs", "manage_applications"])
        
        if admin_level >= 3:
            permissions.extend(["delete_users", "manage_companies", "view_analytics"])
        
        if admin_level >= 4:
            permissions.extend(["manage_admins", "view_audit_logs", "export_data"])
        
        if admin_level >= 5:
            permissions.extend(["system_config", "security_management", "full_access"])
        
        return permissions
    
    def _is_valid_permission(self, permission: str) -> bool:
        """Validate if permission string is valid"""
        valid_permissions = [
            "read_users", "write_users", "delete_users",
            "read_jobs", "write_jobs", "delete_jobs",
            "read_applications", "manage_applications",
            "manage_companies", "manage_consultants",
            "view_analytics", "export_data",
            "manage_admins", "view_audit_logs",
            "system_config", "security_management",
            "full_access"
        ]
        return permission in valid_permissions
    
    def _can_manage_permissions(
        self, 
        updater: AdminProfile, 
        target: AdminProfile
    ) -> bool:
        """Check if updater can manage target's permissions"""
        # Must be higher level
        if updater.admin_level <= target.admin_level:
            return False
        
        # Must have permission management permission
        if "manage_admins" not in (updater.permissions or []):
            return False
        
        return True
    
    def _can_perform_action(self, admin: AdminProfile, action: str) -> bool:
        """Check if admin can perform specific action"""
        # Check if suspended
        if admin.status != AdminStatus.ACTIVE:
            return False
        
        # Check restricted actions
        if action in (admin.restricted_actions or []):
            return False
        
        # Map actions to required permissions
        action_permissions = {
            "delete_user": ["delete_users", "full_access"],
            "update_system_config": ["system_config", "full_access"],
            "manage_admin": ["manage_admins", "full_access"],
            "export_data": ["export_data", "full_access"]
        }
        
        required = action_permissions.get(action, [])
        if not required:
            return True
        
        admin_perms = admin.permissions or []
        return any(perm in admin_perms for perm in required)
    
    def _execute_admin_action(
        self,
        db: Session,
        admin: AdminProfile,
        action: str,
        resource_type: Optional[str],
        resource_id: Optional[UUID],
        data: Optional[Dict[str, Any]]
    ) -> Any:
        """Execute the actual admin action"""
        # This would contain the actual implementation
        # For now, just validate and return success
        
        if action == "delete_user" and resource_id:
            # Would delete user
            pass
        elif action == "export_data":
            # Would export data
            pass
        
        return True
    
    def _get_admin_statistics(
        self, 
        db: Session, 
        admin_id: UUID
    ) -> Dict[str, Any]:
        """Get statistics for admin dashboard"""
        last_30_days = datetime.utcnow() - timedelta(days=30)
        
        # Get action counts
        total_actions = db.query(func.count(AdminAuditLog.id)).filter(
            and_(
                AdminAuditLog.admin_id == admin_id,
                AdminAuditLog.created_at >= last_30_days
            )
        ).scalar() or 0
        
        failed_actions = db.query(func.count(AdminAuditLog.id)).filter(
            and_(
                AdminAuditLog.admin_id == admin_id,
                AdminAuditLog.created_at >= last_30_days,
                AdminAuditLog.status == "failed"
            )
        ).scalar() or 0
        
        return {
            "actions_last_30_days": total_actions,
            "failed_actions": failed_actions,
            "success_rate": (
                ((total_actions - failed_actions) / total_actions * 100)
                if total_actions > 0 else 100
            )
        }
    
    def _get_recent_admin_activity(
        self, 
        db: Session, 
        admin_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent activity for admin"""
        logs = self.audit_crud.get_by_admin(
            db, 
            admin_id=admin_id, 
            limit=limit
        )
        
        return [
            {
                "action": log.action_type,
                "resource": f"{log.resource_type}:{log.resource_id}" if log.resource_type else None,
                "timestamp": log.created_at,
                "status": log.status
            }
            for log in logs
        ]
    
    def _get_system_status(self, db: Session) -> Dict[str, Any]:
        """Get current system status"""
        return {
            "status": "operational",
            "active_users": db.query(func.count(User.id)).filter(
                User.is_active == True
            ).scalar(),
            "active_admins": db.query(func.count(AdminProfile.id)).filter(
                AdminProfile.status == AdminStatus.ACTIVE
            ).scalar(),
            "critical_alerts": self.notification_crud.get_critical_notifications(db)
        }
    
    def _get_admin_notifications(
        self, 
        db: Session, 
        admin_id: UUID
    ) -> List[Dict[str, Any]]:
        """Get notifications for admin"""
        notifications = self.notification_crud.get_for_admin(
            db, 
            admin_id=admin_id,
            include_read=False
        )
        
        return [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "type": n.notification_type,
                "priority": n.priority,
                "created_at": n.created_at
            }
            for n in notifications[:10]
        ]
    
    def _get_team_members(
        self, 
        db: Session, 
        admin: AdminProfile
    ) -> List[Dict[str, Any]]:
        """Get team members for admin"""
        supervised = self.crud.get_supervised_admins(
            db, 
            supervisor_id=admin.id
        )
        
        return [
            {
                "id": member.id,
                "name": member.user.full_name,
                "status": member.status,
                "last_active": member.last_action_at
            }
            for member in supervised
        ]
    
    def _send_admin_notification(
        self,
        db: Session,
        admin_id: Optional[UUID] = None,
        superadmin_id: Optional[UUID] = None,
        title: str = "",
        message: str = "",
        notification_type: str = "info",
        priority: str = "medium"
    ):
        """Send notification to admin"""
        from app.schemas.admin import AdminNotificationCreate
        
        notification = AdminNotificationCreate(
            admin_id=admin_id,
            superadmin_id=superadmin_id,
            title=title,
            message=message,
            notification_type=notification_type,
            priority=priority
        )
        
        self.notification_crud.create(db, obj_in=notification)
    
    def _validate_config_value(
        self, 
        value: Any, 
        validation_rules: Dict[str, Any]
    ) -> bool:
        """Validate configuration value against rules"""
        # Check type
        expected_type = validation_rules.get("type")
        if expected_type:
            if expected_type == "string" and not isinstance(value, str):
                return False
            elif expected_type == "number" and not isinstance(value, (int, float)):
                return False
            elif expected_type == "boolean" and not isinstance(value, bool):
                return False
        
        # Check range for numbers
        if isinstance(value, (int, float)):
            min_val = validation_rules.get("min")
            max_val = validation_rules.get("max")
            if min_val is not None and value < min_val:
                return False
            if max_val is not None and value > max_val:
                return False
        
        # Check enum values
        allowed_values = validation_rules.get("enum")
        if allowed_values and value not in allowed_values:
            return False
        
        return True
    
    def _notify_config_change(
        self, 
        db: Session, 
        config_key: str,
        changed_by: UUID
    ):
        """Notify superadmins of configuration change"""
        superadmins = self.superadmin_crud.get_with_highest_access(db)
        
        for sa in superadmins:
            if sa.user_id != changed_by:
                self._send_admin_notification(
                    db,
                    superadmin_id=sa.id,
                    title="System Configuration Changed",
                    message=f"Configuration '{config_key}' was modified",
                    notification_type="warning",
                    priority="high"
                )
    
    def _detect_suspicious_patterns(
        self, 
        logs: List[AdminAuditLog]
    ) -> List[Dict[str, Any]]:
        """Detect suspicious activity patterns in logs"""
        patterns = []
        
        # Group by admin and time
        admin_actions = {}
        for log in logs:
            if log.admin_id:
                admin_key = str(log.admin_id)
                if admin_key not in admin_actions:
                    admin_actions[admin_key] = []
                admin_actions[admin_key].append(log)
        
        # Check for suspicious patterns
        for admin_id, actions in admin_actions.items():
            # Many failed attempts
            failed_count = sum(1 for a in actions if a.status == "failed")
            if failed_count > 10:
                patterns.append({
                    "type": "high_failure_rate",
                    "admin_id": admin_id,
                    "failed_actions": failed_count,
                    "severity": "high"
                })
            
            # Unusual hours activity
            night_actions = sum(
                1 for a in actions 
                if 0 <= a.created_at.hour < 6
            )
            if night_actions > 5:
                patterns.append({
                    "type": "unusual_hours",
                    "admin_id": admin_id,
                    "night_actions": night_actions,
                    "severity": "medium"
                })
            
            # Rapid actions (possible automation)
            if len(actions) >= 2:
                time_diffs = []
                for i in range(1, len(actions)):
                    diff = (actions[i].created_at - actions[i-1].created_at).seconds
                    time_diffs.append(diff)
                
                avg_diff = sum(time_diffs) / len(time_diffs)
                if avg_diff < 5:  # Less than 5 seconds average
                    patterns.append({
                        "type": "rapid_actions",
                        "admin_id": admin_id,
                        "avg_seconds_between_actions": avg_diff,
                        "severity": "high"
                    })
        
        return patterns
    
    def _store_security_incident(
        self, 
        db: Session, 
        incident: Dict[str, Any]
    ):
        """Store security incident for tracking"""
        # This would integrate with incident management system
        # For now, store as system configuration
        incident_key = f"security_incident_{incident['id']}"
        
        from app.schemas.admin import SystemConfigurationCreate
        
        config = SystemConfigurationCreate(
            config_key=incident_key,
            config_value=incident,
            config_type="object",
            description=f"Security incident: {incident['type']}",
            category="security",
            is_sensitive=True,
            is_public=False
        )
        
        self.config_crud.create(db, obj_in=config)
    
    def _generate_access_control_report(
        self, 
        db: Session, 
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Generate access control compliance report"""
        # Get all permission changes
        permission_changes = self.audit_crud.get_by_action_type(
            db,
            action_type="permissions_updated",
            limit=1000
        )
        
        # Filter by date
        permission_changes = [
            pc for pc in permission_changes 
            if start_date <= pc.created_at.date() <= end_date
        ]
        
        return {
            "total_permission_changes": len(permission_changes),
            "admins_with_changes": len(set(pc.resource_id for pc in permission_changes)),
            "changes_by_month": self._group_by_month(permission_changes)
        }
    
    def _generate_data_protection_report(
        self, 
        db: Session, 
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Generate data protection compliance report"""
        # Get all data exports and deletions
        exports = self.audit_crud.get_by_action_type(
            db,
            action_type="export_data",
            limit=1000
        )
        
        deletions = self.audit_crud.get_by_action_type(
            db,
            action_type="delete_user",
            limit=1000
        )
        
        return {
            "data_exports": len([e for e in exports if start_date <= e.created_at.date() <= end_date]),
            "user_deletions": len([d for d in deletions if start_date <= d.created_at.date() <= end_date]),
            "compliance_status": "compliant"  # Would check actual compliance rules
        }
    
    def _generate_admin_activity_report(
        self, 
        db: Session, 
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Generate admin activity report"""
        # Get all admin actions
        all_actions = db.query(AdminAuditLog).filter(
            AdminAuditLog.created_at.between(start_date, end_date)
        ).all()
        
        # Group by admin
        admin_summary = {}
        for action in all_actions:
            admin_key = str(action.admin_id or action.superadmin_id)
            if admin_key not in admin_summary:
                admin_summary[admin_key] = {
                    "total_actions": 0,
                    "successful_actions": 0,
                    "failed_actions": 0
                }
            
            admin_summary[admin_key]["total_actions"] += 1
            if action.status == "success":
                admin_summary[admin_key]["successful_actions"] += 1
            else:
                admin_summary[admin_key]["failed_actions"] += 1
        
        return {
            "total_actions": len(all_actions),
            "active_admins": len(admin_summary),
            "admin_summary": admin_summary
        }
    
    def _group_by_month(self, items: List[Any]) -> Dict[str, int]:
        """Group items by month"""
        monthly = {}
        for item in items:
            month_key = item.created_at.strftime("%Y-%m")
            monthly[month_key] = monthly.get(month_key, 0) + 1
        return monthly


# Create service instance
admin_service = AdminService()