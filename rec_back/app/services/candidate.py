# app/services/candidate.py
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from datetime import datetime, timedelta

from app.models.candidate import (
    CandidateProfile, CandidateEducation, CandidateExperience,
    CandidateSkill, CandidatePreferences, CandidateNotificationSettings
)
from app.models.job import Job
from app.models.skill import Skill
from app.models.application import Application
from app.schemas.candidate import (
    CandidateProfileCreate, CandidateProfileUpdate,
    EducationCreate, WorkExperienceCreate,
    CandidateSearchFilters, CandidateSkillCreate
)
from app.crud import candidate as candidate_crud
from app.services.base import BaseService


class CandidateService(BaseService[CandidateProfile, candidate_crud.CRUDCandidateProfile]):
    """Service for candidate operations"""
    
    def __init__(self):
        super().__init__(candidate_crud.candidate_profile)
        self.education_crud = candidate_crud.education
        self.experience_crud = candidate_crud.work_experience
        self.skill_crud = candidate_crud.candidate_skill
        self.preference_crud = candidate_crud.candidate_job_preference
        self.notification_crud = candidate_crud.candidate_notification_settings
    
    async def search_candidates(
        self, 
        db: Session, 
        query: str, 
        location: Optional[str] = None,
        skills: Optional[List[str]] = None,
        experience_level: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search candidates - placeholder implementation"""
        # For now, return empty results
        # TODO: Implement actual search logic
        return {
            "candidates": [],
            "total": 0
        }
    
    def create_complete_profile(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        profile_data: Dict[str, Any]
    ) -> CandidateProfile:
        """Create a complete candidate profile with all components"""
        # Create main profile
        profile = self.crud.get_by_user_id(db, user_id=user_id)
        if not profile:
            profile = self.crud.create(
                db, 
                obj_in=CandidateProfileCreate(
                    user_id=user_id,
                    **profile_data.get("profile", {})
                )
            )
        
        # Add education records
        if "education" in profile_data:
            for edu in profile_data["education"]:
                self.education_crud.create_for_candidate(
                    db,
                    obj_in=EducationCreate(
                        candidate_id=profile.id,
                        **edu
                    )
                )
        
        # Add experience records
        if "experience" in profile_data:
            for exp in profile_data["experience"]:
                self.experience_crud.create_for_candidate(
                    db,
                    obj_in=WorkExperienceCreate(
                        candidate_id=profile.id,
                        **exp
                    )
                )
        
        # Add skills
        if "skills" in profile_data:
            self.update_candidate_skills(
                db,
                candidate_id=profile.id,
                skills=profile_data["skills"]
            )
        
        # Set preferences
        if "preferences" in profile_data:
            self.preference_crud.create_or_update(
                db,
                candidate_id=profile.id,
                obj_in=profile_data["preferences"]
            )
        
        # Update profile completion status
        self.crud.update_profile_completion(db, candidate_id=profile.id)
        
        return profile
    
    def update_candidate_skills(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID,
        skills: List[Dict[str, Any]]
    ) -> List[CandidateSkill]:
        """Update candidate skills with validation"""
        validated_skills = []
        
        for skill_data in skills:
            # Validate skill exists
            skill = db.query(Skill).filter(
                Skill.name.ilike(skill_data.get("name", ""))
            ).first()
            
            if skill:
                validated_skills.append({
                    "skill_id": skill.id,
                    "proficiency_level": skill_data.get("proficiency_level"),
                    "years_experience": skill_data.get("years_experience")
                })
        
        return self.skill_crud.update_candidate_skills(
            db,
            candidate_id=candidate_id,
            skill_data=validated_skills
        )
    
    def get_profile_completion_percentage(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID
    ) -> int:
        """Calculate profile completion percentage"""
        profile = self.crud.get_with_details(db, id=candidate_id)
        if not profile:
            return 0
        
        completion_items = [
            bool(profile.summary),  # 10%
            bool(profile.cv_urls),  # 10%
            len(profile.education_records) > 0,  # 15%
            len(profile.experience_records) > 0,  # 20%
            len(profile.skills) > 0,  # 15%
            bool(profile.preferences),  # 10%
            bool(profile.current_position),  # 5%
            bool(profile.years_of_experience),  # 5%
            bool(profile.city and profile.country),  # 5%
            bool(profile.user.phone)  # 5%
        ]
        
        weights = [10, 10, 15, 20, 15, 10, 5, 5, 5, 5]
        completion = sum(
            weight for item, weight in zip(completion_items, weights) 
            if item
        )
        
        return completion
    
    def find_matching_jobs(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID,
        limit: int = 10
    ) -> List[Tuple[Job, float]]:
        """Find jobs matching candidate profile"""
        candidate = self.crud.get_with_details(db, id=candidate_id)
        if not candidate:
            return []
        
        # Get candidate skills
        candidate_skill_ids = [cs.skill_id for cs in candidate.skills]
        
        # Base query for open jobs
        query = db.query(Job).filter(Job.status == "open")
        
        # Filter by preferences if available
        if candidate.preferences:
            if candidate.preferences.locations:
                location_filters = [
                    Job.location.ilike(f"%{loc}%") 
                    for loc in candidate.preferences.locations
                ]
                query = query.filter(or_(*location_filters))
            
            if candidate.preferences.remote_work:
                query = query.filter(or_(Job.is_remote == True, Job.is_remote == None))
            
            if candidate.preferences.salary_expectation_min:
                query = query.filter(
                    Job.salary_max >= candidate.preferences.salary_expectation_min
                )
        
        jobs = query.all()
        
        # Calculate match scores
        job_scores = []
        for job in jobs:
            score = self._calculate_job_match_score(
                candidate, 
                job, 
                candidate_skill_ids
            )
            job_scores.append((job, score))
        
        # Sort by score and return top matches
        job_scores.sort(key=lambda x: x[1], reverse=True)
        return job_scores[:limit]
    
    def get_application_analytics(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID
    ) -> Dict[str, Any]:
        """Get candidate application analytics"""
        applications = db.query(Application).filter(
            Application.candidate_id == candidate_id
        ).all()
        
        if not applications:
            return {
                "total_applications": 0,
                "response_rate": 0,
                "interview_rate": 0,
                "offer_rate": 0,
                "average_response_time": None,
                "applications_by_status": {},
                "applications_by_month": {}
            }
        
        total = len(applications)
        responded = sum(
            1 for a in applications 
            if a.status != "submitted"
        )
        interviewed = sum(
            1 for a in applications 
            if a.status in ["interviewed", "offered", "hired"]
        )
        offered = sum(
            1 for a in applications 
            if a.status in ["offered", "hired"]
        )
        
        # Calculate average response time
        response_times = []
        for app in applications:
            if app.status != "submitted" and app.last_updated:
                response_time = (app.last_updated - app.applied_at).days
                response_times.append(response_time)
        
        avg_response_time = (
            sum(response_times) / len(response_times) 
            if response_times else None
        )
        
        # Group by status
        status_counts = {}
        for app in applications:
            status_counts[app.status] = status_counts.get(app.status, 0) + 1
        
        # Group by month
        month_counts = {}
        for app in applications:
            month_key = app.applied_at.strftime("%Y-%m")
            month_counts[month_key] = month_counts.get(month_key, 0) + 1
        
        return {
            "total_applications": total,
            "response_rate": (responded / total * 100) if total > 0 else 0,
            "interview_rate": (interviewed / total * 100) if total > 0 else 0,
            "offer_rate": (offered / total * 100) if total > 0 else 0,
            "average_response_time": avg_response_time,
            "applications_by_status": status_counts,
            "applications_by_month": month_counts
        }
    
    def get_skill_recommendations(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID,
        limit: int = 10
    ) -> List[Skill]:
        """Recommend skills based on candidate profile and market demand"""
        candidate = self.crud.get_with_details(db, id=candidate_id)
        if not candidate:
            return []
        
        # Get candidate's current skills
        current_skill_ids = [cs.skill_id for cs in candidate.skills]
        
        # Find skills commonly paired with candidate's skills
        related_skills = db.query(
            Skill.id,
            func.count(Skill.id).label('frequency')
        ).join(
            CandidateSkill,
            CandidateSkill.skill_id == Skill.id
        ).filter(
            and_(
                CandidateSkill.candidate_id.in_(
                    db.query(CandidateSkill.candidate_id).filter(
                        CandidateSkill.skill_id.in_(current_skill_ids)
                    )
                ),
                ~Skill.id.in_(current_skill_ids)
            )
        ).group_by(
            Skill.id
        ).order_by(
            func.count(Skill.id).desc()
        ).limit(limit)
        
        skill_ids = [s[0] for s in related_skills]
        return db.query(Skill).filter(Skill.id.in_(skill_ids)).all()
    
    def get_career_progression_suggestions(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID
    ) -> Dict[str, Any]:
        """Suggest career progression paths based on current profile"""
        candidate = self.crud.get_with_details(db, id=candidate_id)
        if not candidate:
            return {}
        
        suggestions = {
            "current_level": self._determine_seniority_level(candidate),
            "next_positions": [],
            "skill_gaps": [],
            "estimated_timeline": None,
            "salary_progression": {}
        }
        
        # Analyze career trajectory from experience
        if candidate.experience_records:
            latest_position = candidate.experience_records[0]
            suggestions["next_positions"] = self._suggest_next_positions(
                latest_position.title,
                candidate.years_of_experience
            )
        
        # Identify skill gaps for progression
        suggestions["skill_gaps"] = self._identify_skill_gaps(
            db,
            candidate,
            suggestions["next_positions"]
        )
        
        return suggestions
    
    def _calculate_job_match_score(
        self,
        candidate: CandidateProfile,
        job: Job,
        candidate_skill_ids: List[UUID]
    ) -> float:
        """Calculate match score between candidate and job"""
        score = 0.0
        
        # Skill match (40%)
        if hasattr(job, 'skill_requirements'):
            job_skill_ids = [sr.skill_id for sr in job.skill_requirements]
            if job_skill_ids:
                skill_match = len(
                    set(candidate_skill_ids) & set(job_skill_ids)
                ) / len(job_skill_ids)
                score += skill_match * 0.4
        
        # Experience match (20%)
        if job.experience_level and candidate.years_of_experience:
            exp_match = self._calculate_experience_match(
                candidate.years_of_experience,
                job.experience_level
            )
            score += exp_match * 0.2
        
        # Location match (20%)
        if candidate.preferences and candidate.preferences.locations:
            if any(
                loc in job.location 
                for loc in candidate.preferences.locations
            ):
                score += 0.2
        
        # Salary match (20%)
        if (candidate.preferences and 
            candidate.preferences.salary_expectation_min and 
            job.salary_max):
            if job.salary_max >= candidate.preferences.salary_expectation_min:
                score += 0.2
        
        return score
    
    def _calculate_experience_match(
        self,
        candidate_years: int,
        job_level: str
    ) -> float:
        """Calculate experience level match"""
        level_ranges = {
            "entry_level": (0, 2),
            "junior": (1, 3),
            "mid_level": (3, 6),
            "senior": (5, 10),
            "lead": (8, 15),
            "principal": (10, None)
        }
        
        if job_level in level_ranges:
            min_exp, max_exp = level_ranges[job_level]
            if max_exp is None:
                return 1.0 if candidate_years >= min_exp else 0.5
            elif min_exp <= candidate_years <= max_exp:
                return 1.0
            else:
                # Partial match if close
                if candidate_years < min_exp:
                    return max(0, 1 - (min_exp - candidate_years) / min_exp)
                else:
                    return max(0, 1 - (candidate_years - max_exp) / max_exp)
        
        return 0.5
    
    def _determine_seniority_level(
        self,
        candidate: CandidateProfile
    ) -> str:
        """Determine candidate's seniority level"""
        years = candidate.years_of_experience or 0
        
        if years < 2:
            return "entry_level"
        elif years < 4:
            return "junior"
        elif years < 7:
            return "mid_level"
        elif years < 10:
            return "senior"
        elif years < 15:
            return "lead"
        else:
            return "principal"
    
    def _suggest_next_positions(
        self,
        current_title: str,
        years_experience: int
    ) -> List[str]:
        """Suggest potential next career positions"""
        # This would ideally use ML or a career progression database
        # For now, simple rule-based suggestions
        
        title_lower = current_title.lower()
        suggestions = []
        
        if "junior" in title_lower or years_experience < 3:
            base_title = title_lower.replace("junior", "").strip()
            suggestions.append(f"Mid-level {base_title}")
            suggestions.append(f"Senior {base_title}")
        elif "senior" not in title_lower and years_experience >= 3:
            suggestions.append(f"Senior {current_title}")
            suggestions.append(f"Lead {current_title}")
        elif "senior" in title_lower and years_experience >= 7:
            base_title = title_lower.replace("senior", "").strip()
            suggestions.append(f"Lead {base_title}")
            suggestions.append(f"Principal {base_title}")
            suggestions.append(f"{base_title} Manager")
        
        return suggestions[:3]
    
    def _identify_skill_gaps(
        self,
        db: Session,
        candidate: CandidateProfile,
        target_positions: List[str]
    ) -> List[Dict[str, Any]]:
        """Identify skills needed for career progression"""
        # This would ideally analyze job postings for target positions
        # For now, return common progression skills
        
        current_skill_names = [
            cs.skill.name for cs in candidate.skills 
            if cs.skill
        ]
        
        skill_gaps = []
        
        # Add leadership skills for senior positions
        if any("lead" in pos.lower() or "manager" in pos.lower() 
               for pos in target_positions):
            if "Leadership" not in current_skill_names:
                skill_gaps.append({
                    "skill": "Leadership",
                    "importance": "high",
                    "reason": "Required for senior positions"
                })
        
        return skill_gaps


# Create service instance
candidate_service = CandidateService()