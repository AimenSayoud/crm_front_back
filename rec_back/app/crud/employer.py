from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.company import (
    Company, EmployerProfile, CompanyContact, 
    CompanyHiringPreferences, RecruitmentHistory
)
from app.models.user import User
from app.models.job import Job
from app.schemas.employer import (
    CompanyCreate, CompanyUpdate, CompanySearchFilters,
    EmployerProfileCreate, EmployerProfileUpdate, EmployerSearchFilters,
    CompanyContactCreate, CompanyContactUpdate,
    CompanyHiringPreferencesCreate, CompanyHiringPreferencesUpdate,
    RecruitmentHistoryCreate, RecruitmentHistoryUpdate
)


class CRUDCompany(CRUDBase[Company, CompanyCreate, CompanyUpdate]):
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[Company]:
        """Get company with all related data"""
        return db.query(Company)\
            .options(
                selectinload(Company.employer_profiles).joinedload(EmployerProfile.user),
                selectinload(Company.jobs),
                selectinload(Company.contacts),
                joinedload(Company.hiring_preferences)
            )\
            .filter(Company.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: CompanySearchFilters
    ) -> tuple[List[Company], int]:
        """Get companies with search filters and pagination"""
        query = db.query(Company)
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    Company.name.ilike(search_term),
                    Company.description.ilike(search_term),
                    Company.industry.ilike(search_term),
                    Company.city.ilike(search_term)
                )
            )
        
        if filters.industry:
            query = query.filter(Company.industry.ilike(f"%{filters.industry}%"))
        
        if filters.company_size:
            query = query.filter(Company.company_size == filters.company_size)
        
        if filters.location:
            query = query.filter(
                or_(
                    Company.city.ilike(f"%{filters.location}%"),
                    Company.country.ilike(f"%{filters.location}%")
                )
            )
        
        if filters.is_verified is not None:
            query = query.filter(Company.is_verified == filters.is_verified)
        
        if filters.is_premium is not None:
            query = query.filter(Company.is_premium == filters.is_premium)
        
        if filters.founded_after:
            query = query.filter(Company.founded_year >= filters.founded_after)
        
        if filters.founded_before:
            query = query.filter(Company.founded_year <= filters.founded_before)
        
        # Count total before pagination
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "name":
            order_column = Company.name
        elif filters.sort_by == "active_jobs":
            order_column = Company.active_jobs
        elif filters.sort_by == "updated_at":
            order_column = Company.updated_at
        else:  # default to created_at
            order_column = Company.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_column))
        else:
            query = query.order_by(desc(order_column))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        companies = query.offset(offset).limit(filters.page_size).all()
        
        return companies, total
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Company]:
        """Get company by name"""
        return db.query(Company).filter(Company.name == name).first()
    
    def get_by_industry(self, db: Session, *, industry: str, skip: int = 0, limit: int = 100) -> List[Company]:
        """Get companies by industry"""
        return db.query(Company)\
            .filter(Company.industry.ilike(f"%{industry}%"))\
            .order_by(desc(Company.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_verified_companies(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Company]:
        """Get verified companies"""
        return db.query(Company)\
            .filter(Company.is_verified == True)\
            .order_by(desc(Company.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_premium_companies(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Company]:
        """Get premium companies"""
        return db.query(Company)\
            .filter(Company.is_premium == True)\
            .order_by(desc(Company.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def update_job_counts(self, db: Session, *, company_id: UUID) -> Optional[Company]:
        """Update job counts for company"""
        company = self.get(db, id=company_id)
        if not company:
            return None
        
        # Count active jobs
        active_jobs = db.query(func.count(Job.id))\
            .filter(
                and_(
                    Job.company_id == company_id,
                    Job.status == "open"
                )
            ).scalar()
        
        # Count total employees (employer profiles)
        total_employees = db.query(func.count(EmployerProfile.id))\
            .filter(EmployerProfile.company_id == company_id)\
            .scalar()
        
        company.active_jobs = active_jobs or 0
        company.total_employees = total_employees or 0
        
        db.commit()
        db.refresh(company)
        return company
    
    def get_company_stats(self, db: Session, *, company_id: UUID) -> Dict[str, Any]:
        """Get comprehensive company statistics"""
        company = self.get(db, id=company_id)
        if not company:
            return {}
        
        # Job statistics
        total_jobs = db.query(func.count(Job.id))\
            .filter(Job.company_id == company_id).scalar()
        
        active_jobs = db.query(func.count(Job.id))\
            .filter(and_(Job.company_id == company_id, Job.status == "open")).scalar()
        
        # Application statistics
        from app.models.application import Application
        total_applications = db.query(func.count(Application.id))\
            .join(Job, Application.job_id == Job.id)\
            .filter(Job.company_id == company_id).scalar()
        
        total_hires = db.query(func.count(Application.id))\
            .join(Job, Application.job_id == Job.id)\
            .filter(and_(Job.company_id == company_id, Application.status == "hired")).scalar()
        
        return {
            "company_id": company_id,
            "total_jobs_posted": total_jobs or 0,
            "active_jobs": active_jobs or 0,
            "total_applications": total_applications or 0,
            "total_hires": total_hires or 0,
            "total_employees": company.total_employees or 0
        }


class CRUDEmployerProfile(CRUDBase[EmployerProfile, EmployerProfileCreate, EmployerProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> List[EmployerProfile]:
        """Get employer profiles by user ID (user can have multiple employer profiles)"""
        return db.query(EmployerProfile)\
            .options(joinedload(EmployerProfile.company))\
            .filter(EmployerProfile.user_id == user_id)\
            .all()
    
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[EmployerProfile]:
        """Get employer profile with all related data"""
        return db.query(EmployerProfile)\
            .options(
                joinedload(EmployerProfile.user),
                joinedload(EmployerProfile.company)
            )\
            .filter(EmployerProfile.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: EmployerSearchFilters
    ) -> tuple[List[EmployerProfile], int]:
        """Get employer profiles with search filters and pagination"""
        query = db.query(EmployerProfile)\
            .join(User, EmployerProfile.user_id == User.id)\
            .join(Company, EmployerProfile.company_id == Company.id)\
            .options(
                joinedload(EmployerProfile.user),
                joinedload(EmployerProfile.company)
            )
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    EmployerProfile.position.ilike(search_term),
                    Company.name.ilike(search_term)
                )
            )
        
        if filters.company_id:
            query = query.filter(EmployerProfile.company_id == filters.company_id)
        
        if filters.position:
            query = query.filter(EmployerProfile.position.ilike(f"%{filters.position}%"))
        
        if filters.department:
            query = query.filter(EmployerProfile.department.ilike(f"%{filters.department}%"))
        
        if filters.can_post_jobs is not None:
            query = query.filter(EmployerProfile.can_post_jobs == filters.can_post_jobs)
        
        # Count total before pagination
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "jobs_posted":
            order_column = EmployerProfile.jobs_posted
        elif filters.sort_by == "successful_hires":
            order_column = EmployerProfile.successful_hires
        elif filters.sort_by == "updated_at":
            order_column = EmployerProfile.updated_at
        else:  # default to created_at
            order_column = EmployerProfile.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_column))
        else:
            query = query.order_by(desc(order_column))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        employers = query.offset(offset).limit(filters.page_size).all()
        
        return employers, total
    
    def get_by_company(self, db: Session, *, company_id: UUID, skip: int = 0, limit: int = 100) -> List[EmployerProfile]:
        """Get employer profiles by company"""
        return db.query(EmployerProfile)\
            .options(joinedload(EmployerProfile.user))\
            .filter(EmployerProfile.company_id == company_id)\
            .order_by(desc(EmployerProfile.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def update_job_stats(self, db: Session, *, employer_id: UUID) -> Optional[EmployerProfile]:
        """Update job posting statistics for employer"""
        employer = self.get(db, id=employer_id)
        if not employer:
            return None
        
        # Count jobs posted by this employer
        jobs_posted = db.query(func.count(Job.id))\
            .filter(Job.posted_by == employer.user_id)\
            .scalar()
        
        # Count successful hires
        from app.models.application import Application
        successful_hires = db.query(func.count(Application.id))\
            .join(Job, Application.job_id == Job.id)\
            .filter(
                and_(
                    Job.posted_by == employer.user_id,
                    Application.status == "hired"
                )
            ).scalar()
        
        employer.jobs_posted = jobs_posted or 0
        employer.successful_hires = successful_hires or 0
        
        db.commit()
        db.refresh(employer)
        return employer
    
    def get_hiring_permissions(self, db: Session, *, user_id: UUID, company_id: UUID) -> bool:
        """Check if user has hiring permissions for company"""
        employer = db.query(EmployerProfile)\
            .filter(
                and_(
                    EmployerProfile.user_id == user_id,
                    EmployerProfile.company_id == company_id,
                    EmployerProfile.can_post_jobs == True
                )
            ).first()
        
        return employer is not None


class CRUDCompanyContact(CRUDBase[CompanyContact, CompanyContactCreate, CompanyContactUpdate]):
    def get_by_company(self, db: Session, *, company_id: UUID) -> List[CompanyContact]:
        """Get all contacts for a company"""
        return db.query(CompanyContact)\
            .filter(CompanyContact.company_id == company_id)\
            .order_by(desc(CompanyContact.is_primary), asc(CompanyContact.name))\
            .all()
    
    def get_primary_contact(self, db: Session, *, company_id: UUID) -> Optional[CompanyContact]:
        """Get primary contact for a company"""
        return db.query(CompanyContact)\
            .filter(
                and_(
                    CompanyContact.company_id == company_id,
                    CompanyContact.is_primary == True
                )
            )\
            .first()
    
    def set_primary_contact(self, db: Session, *, contact_id: UUID) -> Optional[CompanyContact]:
        """Set a contact as primary (and unset others)"""
        contact = self.get(db, id=contact_id)
        if not contact:
            return None
        
        # Unset other primary contacts for this company
        db.query(CompanyContact)\
            .filter(
                and_(
                    CompanyContact.company_id == contact.company_id,
                    CompanyContact.id != contact_id
                )
            )\
            .update({"is_primary": False})
        
        contact.is_primary = True
        db.commit()
        db.refresh(contact)
        return contact


class CRUDCompanyHiringPreferences(CRUDBase[CompanyHiringPreferences, CompanyHiringPreferencesCreate, CompanyHiringPreferencesUpdate]):
    def get_by_company(self, db: Session, *, company_id: UUID) -> Optional[CompanyHiringPreferences]:
        """Get hiring preferences for a company"""
        return db.query(CompanyHiringPreferences)\
            .filter(CompanyHiringPreferences.company_id == company_id)\
            .first()
    
    def create_or_update(
        self, 
        db: Session, 
        *, 
        company_id: UUID, 
        obj_in: CompanyHiringPreferencesUpdate
    ) -> CompanyHiringPreferences:
        """Create or update hiring preferences for a company"""
        existing = self.get_by_company(db, company_id=company_id)
        
        if existing:
            update_data = obj_in.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(existing, field, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            create_data = CompanyHiringPreferencesCreate(
                company_id=company_id,
                **obj_in.model_dump(exclude_unset=True)
            )
            return self.create(db, obj_in=create_data)


class CRUDRecruitmentHistory(CRUDBase[RecruitmentHistory, RecruitmentHistoryCreate, RecruitmentHistoryUpdate]):
    def get_by_company(self, db: Session, *, company_id: UUID, skip: int = 0, limit: int = 100) -> List[RecruitmentHistory]:
        """Get recruitment history for a company"""
        return db.query(RecruitmentHistory)\
            .options(joinedload(RecruitmentHistory.consultant))\
            .filter(RecruitmentHistory.company_id == company_id)\
            .order_by(desc(RecruitmentHistory.date_filled))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_consultant(self, db: Session, *, consultant_id: UUID, skip: int = 0, limit: int = 100) -> List[RecruitmentHistory]:
        """Get recruitment history by consultant"""
        return db.query(RecruitmentHistory)\
            .options(joinedload(RecruitmentHistory.company))\
            .filter(RecruitmentHistory.consultant_id == consultant_id)\
            .order_by(desc(RecruitmentHistory.date_filled))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_average_time_to_fill(self, db: Session, *, company_id: Optional[UUID] = None) -> float:
        """Get average time to fill positions"""
        query = db.query(func.avg(RecruitmentHistory.time_to_fill))
        
        if company_id:
            query = query.filter(RecruitmentHistory.company_id == company_id)
        
        result = query.scalar()
        return float(result) if result else 0.0


# Create CRUD instances
company = CRUDCompany(Company)
employer_profile = CRUDEmployerProfile(EmployerProfile)
company_contact = CRUDCompanyContact(CompanyContact)
company_hiring_preferences = CRUDCompanyHiringPreferences(CompanyHiringPreferences)
recruitment_history = CRUDRecruitmentHistory(RecruitmentHistory)