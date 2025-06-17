# app/services/job.py
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, case
from uuid import UUID
from datetime import datetime, timedelta

from app.models.job import Job, JobSkillRequirement
from app.models.skill import Skill
from app.models.application import Application
from app.models.candidate import CandidateProfile, CandidateSkill
from app.models.company import Company
from app.schemas.job import (
    JobCreate, JobUpdate, JobSearchFilters,
    JobSkillRequirementCreate
)
from app.crud.job import CRUDJob, job, job_skill_requirement
from app.services.base import BaseService


class JobService(BaseService[Job, CRUDJob]):
    """Service for job posting and matching operations"""
    
    def __init__(self):
        super().__init__(job)
        self.skill_requirement_crud = job_skill_requirement
    
    def get_jobs_with_search(
        self, 
        db: Session, 
        *, 
        filters: JobSearchFilters
    ) -> Tuple[List[Job], int]:
        """Get jobs with search filters and pagination"""
        return self.crud.get_multi_with_search(db, filters=filters)
    
    def get_job_with_details(self, db: Session, *, job_id: UUID) -> Optional[Job]:
        """Get a job with all its details and relationships"""
        from app.models.job import Job
        from sqlalchemy.orm import joinedload
        
        job_with_details = db.query(Job).options(
            joinedload(Job.company),
            joinedload(Job.posted_by_user),
            joinedload(Job.assigned_consultant),
            joinedload(Job.skill_requirements)
        ).filter(Job.id == job_id).first()
        
        return job_with_details
    
    async def search_jobs(
        self, 
        db: Session, 
        query: str, 
        location: Optional[str] = None,
        skills: Optional[List[str]] = None,
        job_type: Optional[str] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search jobs - placeholder implementation"""
        # For now, return empty results
        # TODO: Implement actual search logic
        return {
            "jobs": [],
            "total": 0
        }
    
    def create_job(
        self, 
        db: Session, 
        *, 
        job_data: JobCreate,
        created_by: UUID
    ) -> Job:
        """Create a basic job posting"""
        # Set the posted_by field from the created_by parameter
        job_data.posted_by = created_by
        
        # Create the job using the CRUD method
        job = self.crud.create(db, obj_in=job_data)
        
        return job
    
    def create_job_with_skills(
        self, 
        db: Session, 
        *, 
        job_data: JobCreate,
        skills: List[Dict[str, Any]],
        posted_by: UUID
    ) -> Job:
        """Create job posting with skill requirements"""
        # Validate user can post for this company
        from app.crud.employer import employer_profile
        can_post = employer_profile.get_hiring_permissions(
            db, 
            user_id=posted_by,
            company_id=job_data.company_id
        )
        
        if not can_post:
            raise ValueError("User does not have permission to post jobs for this company")
        
        # Create job
        job_data_dict = job_data.model_dump()
        job_data_dict["posted_by"] = posted_by
        job = self.crud.create(db, obj_in=JobCreate(**job_data_dict))
        
        # Add skill requirements
        if skills:
            self._add_job_skills(db, job_id=job.id, skills=skills)
        
        # Update company job count
        self._update_company_job_count(db, company_id=job.company_id)
        
        # Log job creation
        self.log_action(
            "job_created",
            user_id=posted_by,
            details={
                "job_id": str(job.id),
                "title": job.title,
                "company_id": str(job.company_id)
            }
        )
        
        return job
    
    def update_job_with_skills(
        self, 
        db: Session, 
        *, 
        job_id: UUID,
        job_update: JobUpdate,
        skills: Optional[List[Dict[str, Any]]] = None,
        updated_by: UUID
    ) -> Optional[Job]:
        """Update job posting and skill requirements"""
        job = self.get(db, id=job_id)
        if not job:
            return None
        
        # Update job details
        job = self.crud.update(db, db_obj=job, obj_in=job_update)
        
        # Update skills if provided
        if skills is not None:
            self.skill_requirement_crud.update_job_skills(
                db,
                job_id=job_id,
                skill_requirements=[
                    JobSkillRequirementCreate(**skill) 
                    for skill in skills
                ]
            )
        
        # Log update
        self.log_action(
            "job_updated",
            user_id=updated_by,
            details={"job_id": str(job_id)}
        )
        
        return job
    
    def find_matching_candidates(
        self, 
        db: Session, 
        *, 
        job_id: UUID,
        limit: int = 50
    ) -> List[Tuple[CandidateProfile, float]]:
        """Find candidates matching job requirements"""
        job = self.crud.get_with_details(db, id=job_id)
        if not job:
            return []
        
        # Get job skill requirements
        job_skill_ids = [sr.skill_id for sr in job.skill_requirements]
        
        # Base query for active candidates
        candidates = db.query(CandidateProfile).filter(
            CandidateProfile.profile_completed == True
        ).all()
        
        # Calculate match scores
        candidate_scores = []
        for candidate in candidates:
            score = self._calculate_candidate_match_score(
                job, 
                candidate,
                job_skill_ids
            )
            if score > 0.3:  # Minimum threshold
                candidate_scores.append((candidate, score))
        
        # Sort by score and return top matches
        candidate_scores.sort(key=lambda x: x[1], reverse=True)
        return candidate_scores[:limit]
    
    def get_job_analytics(
        self, 
        db: Session, 
        *, 
        job_id: UUID
    ) -> Dict[str, Any]:
        """Get comprehensive job posting analytics"""
        job = self.get(db, id=job_id)
        if not job:
            return {}
        
        # Get application summary
        app_summary = self.crud.get_application_summary(db, job_id=job_id)
        
        # Calculate additional metrics
        analytics = {
            "job_id": job_id,
            "title": job.title,
            "status": job.status,
            "posted_date": job.created_at,
            "days_active": (datetime.utcnow() - job.created_at).days,
            "view_count": job.view_count,
            "application_count": job.application_count,
            "view_to_application_rate": (
                (job.application_count / job.view_count * 100) 
                if job.view_count > 0 else 0
            ),
            "applications": app_summary,
            "source_effectiveness": self._get_source_effectiveness(db, job_id),
            "candidate_quality_metrics": self._get_candidate_quality_metrics(db, job_id),
            "time_to_fill_estimate": self._estimate_time_to_fill(db, job)
        }
        
        return analytics
    
    def get_similar_jobs(
        self, 
        db: Session, 
        *, 
        job_id: UUID,
        limit: int = 10
    ) -> List[Job]:
        """Find similar job postings"""
        job = self.crud.get_with_details(db, id=job_id)
        if not job:
            return []
        
        # Get job skills
        job_skill_ids = [sr.skill_id for sr in job.skill_requirements]
        
        # Find jobs with similar skills
        similar_jobs_query = db.query(
            Job,
            func.count(JobSkillRequirement.skill_id).label('skill_match')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.job_id == Job.id
        ).filter(
            and_(
                Job.id != job_id,
                Job.status == "open",
                JobSkillRequirement.skill_id.in_(job_skill_ids)
            )
        ).group_by(
            Job.id
        ).order_by(
            func.count(JobSkillRequirement.skill_id).desc()
        )
        
        # Add filters for similar attributes
        if job.experience_level:
            similar_jobs_query = similar_jobs_query.filter(
                Job.experience_level == job.experience_level
            )
        
        similar_jobs = similar_jobs_query.limit(limit).all()
        
        return [job for job, _ in similar_jobs]
    
    def optimize_job_posting(
        self, 
        db: Session, 
        *, 
        job_id: UUID
    ) -> Dict[str, Any]:
        """Provide optimization suggestions for job posting"""
        job = self.crud.get_with_details(db, id=job_id)
        if not job:
            return {}
        
        suggestions = {
            "title_optimization": [],
            "description_improvements": [],
            "skill_recommendations": [],
            "salary_insights": {},
            "posting_time_recommendations": []
        }
        
        # Title optimization
        if len(job.title) < 10:
            suggestions["title_optimization"].append(
                "Consider a more descriptive job title"
            )
        
        # Description analysis
        if job.description and len(job.description) < 200:
            suggestions["description_improvements"].append(
                "Add more details about responsibilities and requirements"
            )
        
        # Skill recommendations
        suggestions["skill_recommendations"] = self._recommend_additional_skills(
            db, job
        )
        
        # Salary insights
        suggestions["salary_insights"] = self._get_salary_insights(
            db, job
        )
        
        # Performance predictions
        if job.view_count < 100 and job.created_at < datetime.utcnow() - timedelta(days=7):
            suggestions["posting_time_recommendations"].append(
                "Consider promoting this job posting for better visibility"
            )
        
        return suggestions
    
    def get_market_insights(
        self, 
        db: Session, 
        *, 
        job_title: Optional[str] = None,
        location: Optional[str] = None,
        skills: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Get market insights for job posting"""
        insights = {
            "demand_trends": {},
            "salary_ranges": {},
            "skill_popularity": {},
            "competition_level": {},
            "recommendations": []
        }
        
        # Build base query
        query = db.query(Job).filter(Job.status == "open")
        
        if job_title:
            query = query.filter(Job.title.ilike(f"%{job_title}%"))
        
        if location:
            query = query.filter(Job.location.ilike(f"%{location}%"))
        
        similar_jobs = query.all()
        
        if similar_jobs:
            # Calculate salary ranges
            salaries = [
                (j.salary_min, j.salary_max) 
                for j in similar_jobs 
                if j.salary_min or j.salary_max
            ]
            
            if salaries:
                min_salaries = [s[0] for s in salaries if s[0]]
                max_salaries = [s[1] for s in salaries if s[1]]
                
                insights["salary_ranges"] = {
                    "min_average": sum(min_salaries) / len(min_salaries) if min_salaries else 0,
                    "max_average": sum(max_salaries) / len(max_salaries) if max_salaries else 0,
                    "sample_size": len(salaries)
                }
            
            # Competition level
            insights["competition_level"] = {
                "total_similar_jobs": len(similar_jobs),
                "posted_last_week": sum(
                    1 for j in similar_jobs 
                    if j.created_at > datetime.utcnow() - timedelta(days=7)
                ),
                "average_applications": sum(
                    j.application_count for j in similar_jobs
                ) / len(similar_jobs) if similar_jobs else 0
            }
        
        # Skill popularity
        if skills:
            skill_counts = db.query(
                Skill.name,
                func.count(JobSkillRequirement.job_id).label('demand')
            ).join(
                JobSkillRequirement,
                JobSkillRequirement.skill_id == Skill.id
            ).filter(
                Skill.name.in_(skills)
            ).group_by(
                Skill.name
            ).all()
            
            insights["skill_popularity"] = {
                skill: count for skill, count in skill_counts
            }
        
        return insights
    
    def close_job_with_reason(
        self, 
        db: Session, 
        *, 
        job_id: UUID,
        reason: str,
        closed_by: UUID
    ) -> bool:
        """Close job posting with reason"""
        job = self.get(db, id=job_id)
        if not job:
            return False
        
        # Update status
        job.status = "closed"
        
        # Log closure
        self.log_action(
            "job_closed",
            user_id=closed_by,
            details={
                "job_id": str(job_id),
                "reason": reason
            }
        )
        
        # Notify active applicants
        # This would trigger notification service
        
        db.commit()
        return True
    
    def _add_job_skills(
        self, 
        db: Session, 
        job_id: UUID, 
        skills: List[Dict[str, Any]]
    ):
        """Add skill requirements to job"""
        for skill_data in skills:
            # Validate skill exists
            skill = db.query(Skill).filter(
                Skill.name.ilike(skill_data.get("skill_name", ""))
            ).first()
            
            if skill:
                requirement = JobSkillRequirement(
                    job_id=job_id,
                    skill_id=skill.id,
                    is_required=skill_data.get("is_required", True),
                    proficiency_level=skill_data.get("proficiency_level"),
                    years_experience=skill_data.get("years_experience")
                )
                db.add(requirement)
        
        db.commit()
    
    def _update_company_job_count(self, db: Session, company_id: UUID):
        """Update company's active job count"""
        from app.crud.employer import company as company_crud
        company_crud.update_job_counts(db, company_id=company_id)
    
    def _calculate_candidate_match_score(
        self,
        job: Job,
        candidate: CandidateProfile,
        job_skill_ids: List[UUID]
    ) -> float:
        """Calculate match score between job and candidate"""
        score = 0.0
        
        # Skill match (40%)
        if job_skill_ids and candidate.skills:
            candidate_skill_ids = [cs.skill_id for cs in candidate.skills]
            skill_match = len(
                set(job_skill_ids) & set(candidate_skill_ids)
            ) / len(job_skill_ids)
            score += skill_match * 0.4
        
        # Experience match (30%)
        if candidate.years_of_experience is not None:
            exp_score = self._match_experience_level(
                candidate.years_of_experience,
                job.experience_level
            )
            score += exp_score * 0.3
        
        # Location match (20%)
        if candidate.preferences:
            # Check location preferences
            if job.is_remote and candidate.preferences.remote_work:
                score += 0.2
            elif candidate.preferences.locations:
                if any(
                    loc in job.location 
                    for loc in candidate.preferences.locations
                ):
                    score += 0.2
        
        # Availability (10%)
        if candidate.preferences and candidate.preferences.availability_date:
            if candidate.preferences.availability_date <= datetime.utcnow().date():
                score += 0.1
        
        return score
    
    def _match_experience_level(
        self,
        candidate_years: int,
        job_level: Optional[str]
    ) -> float:
        """Match candidate experience with job level"""
        if not job_level:
            return 0.5
        
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
    
    def _get_source_effectiveness(
        self, 
        db: Session, 
        job_id: UUID
    ) -> Dict[str, Any]:
        """Analyze application source effectiveness"""
        sources = db.query(
            Application.source,
            func.count(Application.id).label('total'),
            func.sum(
                case(
                    (Application.status.in_(["interviewed", "offered", "hired"]), 1),
                    else_=0
                )
            ).label('quality')
        ).filter(
            Application.job_id == job_id
        ).group_by(
            Application.source
        ).all()
        
        return [
            {
                "source": source or "direct",
                "total": total,
                "quality_rate": (quality / total * 100) if total > 0 else 0
            }
            for source, total, quality in sources
        ]
    
    def _get_candidate_quality_metrics(
        self, 
        db: Session, 
        job_id: UUID
    ) -> Dict[str, Any]:
        """Calculate candidate quality metrics"""
        applications = db.query(Application).filter(
            Application.job_id == job_id
        ).all()
        
        if not applications:
            return {
                "average_match_score": 0,
                "qualified_percentage": 0,
                "overqualified_percentage": 0
            }
        
        # This would ideally calculate actual match scores
        # For now, use status as a proxy
        qualified = sum(
            1 for a in applications 
            if a.status in ["interviewed", "offered", "hired"]
        )
        
        return {
            "total_applicants": len(applications),
            "qualified_percentage": (qualified / len(applications) * 100),
            "interview_conversion": (
                sum(1 for a in applications if a.interview_date is not None) / 
                len(applications) * 100
            )
        }
    
    def _estimate_time_to_fill(
        self, 
        db: Session, 
        job: Job
    ) -> Optional[int]:
        """Estimate time to fill position based on historical data"""
        # Get similar filled jobs
        similar_jobs = db.query(Job).filter(
            and_(
                Job.company_id == job.company_id,
                Job.title.ilike(f"%{job.title.split()[0]}%"),
                Job.status == "filled"
            )
        ).limit(5).all()
        
        if not similar_jobs:
            # Industry average
            return 30
        
        # Calculate average time to fill
        fill_times = []
        for j in similar_jobs:
            hired_app = db.query(Application).filter(
                and_(
                    Application.job_id == j.id,
                    Application.status == "hired"
                )
            ).first()
            
            if hired_app:
                days = (hired_app.last_updated - j.created_at).days
                fill_times.append(days)
        
        return sum(fill_times) // len(fill_times) if fill_times else 30
    
    def _recommend_additional_skills(
        self, 
        db: Session, 
        job: Job
    ) -> List[str]:
        """Recommend additional skills for job posting"""
        # Get current job skills
        current_skill_ids = [sr.skill_id for sr in job.skill_requirements]
        
        if not current_skill_ids:
            return []
        
        # Find commonly paired skills
        paired_skills = db.query(
            Skill.name,
            func.count(JobSkillRequirement.job_id).label('frequency')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.skill_id == Skill.id
        ).filter(
            and_(
                JobSkillRequirement.job_id.in_(
                    db.query(JobSkillRequirement.job_id).filter(
                        JobSkillRequirement.skill_id.in_(current_skill_ids)
                    )
                ),
                ~Skill.id.in_(current_skill_ids)
            )
        ).group_by(
            Skill.name
        ).order_by(
            func.count(JobSkillRequirement.job_id).desc()
        ).limit(5).all()
        
        return [skill for skill, _ in paired_skills]
    
    def _get_salary_insights(
        self, 
        db: Session, 
        job: Job
    ) -> Dict[str, Any]:
        """Get salary insights for job"""
        # Find similar jobs
        similar_jobs = db.query(Job).filter(
            and_(
                Job.id != job.id,
                Job.title.ilike(f"%{job.title.split()[0]}%"),
                Job.location.ilike(f"%{job.location.split(',')[0]}%"),
                or_(Job.salary_min.isnot(None), Job.salary_max.isnot(None))
            )
        ).all()
        
        if not similar_jobs:
            return {"message": "Insufficient data for salary insights"}
        
        min_salaries = [j.salary_min for j in similar_jobs if j.salary_min]
        max_salaries = [j.salary_max for j in similar_jobs if j.salary_max]
        
        insights = {
            "market_min": sum(min_salaries) / len(min_salaries) if min_salaries else 0,
            "market_max": sum(max_salaries) / len(max_salaries) if max_salaries else 0,
            "your_position": "competitive"
        }
        
        if job.salary_min and insights["market_min"]:
            if job.salary_min < insights["market_min"] * 0.9:
                insights["your_position"] = "below_market"
            elif job.salary_min > insights["market_min"] * 1.1:
                insights["your_position"] = "above_market"
        
        return insights
    
    def can_user_modify_job(self, db: Session, *, job_id: UUID, user_id: UUID) -> bool:
        """Check if user can modify a job (employer can modify their company's jobs)"""
        job = self.get(db, id=job_id)
        if not job:
            return False
        
        # Get user with employer profiles
        from app.models.user import User
        from sqlalchemy.orm import joinedload
        
        user = db.query(User).options(
            joinedload(User.employer_profiles)
        ).filter(User.id == user_id).first()
        
        if not user:
            return False
        
        # Check if user has any employer profile belonging to the same company as the job
        if user.employer_profiles:
            for employer_profile in user.employer_profiles:
                if employer_profile.company_id == job.company_id:
                    return True
        
        return False
    
    def add_skill_requirement(
        self, 
        db: Session, 
        *, 
        job_id: UUID, 
        skill_data: JobSkillRequirementCreate
    ) -> JobSkillRequirement:
        """Add a skill requirement to a job"""
        # Verify the job exists
        job = self.get(db, id=job_id)
        if not job:
            raise ValueError("Job not found")
        
        # Verify the skill exists
        skill = db.query(Skill).filter(Skill.id == skill_data.skill_id).first()
        if not skill:
            raise ValueError("Skill not found")
        
        # Check if skill requirement already exists
        existing = db.query(JobSkillRequirement).filter(
            and_(
                JobSkillRequirement.job_id == job_id,
                JobSkillRequirement.skill_id == skill_data.skill_id
            )
        ).first()
        
        if existing:
            raise ValueError("Skill requirement already exists for this job")
        
        # Create the skill requirement
        skill_requirement = self.skill_requirement_crud.create(db, obj_in=skill_data)
        return skill_requirement


# Create service instance
job_service = JobService()