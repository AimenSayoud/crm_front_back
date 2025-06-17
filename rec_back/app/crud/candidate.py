from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.candidate import (
    CandidateProfile, CandidateEducation, CandidateExperience, 
    CandidatePreferences, CandidateSkill, CandidateNotificationSettings
)
from app.models.user import User
from app.models.skill import Skill
from app.schemas.candidate import (
    CandidateProfileCreate, CandidateProfileUpdate,
    EducationCreate, EducationUpdate,
    WorkExperienceCreate, WorkExperienceUpdate,
    CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate,
    CandidateSearchFilters,
    CandidateNotificationSettingsCreate, CandidateNotificationSettingsUpdate,
    CandidateSkillCreate, CandidateSkillUpdate
)


class CRUDCandidateProfile(CRUDBase[CandidateProfile, CandidateProfileCreate, CandidateProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> Optional[CandidateProfile]:
        """Get candidate profile by user ID"""
        return db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[CandidateProfile]:
        """Get candidate profile with all related data"""
        return db.query(CandidateProfile)\
            .options(
                joinedload(CandidateProfile.user),
                selectinload(CandidateProfile.education_records),
                selectinload(CandidateProfile.experience_records),
                joinedload(CandidateProfile.preferences),
                selectinload(CandidateProfile.skills).joinedload(CandidateSkill.skill),
                joinedload(CandidateProfile.notification_settings)
            )\
            .filter(CandidateProfile.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: CandidateSearchFilters
    ) -> tuple[List[CandidateProfile], int]:
        """Get candidates with search filters and pagination"""
        query = db.query(CandidateProfile)\
            .join(User, CandidateProfile.user_id == User.id)\
            .options(
                joinedload(CandidateProfile.user),
                selectinload(CandidateProfile.education_records),
                selectinload(CandidateProfile.experience_records),
                selectinload(CandidateProfile.skills).joinedload(CandidateSkill.skill)
            )
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    CandidateProfile.current_position.ilike(search_term),
                    CandidateProfile.current_company.ilike(search_term),
                    CandidateProfile.summary.ilike(search_term)
                )
            )
        
        if filters.skills:
            # Join with skills and filter by skill names
            query = query.join(CandidateSkill)\
                .join(Skill, CandidateSkill.skill_id == Skill.id)\
                .filter(Skill.name.in_(filters.skills))
        
        if filters.experience_min is not None:
            query = query.filter(CandidateProfile.years_of_experience >= filters.experience_min)
        
        if filters.experience_max is not None:
            query = query.filter(CandidateProfile.years_of_experience <= filters.experience_max)
        
        if filters.locations:
            location_filters = [CandidateProfile.city.ilike(f"%{loc}%") for loc in filters.locations]
            query = query.filter(or_(*location_filters))
        
        if filters.remote_only:
            # This would need to be implemented based on job preferences
            query = query.join(CandidatePreferences)\
                .filter(CandidatePreferences.remote_work == True)
        
        if filters.salary_min is not None:
            query = query.join(CandidatePreferences)\
                .filter(CandidatePreferences.salary_expectation_max >= filters.salary_min)
        
        if filters.salary_max is not None:
            query = query.join(CandidatePreferences)\
                .filter(CandidatePreferences.salary_expectation_min <= filters.salary_max)
        
        # Count total before pagination
        total = query.distinct().count()
        
        # Apply sorting
        if filters.sort_by == "experience":
            order_column = CandidateProfile.years_of_experience
        elif filters.sort_by == "updated_at":
            order_column = CandidateProfile.updated_at
        else:  # default to created_at
            order_column = CandidateProfile.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_column))
        else:
            query = query.order_by(desc(order_column))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        candidates = query.distinct().offset(offset).limit(filters.page_size).all()
        
        return candidates, total
    
    def update_profile_completion(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateProfile]:
        """Update profile completion status"""
        candidate = self.get(db, id=candidate_id)
        if not candidate:
            return None
        
        # Check if profile is completed
        has_education = db.query(CandidateEducation).filter(CandidateEducation.candidate_id == candidate_id).first() is not None
        has_experience = db.query(CandidateExperience).filter(CandidateExperience.candidate_id == candidate_id).first() is not None
        has_skills = db.query(CandidateSkill).filter(CandidateSkill.candidate_id == candidate_id).first() is not None
        has_preferences = db.query(CandidatePreferences).filter(CandidatePreferences.candidate_id == candidate_id).first() is not None
        
        candidate.profile_completed = (
            has_education and 
            has_experience and 
            has_skills and 
            has_preferences and
            bool(candidate.summary) and
            bool(candidate.cv_urls)
        )
        
        db.commit()
        db.refresh(candidate)
        return candidate


