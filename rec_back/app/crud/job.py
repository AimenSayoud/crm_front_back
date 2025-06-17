from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func, case
from uuid import UUID
from datetime import datetime, date

from app.crud.base import CRUDBase
from app.models.job import Job, JobSkillRequirement, JobStatus
from app.models.company import Company, EmployerProfile
from app.models.user import User
from app.models.skill import Skill
from app.models.application import Application, ApplicationStatus
from app.schemas.job import (
    JobCreate, JobUpdate, JobSearchFilters,
    JobSkillRequirementCreate, JobSkillRequirementUpdate
)


class CRUDJob(CRUDBase[Job, JobCreate, JobUpdate]):
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[Job]:
        """Get job with all related data"""
        return db.query(Job)\
            .options(
                joinedload(Job.company),
                joinedload(Job.posted_by_user),
                joinedload(Job.assigned_consultant),
                selectinload(Job.skill_requirements).joinedload(JobSkillRequirement.skill)
            )\
            .filter(Job.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: JobSearchFilters
    ) -> tuple[List[Job], int]:
        """Get jobs with search filters and pagination"""
        query = db.query(Job)\
            .join(Company, Job.company_id == Company.id)\
            .join(User, Job.posted_by == User.id)\
            .options(
                joinedload(Job.company),
                joinedload(Job.posted_by_user),
                joinedload(Job.assigned_consultant)
            )
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    Job.title.ilike(search_term),
                    Job.description.ilike(search_term),
                    Company.name.ilike(search_term),
                    Job.location.ilike(search_term)
                )
            )
        
        if filters.company_id:
            query = query.filter(Job.company_id == filters.company_id)
        
        if filters.location:
            query = query.filter(Job.location.ilike(f"%{filters.location}%"))
        
        if filters.is_remote is not None:
            query = query.filter(Job.is_remote == filters.is_remote)
        
        if filters.job_type:
            query = query.filter(Job.job_type == filters.job_type)
        
        if filters.experience_level:
            query = query.filter(Job.experience_level == filters.experience_level)
        
        if filters.salary_min is not None:
            query = query.filter(Job.salary_min >= filters.salary_min)
        
        if filters.salary_max is not None:
            query = query.filter(Job.salary_max <= filters.salary_max)
        
        if filters.status:
            query = query.filter(Job.status == filters.status)
        
        if filters.posted_after:
            query = query.filter(Job.created_at >= filters.posted_after)
        
        if filters.posted_before:
            query = query.filter(Job.created_at <= filters.posted_before)
        
        if filters.skills:
            # Join with skills and filter by skill names
            query = query.join(JobSkillRequirement, Job.id == JobSkillRequirement.job_id)\
                .join(Skill, JobSkillRequirement.skill_id == Skill.id)\
                .filter(Skill.name.in_(filters.skills))
        
        # Count total before pagination
        total = query.distinct().count()
        
        # Apply sorting
        if filters.sort_by == "title":
            order_column = Job.title
        elif filters.sort_by == "salary_min":
            order_column = Job.salary_min
        elif filters.sort_by == "application_count":
            order_column = Job.application_count
        elif filters.sort_by == "updated_at":
            order_column = Job.updated_at
        else:  # default to created_at
            order_column = Job.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_column))
        else:
            query = query.order_by(desc(order_column))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        jobs = query.offset(offset).limit(filters.page_size).all()
        
        return jobs, total
    
    def get_by_company(self, db: Session, *, company_id: UUID, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get jobs by company"""
        return db.query(Job)\
            .filter(Job.company_id == company_id)\
            .order_by(desc(Job.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_status(self, db: Session, *, status: JobStatus, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get jobs by status"""
        return db.query(Job)\
            .filter(Job.status == status)\
            .order_by(desc(Job.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_featured_jobs(self, db: Session, *, limit: int = 10) -> List[Job]:
        """Get featured jobs"""
        return db.query(Job)\
            .filter(
                and_(
                    Job.is_featured == True,
                    Job.status == JobStatus.OPEN
                )
            )\
            .order_by(desc(Job.created_at))\
            .limit(limit)\
            .all()
    
    def update_status(self, db: Session, *, job_id: UUID, status: JobStatus) -> Optional[Job]:
        """Update job status"""
        job = self.get(db, id=job_id)
        if job:
            job.status = status
            db.commit()
            db.refresh(job)
        return job
    
    def increment_view_count(self, db: Session, *, job_id: UUID) -> Optional[Job]:
        """Increment job view count"""
        job = self.get(db, id=job_id)
        if job:
            job.view_count = (job.view_count or 0) + 1
            db.commit()
            db.refresh(job)
        return job
    
    def get_application_summary(self, db: Session, *, job_id: UUID) -> Dict[str, int]:
        """Get application summary for a job"""
        summary = db.query(
            func.count(Application.id).label('total'),
            func.sum(case((Application.status == ApplicationStatus.SUBMITTED, 1), else_=0)).label('new'),
            func.sum(case((Application.status == ApplicationStatus.UNDER_REVIEW, 1), else_=0)).label('under_review'),
            func.sum(case((Application.status == ApplicationStatus.INTERVIEWED, 1), else_=0)).label('interviewed'),
            func.sum(case((Application.status == ApplicationStatus.OFFERED, 1), else_=0)).label('offered'),
            func.sum(case((Application.status == ApplicationStatus.HIRED, 1), else_=0)).label('hired'),
            func.sum(case((Application.status == ApplicationStatus.REJECTED, 1), else_=0)).label('rejected')
        ).filter(Application.job_id == job_id).first()
        
        return {
            'total_applications': summary.total or 0,
            'new_applications': summary.new or 0,
            'under_review': summary.under_review or 0,
            'interviewed': summary.interviewed or 0,
            'offered': summary.offered or 0,
            'hired': summary.hired or 0,
            'rejected': summary.rejected or 0
        }


class CRUDJobSkillRequirement(CRUDBase[JobSkillRequirement, JobSkillRequirementCreate, JobSkillRequirementUpdate]):
    def get_by_job(self, db: Session, *, job_id: UUID) -> List[JobSkillRequirement]:
        """Get skill requirements for a job"""
        return db.query(JobSkillRequirement)\
            .options(joinedload(JobSkillRequirement.skill))\
            .filter(JobSkillRequirement.job_id == job_id)\
            .all()
    
    def create_multiple(self, db: Session, *, job_id: UUID, skill_requirements: List[JobSkillRequirementCreate]) -> List[JobSkillRequirement]:
        """Create multiple skill requirements for a job"""
        db_objs = []
        for req in skill_requirements:
            req_data = req.model_dump()
            req_data['job_id'] = job_id
            db_obj = JobSkillRequirement(**req_data)
            db.add(db_obj)
            db_objs.append(db_obj)
        
        db.commit()
        for obj in db_objs:
            db.refresh(obj)
        return db_objs
    
    def update_job_skills(self, db: Session, *, job_id: UUID, skill_requirements: List[JobSkillRequirementCreate]) -> List[JobSkillRequirement]:
        """Update all skill requirements for a job"""
        # Delete existing requirements
        db.query(JobSkillRequirement)\
            .filter(JobSkillRequirement.job_id == job_id)\
            .delete()
        
        # Create new requirements
        return self.create_multiple(db, job_id=job_id, skill_requirements=skill_requirements)


# Create CRUD instances
job = CRUDJob(Job)
job_skill_requirement = CRUDJobSkillRequirement(JobSkillRequirement)