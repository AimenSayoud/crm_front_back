# app/services/user.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.user import User
from app.models.enums import UserRole
from app.models.candidate import CandidateProfile
from app.models.company import EmployerProfile
from app.models.consultant import ConsultantProfile
from app.models.admin import AdminProfile, SuperAdminProfile
from app.crud.base import CRUDBase
from app.services.base import BaseService


class UserService(BaseService[User, CRUDBase]):
    """Service for user management operations"""
    
    def __init__(self):
        super().__init__(CRUDBase(User))
    
    def get_user_profile(
        self, 
        db: Session, 
        *, 
        user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Get user with role-specific profile"""
        user = self.get(db, id=user_id)
        if not user:
            return None
        
        profile_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "phone": user.phone,
            "last_login": user.last_login,
            "created_at": user.created_at,
            "profile": None
        }
        
        # Get role-specific profile
        if user.role == UserRole.CANDIDATE:
            profile_data["profile"] = user.candidate_profile
        elif user.role == UserRole.EMPLOYER:
            profile_data["profiles"] = user.employer_profiles
        elif user.role == UserRole.CONSULTANT:
            profile_data["profile"] = user.consultant_profile
        elif user.role == UserRole.ADMIN:
            profile_data["profile"] = user.admin_profile
        elif user.role == UserRole.SUPERADMIN:
            profile_data["profile"] = user.superadmin_profile
        
        return profile_data
    
    def update_user_profile(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        update_data: Dict[str, Any]
    ) -> Optional[User]:
        """Update user basic information"""
        user = self.get(db, id=user_id)
        if not user:
            return None
        
        # Update allowed fields
        allowed_fields = ["first_name", "last_name", "phone"]
        for field in allowed_fields:
            if field in update_data:
                setattr(user, field, update_data[field])
        
        db.commit()
        db.refresh(user)
        return user
    
    def deactivate_user(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        reason: Optional[str] = None
    ) -> bool:
        """Deactivate a user account"""
        user = self.get(db, id=user_id)
        if not user:
            return False
        
        user.is_active = False
        
        # Log deactivation for audit
        if reason:
            self.log_action(
                "user_deactivated",
                user_id=user_id,
                details={"reason": reason}
            )
        
        db.commit()
        return True
    
    def reactivate_user(
        self, 
        db: Session, 
        *, 
        user_id: UUID
    ) -> bool:
        """Reactivate a user account"""
        user = self.get(db, id=user_id)
        if not user:
            return False
        
        user.is_active = True
        db.commit()
        return True
    
    def get_users_by_role(
        self, 
        db: Session, 
        *, 
        role: UserRole,
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False
    ) -> List[User]:
        """Get users by role"""
        query = db.query(User).filter(User.role == role)
        
        if not include_inactive:
            query = query.filter(User.is_active == True)
        
        return query.offset(skip).limit(limit).all()
    
    def search_users(
        self, 
        db: Session, 
        *, 
        query: str,
        roles: Optional[List[UserRole]] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Search users by name or email"""
        search_term = f"%{query}%"
        db_query = db.query(User).filter(
            db.or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
        
        if roles:
            db_query = db_query.filter(User.role.in_(roles))
        
        return db_query.offset(skip).limit(limit).all()
    
    def get_user_statistics(
        self, 
        db: Session, 
        *, 
        user_id: UUID
    ) -> Dict[str, Any]:
        """Get user-specific statistics based on role"""
        user = self.get(db, id=user_id)
        if not user:
            return {}
        
        stats = {
            "user_id": user.id,
            "role": user.role,
            "account_age_days": (datetime.utcnow() - user.created_at).days
        }
        
        if user.role == UserRole.CANDIDATE:
            stats.update(self._get_candidate_stats(db, user))
        elif user.role == UserRole.EMPLOYER:
            stats.update(self._get_employer_stats(db, user))
        elif user.role == UserRole.CONSULTANT:
            stats.update(self._get_consultant_stats(db, user))
        
        return stats
    
    def verify_user(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        verified_by: Optional[UUID] = None
    ) -> bool:
        """Manually verify a user account"""
        user = self.get(db, id=user_id)
        if not user:
            return False
        
        user.is_verified = True
        
        # Log verification
        self.log_action(
            "user_verified",
            user_id=verified_by,
            details={"verified_user_id": user_id}
        )
        
        db.commit()
        return True
    
    def merge_duplicate_users(
        self, 
        db: Session, 
        *, 
        primary_user_id: UUID,
        duplicate_user_id: UUID
    ) -> bool:
        """Merge duplicate user accounts"""
        primary = self.get(db, id=primary_user_id)
        duplicate = self.get(db, id=duplicate_user_id)
        
        if not primary or not duplicate:
            return False
        
        if primary.role != duplicate.role:
            raise ValueError("Cannot merge users with different roles")
        
        # Transfer all relationships to primary user
        # This would need to be implemented based on specific requirements
        
        # Deactivate duplicate
        duplicate.is_active = False
        
        # Log merge
        self.log_action(
            "users_merged",
            user_id=primary_user_id,
            details={
                "primary_id": primary_user_id,
                "duplicate_id": duplicate_user_id
            }
        )
        
        db.commit()
        return True
    
    def _get_candidate_stats(self, db: Session, user: User) -> Dict[str, Any]:
        """Get candidate-specific statistics"""
        from app.models.application import Application
        
        stats = {
            "profile_completed": user.candidate_profile.profile_completed if user.candidate_profile else False,
            "total_applications": 0,
            "active_applications": 0,
            "interviews_scheduled": 0,
            "offers_received": 0
        }
        
        if user.candidate_profile:
            applications = db.query(Application).filter(
                Application.candidate_id == user.candidate_profile.id
            ).all()
            
            stats["total_applications"] = len(applications)
            stats["active_applications"] = sum(
                1 for a in applications 
                if a.status in ["submitted", "under_review", "interviewed"]
            )
            stats["interviews_scheduled"] = sum(
                1 for a in applications 
                if a.interview_date is not None
            )
            stats["offers_received"] = sum(
                1 for a in applications 
                if a.status == "offered"
            )
        
        return stats
    
    def _get_employer_stats(self, db: Session, user: User) -> Dict[str, Any]:
        """Get employer-specific statistics"""
        from app.models.job import Job
        
        stats = {
            "companies": len(user.employer_profiles),
            "total_jobs_posted": 0,
            "active_jobs": 0,
            "total_applications_received": 0
        }
        
        jobs = db.query(Job).filter(Job.posted_by == user.id).all()
        stats["total_jobs_posted"] = len(jobs)
        stats["active_jobs"] = sum(1 for j in jobs if j.status == "open")
        
        return stats
    
    def _get_consultant_stats(self, db: Session, user: User) -> Dict[str, Any]:
        """Get consultant-specific statistics"""
        stats = {
            "status": user.consultant_profile.status if user.consultant_profile else None,
            "total_placements": user.consultant_profile.total_placements if user.consultant_profile else 0,
            "active_assignments": user.consultant_profile.current_active_jobs if user.consultant_profile else 0
        }
        
        return stats


# Create service instance
user_service = UserService()