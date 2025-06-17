# app/services/company.py
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from uuid import UUID
from datetime import datetime, timedelta

from app.models.company import (
    Company, EmployerProfile, CompanyContact,
    CompanyHiringPreferences, RecruitmentHistory
)
from app.models.job import Job
from app.models.application import Application
from app.models.user import User
from app.schemas.employer import (
    CompanyCreate, CompanyUpdate, EmployerProfileCreate,
    CompanySearchFilters, CompanyContactCreate, CompanyContactUpdate,
    CompanyHiringPreferences, CompanyHiringPreferencesUpdate
)
from app.crud import employer as employer_crud
from app.services.base import BaseService


class CompanyService(BaseService[Company, employer_crud.CRUDCompany]):
    """Service for company and employer operations"""
    
    def __init__(self):
        super().__init__(employer_crud.company)
        self.employer_crud = employer_crud.employer_profile
        self.contact_crud = employer_crud.company_contact
        self.preferences_crud = employer_crud.company_hiring_preferences
        self.history_crud = employer_crud.recruitment_history
    
    def create_company(
        self, 
        db: Session, 
        *, 
        company_data: CompanyCreate,
        created_by: UUID
    ) -> Company:
        """Create a new company"""
        # Create the company using base CRUD
        company = self.crud.create(db, obj_in=company_data)
        
        # Log company creation
        self.log_action(
            "company_created",
            user_id=created_by,
            details={"company_id": str(company.id), "company_name": company.name}
        )
        
        return company
    
    def update_company(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        update_data: CompanyUpdate,
        updated_by: UUID
    ) -> Optional[Company]:
        """Update company information"""
        company = self.get(db, id=company_id)
        if not company:
            return None
        
        # Update using base CRUD
        updated_company = self.crud.update(db, db_obj=company, obj_in=update_data)
        
        # Log company update
        self.log_action(
            "company_updated",
            user_id=updated_by,
            details={"company_id": str(company_id), "company_name": company.name}
        )
        
        return updated_company
    
    def delete_company(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        deleted_by: UUID
    ) -> bool:
        """Delete a company"""
        company = self.get(db, id=company_id)
        if not company:
            return False
        
        # Delete using base CRUD
        self.crud.remove(db, id=company_id)
        
        # Log company deletion
        self.log_action(
            "company_deleted",
            user_id=deleted_by,
            details={"company_id": str(company_id), "company_name": company.name}
        )
        
        return True
    
    def get_company_with_details(
        self, 
        db: Session, 
        *, 
        id: UUID
    ) -> Optional[Company]:
        """Get company with all related details"""
        return self.crud.get_with_details(db, id=id)
    
    def get_companies_with_search(
        self, 
        db: Session, 
        *, 
        filters: "CompanySearchFilters"
    ) -> Tuple[List[Company], int]:
        """Get companies with search filters and pagination"""
        query = db.query(Company)
        
        # Apply filters
        search_query = filters.query or filters.name
        if search_query:
            search_term = f"%{search_query}%"
            query = query.filter(
                or_(
                    Company.name.ilike(search_term),
                    Company.description.ilike(search_term),
                    Company.industry.ilike(search_term)
                )
            )
        
        if filters.industry:
            query = query.filter(Company.industry.ilike(f"%{filters.industry}%"))
            
        if filters.location:
            query = query.filter(Company.location.ilike(f"%{filters.location}%"))
            
        if filters.company_size:
            query = query.filter(Company.company_size == filters.company_size)
            
        if filters.is_verified is not None:
            query = query.filter(Company.is_verified == filters.is_verified)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "name":
            if filters.sort_order == "desc":
                query = query.order_by(Company.name.desc())
            else:
                query = query.order_by(Company.name.asc())
        else:
            query = query.order_by(Company.created_at.desc())
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        companies = query.offset(offset).limit(filters.page_size).all()
        
        return companies, total
    
    async def search_companies(
        self, 
        db: Session, 
        query: str, 
        location: Optional[str] = None,
        company_size: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search companies - placeholder implementation"""
        # For now, return empty results
        # TODO: Implement actual search logic
        return {
            "companies": [],
            "total": 0
        }
    
    def create_company_with_admin(
        self, 
        db: Session, 
        *, 
        company_data: CompanyCreate,
        admin_user_id: UUID
    ) -> Company:
        """Create company and assign first admin"""
        # Create company
        company = self.crud.create(db, obj_in=company_data)
        
        # Create employer profile for admin
        employer_profile = EmployerProfileCreate(
            user_id=admin_user_id,
            company_id=company.id,
            position="Company Administrator",
            can_post_jobs=True
        )
        self.employer_crud.create(db, obj_in=employer_profile)
        
        # Create primary contact
        user = db.query(User).filter(User.id == admin_user_id).first()
        if user:
            contact = CompanyContactCreate(
                company_id=company.id,
                name=user.full_name,
                email=user.email,
                phone=user.phone,
                title="Primary Contact",
                is_primary=True
            )
            self.contact_crud.create(db, obj_in=contact)
        
        # Log company creation
        self.log_action(
            "company_created",
            user_id=admin_user_id,
            details={"company_id": str(company.id), "company_name": company.name}
        )
        
        return company
    
    def verify_company(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        verified_by: UUID,
        verification_notes: Optional[str] = None
    ) -> bool:
        """Verify a company profile"""
        company = self.get(db, id=company_id)
        if not company:
            return False
        
        company.is_verified = True
        
        # Log verification
        self.log_action(
            "company_verified",
            user_id=verified_by,
            details={
                "company_id": str(company_id),
                "notes": verification_notes
            }
        )
        
        db.commit()
        return True
    
    def upgrade_to_premium(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        duration_months: int = 12
    ) -> bool:
        """Upgrade company to premium status"""
        company = self.get(db, id=company_id)
        if not company:
            return False
        
        company.is_premium = True
        
        # You might want to track premium expiration
        # This would require additional fields in the model
        
        db.commit()
        return True
    
    def get_company_dashboard_stats(
        self, 
        db: Session, 
        *, 
        company_id: UUID
    ) -> Dict[str, Any]:
        """Get comprehensive company dashboard statistics"""
        stats = self.crud.get_company_stats(db, company_id=company_id)
        
        # Add more detailed stats
        stats.update({
            "active_applications": self._get_active_applications_count(db, company_id),
            "interviews_scheduled": self._get_scheduled_interviews_count(db, company_id),
            "offers_pending": self._get_pending_offers_count(db, company_id),
            "avg_time_to_hire": self.history_crud.get_average_time_to_fill(
                db, company_id=company_id
            ),
            "hiring_funnel": self._get_hiring_funnel_stats(db, company_id),
            "top_sources": self._get_top_application_sources(db, company_id),
            "monthly_trends": self._get_monthly_hiring_trends(db, company_id)
        })
        
        return stats
    
    def get_talent_pipeline(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        job_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """Get talent pipeline analytics"""
        query = db.query(Application).join(
            Job, Application.job_id == Job.id
        ).filter(Job.company_id == company_id)
        
        if job_id:
            query = query.filter(Application.job_id == job_id)
        
        applications = query.all()
        
        # Group by status
        pipeline = {
            "total": len(applications),
            "stages": {},
            "conversion_rates": {},
            "avg_days_in_stage": {}
        }
        
        status_groups = {}
        for app in applications:
            status = app.status
            if status not in status_groups:
                status_groups[status] = []
            status_groups[status].append(app)
        
        # Calculate metrics for each stage
        stages = [
            "submitted", "under_review", "interviewed", 
            "offered", "hired", "rejected"
        ]
        
        for i, stage in enumerate(stages):
            if stage in status_groups:
                pipeline["stages"][stage] = len(status_groups[stage])
                
                # Calculate conversion rate to next stage
                if i < len(stages) - 2:  # Exclude rejected
                    next_stages = stages[i+1:-1]  # Exclude rejected
                    converted = sum(
                        len(status_groups.get(s, [])) 
                        for s in next_stages
                    )
                    total_at_stage = len(status_groups[stage])
                    pipeline["conversion_rates"][f"{stage}_to_next"] = (
                        (converted / total_at_stage * 100) 
                        if total_at_stage > 0 else 0
                    )
        
        return pipeline
    
    def add_team_member(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        user_email: str,
        position: str,
        can_post_jobs: bool = False,
        added_by: UUID
    ) -> Optional[EmployerProfile]:
        """Add a team member to company"""
        # Find user by email
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            return None
        
        # Check if already a member
        existing = self.employer_crud.get_by_user_id(db, user_id=user.id)
        if any(ep.company_id == company_id for ep in existing):
            return None
        
        # Create employer profile
        profile = EmployerProfileCreate(
            user_id=user.id,
            company_id=company_id,
            position=position,
            can_post_jobs=can_post_jobs
        )
        
        employer_profile = self.employer_crud.create(db, obj_in=profile)
        
        # Log addition
        self.log_action(
            "team_member_added",
            user_id=added_by,
            details={
                "company_id": str(company_id),
                "new_member_id": str(user.id),
                "position": position
            }
        )
        
        return employer_profile
    
    def get_competitor_analysis(
        self, 
        db: Session, 
        *, 
        company_id: UUID
    ) -> Dict[str, Any]:
        """Get competitor analysis based on industry and location"""
        company = self.get(db, id=company_id)
        if not company:
            return {}
        
        # Find similar companies
        competitors = db.query(Company).filter(
            and_(
                Company.id != company_id,
                Company.industry == company.industry,
                or_(
                    Company.city == company.city,
                    Company.country == company.country
                )
            )
        ).all()
        
        analysis = {
            "company": {
                "name": company.name,
                "active_jobs": company.active_jobs,
                "total_employees": company.total_employees
            },
            "competitors": [],
            "market_position": {},
            "insights": []
        }
        
        # Analyze competitors
        for competitor in competitors:
            comp_stats = self.crud.get_company_stats(db, company_id=competitor.id)
            analysis["competitors"].append({
                "name": competitor.name,
                "is_verified": competitor.is_verified,
                "active_jobs": competitor.active_jobs,
                "total_employees": competitor.total_employees,
                "total_hires": comp_stats.get("total_hires", 0)
            })
        
        # Calculate market position
        if competitors:
            job_ranks = sorted(
                [c.active_jobs for c in competitors] + [company.active_jobs],
                reverse=True
            )
            analysis["market_position"]["job_posting_rank"] = (
                job_ranks.index(company.active_jobs) + 1
            )
            analysis["market_position"]["total_companies"] = len(job_ranks)
        
        # Generate insights
        if company.active_jobs < sum(c.active_jobs for c in competitors) / len(competitors):
            analysis["insights"].append(
                "Your company has fewer active jobs than the industry average"
            )
        
        return analysis
    
    def get_recruitment_efficiency_metrics(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Calculate recruitment efficiency metrics"""
        if not date_from:
            date_from = datetime.utcnow() - timedelta(days=90)
        if not date_to:
            date_to = datetime.utcnow()
        
        # Get all applications in date range
        applications = db.query(Application).join(
            Job, Application.job_id == Job.id
        ).filter(
            and_(
                Job.company_id == company_id,
                Application.applied_at >= date_from,
                Application.applied_at <= date_to
            )
        ).all()
        
        metrics = {
            "total_applications": len(applications),
            "applications_per_hire": 0,
            "interview_to_hire_ratio": 0,
            "offer_acceptance_rate": 0,
            "ghost_rate": 0,
            "quality_of_hire_indicators": {}
        }
        
        # Calculate metrics
        hired = sum(1 for a in applications if a.status == "hired")
        interviewed = sum(1 for a in applications if a.interview_date is not None)
        offered = sum(1 for a in applications if a.status in ["offered", "hired"])
        accepted = sum(1 for a in applications if a.status == "hired")
        
        if hired > 0:
            metrics["applications_per_hire"] = len(applications) / hired
            if interviewed > 0:
                metrics["interview_to_hire_ratio"] = interviewed / hired
        
        if offered > 0:
            metrics["offer_acceptance_rate"] = (accepted / offered) * 100
        
        # Calculate ghost rate (candidates who stopped responding)
        ghosted = sum(
            1 for a in applications 
            if a.status == "under_review" and 
            (datetime.utcnow() - a.last_updated).days > 14
        )
        if len(applications) > 0:
            metrics["ghost_rate"] = (ghosted / len(applications)) * 100
        
        return metrics
    
    def _get_active_applications_count(
        self, 
        db: Session, 
        company_id: UUID
    ) -> int:
        """Count active applications for company"""
        return db.query(func.count(Application.id)).join(
            Job, Application.job_id == Job.id
        ).filter(
            and_(
                Job.company_id == company_id,
                Application.status.in_(["submitted", "under_review", "interviewed"])
            )
        ).scalar() or 0
    
    def _get_scheduled_interviews_count(
        self, 
        db: Session, 
        company_id: UUID
    ) -> int:
        """Count scheduled interviews for company"""
        return db.query(func.count(Application.id)).join(
            Job, Application.job_id == Job.id
        ).filter(
            and_(
                Job.company_id == company_id,
                Application.interview_date >= datetime.utcnow()
            )
        ).scalar() or 0
    
    def _get_pending_offers_count(
        self, 
        db: Session, 
        company_id: UUID
    ) -> int:
        """Count pending offers for company"""
        return db.query(func.count(Application.id)).join(
            Job, Application.job_id == Job.id
        ).filter(
            and_(
                Job.company_id == company_id,
                Application.status == "offered",
                Application.offer_response == "pending"
            )
        ).scalar() or 0
    
    def _get_hiring_funnel_stats(
        self, 
        db: Session, 
        company_id: UUID
    ) -> Dict[str, int]:
        """Get hiring funnel statistics"""
        stats = db.query(
            Application.status,
            func.count(Application.id)
        ).join(
            Job, Application.job_id == Job.id
        ).filter(
            Job.company_id == company_id
        ).group_by(
            Application.status
        ).all()
        
        return {status: count for status, count in stats}
    
    def _get_top_application_sources(
        self, 
        db: Session, 
        company_id: UUID,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get top sources of applications"""
        sources = db.query(
            Application.source,
            func.count(Application.id).label('count')
        ).join(
            Job, Application.job_id == Job.id
        ).filter(
            Job.company_id == company_id
        ).group_by(
            Application.source
        ).order_by(
            func.count(Application.id).desc()
        ).limit(limit).all()
        
        return [
            {"source": source or "direct", "count": count}
            for source, count in sources
        ]
    
    def _get_monthly_hiring_trends(
        self, 
        db: Session, 
        company_id: UUID,
        months: int = 6
    ) -> Dict[str, List[int]]:
        """Get monthly hiring trends"""
        start_date = datetime.utcnow() - timedelta(days=30 * months)
        
        applications = db.query(
            func.date_trunc('month', Application.applied_at).label('month'),
            func.count(Application.id).label('count')
        ).join(
            Job, Application.job_id == Job.id
        ).filter(
            and_(
                Job.company_id == company_id,
                Application.applied_at >= start_date
            )
        ).group_by(
            func.date_trunc('month', Application.applied_at)
        ).order_by('month').all()
        
        trends = {}
        for month, count in applications:
            month_key = month.strftime("%Y-%m")
            trends[month_key] = count
        
        return trends
    
    def get_company_employees(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        skip: int = 0,
        limit: int = 50
    ):
        """Get company employees/employer profiles"""
        return self.employer_crud.get_by_company(
            db, company_id=company_id, skip=skip, limit=limit
        )
    
    def get_company_contacts(
        self, 
        db: Session, 
        *, 
        company_id: UUID
    ):
        """Get company contacts"""
        return self.contact_crud.get_by_company(db, company_id=company_id)
    
    def add_company_contact(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        contact_data: CompanyContactCreate,
        created_by: UUID
    ):
        """Add a new company contact"""
        # Create new contact data with company_id
        contact_create = CompanyContactCreate(
            company_id=company_id,
            **contact_data.model_dump()
        )
        contact = self.contact_crud.create(db, obj_in=contact_create)
        
        # Log contact creation
        self.log_action(
            "company_contact_added",
            user_id=created_by,
            details={"company_id": str(company_id), "contact_name": contact.name}
        )
        
        return contact
    
    def update_company_contact(
        self, 
        db: Session, 
        *, 
        contact_id: UUID,
        update_data: CompanyContactUpdate,
        updated_by: UUID
    ):
        """Update a company contact"""
        contact = self.contact_crud.get(db, id=contact_id)
        if not contact:
            return None
        
        updated_contact = self.contact_crud.update(db, db_obj=contact, obj_in=update_data)
        
        # Log contact update
        self.log_action(
            "company_contact_updated",
            user_id=updated_by,
            details={"contact_id": str(contact_id), "contact_name": contact.name}
        )
        
        return updated_contact
    
    def delete_company_contact(
        self, 
        db: Session, 
        *, 
        contact_id: UUID,
        deleted_by: UUID
    ) -> bool:
        """Delete a company contact"""
        contact = self.contact_crud.get(db, id=contact_id)
        if not contact:
            return False
        
        self.contact_crud.remove(db, id=contact_id)
        
        # Log contact deletion
        self.log_action(
            "company_contact_deleted",
            user_id=deleted_by,
            details={"contact_id": str(contact_id), "contact_name": contact.name}
        )
        
        return True
    
    def get_hiring_preferences(
        self, 
        db: Session, 
        *, 
        company_id: UUID
    ):
        """Get company hiring preferences"""
        return self.preferences_crud.get_by_company(db, company_id=company_id)
    
    def update_hiring_preferences(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        update_data: CompanyHiringPreferencesUpdate,
        updated_by: UUID
    ):
        """Update company hiring preferences"""
        preferences = self.preferences_crud.create_or_update(
            db, company_id=company_id, obj_in=update_data
        )
        
        # Log preferences update
        self.log_action(
            "company_preferences_updated",
            user_id=updated_by,
            details={"company_id": str(company_id)}
        )
        
        return preferences
    
    def is_company_member(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        user_id: UUID
    ) -> bool:
        """Check if user is a member of the company"""
        employer_profiles = self.employer_crud.get_by_user_id(db, user_id=user_id)
        return any(ep.company_id == company_id for ep in employer_profiles)
    
    def get_company_analytics(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get company analytics and statistics"""
        # For now, return the same as dashboard stats
        # You can extend this to include date-filtered analytics
        return self.get_company_dashboard_stats(db, company_id=company_id)
    
    def get_company_jobs(
        self, 
        db: Session, 
        *, 
        company_id: UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List, int]:
        """Get all jobs posted by a company with optional filtering"""
        from app.models.job import Job
        from sqlalchemy import and_
        
        # Build query
        query = db.query(Job).filter(Job.company_id == company_id)
        
        # Apply status filter if provided
        if status:
            from app.models.enums import JobStatus
            try:
                job_status = JobStatus(status.upper())
                query = query.filter(Job.status == job_status)
            except ValueError:
                # Invalid status, return empty results
                return [], 0
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        jobs = query.order_by(Job.created_at.desc())\
                   .offset(skip)\
                   .limit(limit)\
                   .all()
        
        return jobs, total


# Create service instance
company_service = CompanyService()