class CRUDEducation(CRUDBase[CandidateEducation, EducationCreate, EducationUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[CandidateEducation]:
        """Get all education records for a candidate"""
        return db.query(CandidateEducation)\
            .filter(CandidateEducation.candidate_id == candidate_id)\
            .order_by(desc(CandidateEducation.start_date))\
            .all()
    
    def create_for_candidate(self, db: Session, *, obj_in: EducationCreate) -> CandidateEducation:
        """Create education record for candidate"""
        db_obj = CandidateEducation(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_highest_degree(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateEducation]:
        """Get highest degree for candidate"""
        # This is a simplified version - you might want to implement proper degree ranking
        return db.query(CandidateEducation)\
            .filter(CandidateEducation.candidate_id == candidate_id)\
            .order_by(desc(CandidateEducation.end_date))\
            .first()


class CRUDWorkExperience(CRUDBase[CandidateExperience, WorkExperienceCreate, WorkExperienceUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[CandidateExperience]:
        """Get all work experience records for a candidate"""
        return db.query(CandidateExperience)\
            .filter(CandidateExperience.candidate_id == candidate_id)\
            .order_by(desc(CandidateExperience.start_date))\
            .all()
    
    def create_for_candidate(self, db: Session, *, obj_in: WorkExperienceCreate) -> CandidateExperience:
        """Create work experience record for candidate"""
        db_obj = CandidateExperience(**obj_in.model_dump())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_current_position(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateExperience]:
        """Get current work position for candidate"""
        return db.query(CandidateExperience)\
            .filter(
                and_(
                    CandidateExperience.candidate_id == candidate_id,
                    CandidateExperience.current == True
                )
            )\
            .first()
    
    def calculate_total_experience(self, db: Session, *, candidate_id: UUID) -> int:
        """Calculate total years of experience for candidate"""
        experiences = self.get_by_candidate(db, candidate_id=candidate_id)
        
        # Simple calculation - you might want to handle overlapping periods
        from datetime import date
        total_months = 0
        
        for exp in experiences:
            if exp.start_date:
                end_date = exp.end_date if exp.end_date else date.today()
                months = (end_date.year - exp.start_date.year) * 12 + (end_date.month - exp.start_date.month)
                total_months += months
        
        return total_months // 12  # Convert to years


class CRUDCandidateJobPreference(CRUDBase[CandidatePreferences, CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> Optional[CandidatePreferences]:
        """Get job preferences for a candidate"""
        return db.query(CandidatePreferences)\
            .filter(CandidatePreferences.candidate_id == candidate_id)\
            .first()
    
    def create_or_update(self, db: Session, *, candidate_id: UUID, obj_in: CandidateJobPreferenceUpdate) -> CandidatePreferences:
        """Create or update job preferences for candidate"""
        existing = self.get_by_candidate(db, candidate_id=candidate_id)
        
        if existing:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = CandidateJobPreferenceCreate(
                candidate_id=candidate_id,
                **obj_in.model_dump(exclude_unset=True)
            )
            return self.create(db, obj_in=create_data)


class CRUDCandidateNotificationSettings(CRUDBase[CandidateNotificationSettings, CandidateNotificationSettingsCreate, CandidateNotificationSettingsUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> Optional[CandidateNotificationSettings]:
        """Get notification settings for a candidate"""
        return db.query(CandidateNotificationSettings)\
            .filter(CandidateNotificationSettings.candidate_id == candidate_id)\
            .first()
    
    def create_or_update(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID, 
        obj_in: CandidateNotificationSettingsUpdate
    ) -> CandidateNotificationSettings:
        """Create or update notification settings for a candidate"""
        existing = self.get_by_candidate(db, candidate_id=candidate_id)
        
        if existing:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = CandidateNotificationSettingsCreate(
                candidate_id=candidate_id,
                **obj_in.model_dump(exclude_unset=True)
            )
            return self.create(db, obj_in=create_data)
    
    def update_single_setting(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID, 
        setting_name: str, 
        value: bool
    ) -> Optional[CandidateNotificationSettings]:
        """Update a single notification setting"""
        settings = self.get_by_candidate(db, candidate_id=candidate_id)
        if not settings:
            # Create default settings if they don't exist
            settings = CandidateNotificationSettings(
                candidate_id=candidate_id,
                email_alerts=True,
                job_matches=True,
                application_updates=True
            )
            db.add(settings)
        
        if hasattr(settings, setting_name):
            setattr(settings, setting_name, value)
            db.commit()
            db.refresh(settings)
            return settings
        return None


class CRUDCandidateSkill(CRUDBase[CandidateSkill, CandidateSkillCreate, CandidateSkillUpdate]):
    def get_by_candidate(self, db: Session, *, candidate_id: UUID) -> List[CandidateSkill]:
        """Get all skills for a candidate"""
        return db.query(CandidateSkill)\
            .options(joinedload(CandidateSkill.skill))\
            .filter(CandidateSkill.candidate_id == candidate_id)\
            .all()
    
    def update_candidate_skills(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID, 
        skill_data: List[Dict[str, Any]]
    ) -> List[CandidateSkill]:
        """Update all skills for a candidate"""
        # Delete existing skills
        db.query(CandidateSkill)\
            .filter(CandidateSkill.candidate_id == candidate_id)\
            .delete()
        
        # Add new skills
        new_skills = []
        for skill_info in skill_data:
            candidate_skill = CandidateSkill(
                candidate_id=candidate_id,
                skill_id=skill_info['skill_id'],
                proficiency_level=skill_info.get('proficiency_level'),
                years_experience=skill_info.get('years_experience')
            )
            db.add(candidate_skill)
            new_skills.append(candidate_skill)
        
        db.commit()
        for skill in new_skills:
            db.refresh(skill)
        
        return new_skills
    
    def get_by_skill(self, db: Session, *, skill_id: UUID, skip: int = 0, limit: int = 100) -> List[CandidateSkill]:
        """Get all candidates with a specific skill"""
        return db.query(CandidateSkill)\
            .options(
                joinedload(CandidateSkill.candidate).joinedload(CandidateProfile.user)
            )\
            .filter(CandidateSkill.skill_id == skill_id)\
            .offset(skip)\
            .limit(limit)\
            .all()


# Create CRUD instances
candidate_profile = CRUDCandidateProfile(CandidateProfile)
education = CRUDEducation(CandidateEducation)
work_experience = CRUDWorkExperience(CandidateExperience)
candidate_job_preference = CRUDCandidateJobPreference(CandidatePreferences)
candidate_notification_settings = CRUDCandidateNotificationSettings(CandidateNotificationSettings)
candidate_skill = CRUDCandidateSkill(CandidateSkill)