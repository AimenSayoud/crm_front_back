# app/services/analytics.py
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, case, extract, desc, asc, text
from uuid import UUID
from datetime import datetime, timedelta, date
from decimal import Decimal
import calendar

from app.models.application import Application, ApplicationStatusHistory
from app.models.job import Job
from app.models.candidate import CandidateProfile, CandidateSkill
from app.models.company import Company, EmployerProfile
from app.models.consultant import ConsultantProfile
from app.models.user import User
from app.models.skill import Skill
from app.models.messaging import Message, Conversation
from app.models.enums import ApplicationStatus, JobStatus, UserRole
from app.services.base import BaseService


class AnalyticsService:
    """Service for analytics, reports, statistics, and insights"""
    
    def __init__(self):
        self.logger = None
    
    # ============== DASHBOARD OVERVIEW ==============
    
    def get_dashboard_overview(
        self, 
        db: Session,
        *,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Get comprehensive dashboard overview with key metrics"""
        if date_range:
            start_date, end_date = date_range
        else:
            # Default to last 30 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
        
        # Basic counts
        total_users = db.query(User).count()
        total_candidates = db.query(CandidateProfile).count()
        total_companies = db.query(Company).count()
        total_jobs = db.query(Job).count()
        total_applications = db.query(Application).count()
        
        # Active metrics (within date range)
        active_jobs = db.query(Job).filter(
            and_(
                Job.status == JobStatus.OPEN,
                Job.created_at >= start_date,
                Job.created_at <= end_date
            )
        ).count()
        
        new_applications = db.query(Application).filter(
            and_(
                Application.applied_at >= start_date,
                Application.applied_at <= end_date
            )
        ).count()
        
        # Success metrics
        hired_applications = db.query(Application).filter(
            and_(
                Application.status == ApplicationStatus.HIRED,
                Application.last_updated >= start_date,
                Application.last_updated <= end_date
            )
        ).count()
        
        # Growth metrics (compare to previous period)
        prev_start = start_date - (end_date - start_date)
        prev_end = start_date
        
        prev_applications = db.query(Application).filter(
            and_(
                Application.applied_at >= prev_start,
                Application.applied_at <= prev_end
            )
        ).count()
        
        application_growth = (
            ((new_applications - prev_applications) / prev_applications * 100)
            if prev_applications > 0 else 0
        )
        
        return {
            "overview": {
                "total_users": total_users,
                "total_candidates": total_candidates,
                "total_companies": total_companies,
                "total_jobs": total_jobs,
                "total_applications": total_applications
            },
            "active_metrics": {
                "active_jobs": active_jobs,
                "new_applications": new_applications,
                "hired_count": hired_applications,
                "application_growth_percent": round(application_growth, 2)
            },
            "conversion_rates": self.get_conversion_rates(db, start_date, end_date),
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            }
        }
    
    # ============== APPLICATION ANALYTICS ==============
    
    def get_application_analytics(
        self, 
        db: Session,
        *,
        company_id: Optional[UUID] = None,
        job_id: Optional[UUID] = None,
        consultant_id: Optional[UUID] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Get detailed application analytics with filtering"""
        query = db.query(Application)
        
        # Apply filters
        if company_id:
            query = query.join(Job).filter(Job.company_id == company_id)
        if job_id:
            query = query.filter(Application.job_id == job_id)
        if consultant_id:
            query = query.filter(Application.consultant_id == consultant_id)
        if date_range:
            start_date, end_date = date_range
            query = query.filter(
                and_(
                    Application.applied_at >= start_date,
                    Application.applied_at <= end_date
                )
            )
        
        applications = query.all()
        
        if not applications:
            return self._empty_application_analytics()
        
        # Status distribution
        status_counts = {}
        for app in applications:
            status_counts[app.status] = status_counts.get(app.status, 0) + 1
        
        # Time-to-hire analysis
        hired_apps = [app for app in applications if app.status == ApplicationStatus.HIRED]
        time_to_hire_days = []
        for app in hired_apps:
            if app.last_updated:
                days = (app.last_updated - app.applied_at).days
                time_to_hire_days.append(days)
        
        avg_time_to_hire = (
            sum(time_to_hire_days) / len(time_to_hire_days)
            if time_to_hire_days else 0
        )
        
        # Applications by month
        monthly_data = self._group_by_month(applications, 'applied_at')
        
        # Source analysis (if tracking application sources)
        source_data = self._analyze_application_sources(applications)
        
        return {
            "total_applications": len(applications),
            "status_distribution": status_counts,
            "conversion_rates": {
                "application_to_interview": self._calculate_conversion_rate(
                    applications, 
                    ApplicationStatus.SUBMITTED, 
                    [ApplicationStatus.INTERVIEWED, ApplicationStatus.OFFERED, ApplicationStatus.HIRED]
                ),
                "interview_to_offer": self._calculate_conversion_rate(
                    applications,
                    ApplicationStatus.INTERVIEWED,
                    [ApplicationStatus.OFFERED, ApplicationStatus.HIRED]
                ),
                "offer_to_hire": self._calculate_conversion_rate(
                    applications,
                    ApplicationStatus.OFFERED,
                    [ApplicationStatus.HIRED]
                )
            },
            "time_metrics": {
                "average_time_to_hire_days": round(avg_time_to_hire, 1),
                "applications_this_month": monthly_data.get(datetime.now().strftime("%Y-%m"), 0)
            },
            "monthly_trends": monthly_data,
            "source_analysis": source_data
        }
    
    # ============== JOB ANALYTICS ==============
    
    def get_job_analytics(
        self, 
        db: Session,
        *,
        company_id: Optional[UUID] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Get job posting and performance analytics"""
        query = db.query(Job)
        
        if company_id:
            query = query.filter(Job.company_id == company_id)
        if date_range:
            start_date, end_date = date_range
            query = query.filter(
                and_(
                    Job.created_at >= start_date,
                    Job.created_at <= end_date
                )
            )
        
        jobs = query.all()
        
        # Job status distribution
        status_counts = {}
        for job in jobs:
            status_counts[job.status] = status_counts.get(job.status, 0) + 1
        
        # Applications per job
        job_application_counts = []
        for job in jobs:
            app_count = db.query(Application).filter(Application.job_id == job.id).count()
            job_application_counts.append({
                "job_id": str(job.id),
                "job_title": job.title,
                "application_count": app_count,
                "created_at": job.created_at.isoformat(),
                "status": job.status
            })
        
        # Sort by application count
        job_application_counts.sort(key=lambda x: x["application_count"], reverse=True)
        
        # Time to fill analysis
        filled_jobs = [job for job in jobs if job.status == JobStatus.FILLED]
        time_to_fill_days = []
        for job in filled_jobs:
            if job.updated_at:
                days = (job.updated_at - job.created_at).days
                time_to_fill_days.append(days)
        
        avg_time_to_fill = (
            sum(time_to_fill_days) / len(time_to_fill_days)
            if time_to_fill_days else 0
        )
        
        # Skills demand analysis
        skills_demand = self._analyze_skills_demand(db, jobs)
        
        return {
            "total_jobs": len(jobs),
            "status_distribution": status_counts,
            "performance_metrics": {
                "average_applications_per_job": (
                    sum(job["application_count"] for job in job_application_counts) / len(jobs)
                    if jobs else 0
                ),
                "average_time_to_fill_days": round(avg_time_to_fill, 1),
                "fill_rate": (len(filled_jobs) / len(jobs) * 100) if jobs else 0
            },
            "top_performing_jobs": job_application_counts[:10],
            "skills_in_demand": skills_demand,
            "monthly_job_postings": self._group_by_month(jobs, 'created_at')
        }
    
    # ============== CANDIDATE ANALYTICS ==============
    
    def get_candidate_analytics(
        self, 
        db: Session,
        *,
        consultant_id: Optional[UUID] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Get candidate pool and performance analytics"""
        query = db.query(CandidateProfile).join(User)
        
        if date_range:
            start_date, end_date = date_range
            query = query.filter(
                and_(
                    CandidateProfile.created_at >= start_date,
                    CandidateProfile.created_at <= end_date
                )
            )
        
        candidates = query.all()
        
        # Profile completion analysis
        completed_profiles = sum(1 for c in candidates if c.profile_completed)
        completion_rate = (completed_profiles / len(candidates) * 100) if candidates else 0
        
        # Experience distribution
        experience_distribution = {
            "0-2 years": 0,
            "3-5 years": 0,
            "6-10 years": 0,
            "10+ years": 0
        }
        
        for candidate in candidates:
            years = candidate.years_of_experience or 0
            if years <= 2:
                experience_distribution["0-2 years"] += 1
            elif years <= 5:
                experience_distribution["3-5 years"] += 1
            elif years <= 10:
                experience_distribution["6-10 years"] += 1
            else:
                experience_distribution["10+ years"] += 1
        
        # Location distribution
        location_counts = {}
        for candidate in candidates:
            location = candidate.city or "Unknown"
            location_counts[location] = location_counts.get(location, 0) + 1
        
        # Top skills analysis
        top_skills = self._analyze_candidate_skills(db, candidates)
        
        # Application success rates by candidate
        candidate_success_metrics = self._analyze_candidate_success_rates(db, candidates)
        
        return {
            "total_candidates": len(candidates),
            "profile_completion_rate": round(completion_rate, 1),
            "experience_distribution": experience_distribution,
            "location_distribution": dict(sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]),
            "top_skills": top_skills,
            "success_metrics": candidate_success_metrics,
            "monthly_registrations": self._group_by_month(candidates, 'created_at')
        }
    
    # ============== CONSULTANT ANALYTICS ==============
    
    def get_consultant_analytics(
        self, 
        db: Session,
        *,
        consultant_id: Optional[UUID] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Get consultant performance analytics"""
        query = db.query(Application)
        
        if consultant_id:
            query = query.filter(Application.consultant_id == consultant_id)
        if date_range:
            start_date, end_date = date_range
            query = query.filter(
                and_(
                    Application.applied_at >= start_date,
                    Application.applied_at <= end_date
                )
            )
        
        applications = query.all()
        
        # Group by consultant
        consultant_metrics = {}
        for app in applications:
            if app.consultant_id:
                consultant_id_str = str(app.consultant_id)
                if consultant_id_str not in consultant_metrics:
                    consultant_metrics[consultant_id_str] = {
                        "total_applications": 0,
                        "hired": 0,
                        "interviewed": 0,
                        "applications": []
                    }
                
                consultant_metrics[consultant_id_str]["total_applications"] += 1
                consultant_metrics[consultant_id_str]["applications"].append(app)
                
                if app.status == ApplicationStatus.HIRED:
                    consultant_metrics[consultant_id_str]["hired"] += 1
                elif app.status in [ApplicationStatus.INTERVIEWED, ApplicationStatus.OFFERED]:
                    consultant_metrics[consultant_id_str]["interviewed"] += 1
        
        # Calculate success rates
        for consultant_id, metrics in consultant_metrics.items():
            total = metrics["total_applications"]
            metrics["hire_rate"] = (metrics["hired"] / total * 100) if total > 0 else 0
            metrics["interview_rate"] = (metrics["interviewed"] / total * 100) if total > 0 else 0
        
        # Get consultant details
        consultant_performance = []
        for consultant_id, metrics in consultant_metrics.items():
            consultant = db.query(ConsultantProfile).filter(
                ConsultantProfile.id == consultant_id
            ).first()
            
            if consultant:
                consultant_performance.append({
                    "consultant_id": consultant_id,
                    "consultant_name": f"{consultant.user.first_name} {consultant.user.last_name}",
                    "total_applications": metrics["total_applications"],
                    "hired_count": metrics["hired"],
                    "hire_rate": round(metrics["hire_rate"], 1),
                    "interview_rate": round(metrics["interview_rate"], 1)
                })
        
        # Sort by hire rate
        consultant_performance.sort(key=lambda x: x["hire_rate"], reverse=True)
        
        return {
            "total_consultants": len(consultant_metrics),
            "consultant_performance": consultant_performance,
            "overall_metrics": {
                "total_applications": len(applications),
                "total_hired": sum(metrics["hired"] for metrics in consultant_metrics.values()),
                "average_hire_rate": (
                    sum(metrics["hire_rate"] for metrics in consultant_metrics.values()) / len(consultant_metrics)
                    if consultant_metrics else 0
                )
            }
        }
    
    # ============== COMPANY ANALYTICS ==============
    
    def get_company_analytics(
        self, 
        db: Session,
        *,
        company_id: Optional[UUID] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Get company hiring and performance analytics"""
        query = db.query(Company)
        
        if company_id:
            query = query.filter(Company.id == company_id)
        
        companies = query.all()
        
        company_metrics = []
        for company in companies:
            # Get jobs for this company
            job_query = db.query(Job).filter(Job.company_id == company.id)
            if date_range:
                start_date, end_date = date_range
                job_query = job_query.filter(
                    and_(
                        Job.created_at >= start_date,
                        Job.created_at <= end_date
                    )
                )
            
            jobs = job_query.all()
            
            # Get applications for company jobs
            job_ids = [job.id for job in jobs]
            applications = db.query(Application).filter(
                Application.job_id.in_(job_ids)
            ).all() if job_ids else []
            
            # Calculate metrics
            hired_count = sum(1 for app in applications if app.status == ApplicationStatus.HIRED)
            
            company_metrics.append({
                "company_id": str(company.id),
                "company_name": company.name,
                "total_jobs": len(jobs),
                "total_applications": len(applications),
                "hired_count": hired_count,
                "hire_rate": (hired_count / len(applications) * 100) if applications else 0,
                "avg_applications_per_job": (len(applications) / len(jobs)) if jobs else 0
            })
        
        # Sort by total applications
        company_metrics.sort(key=lambda x: x["total_applications"], reverse=True)
        
        return {
            "total_companies": len(companies),
            "company_performance": company_metrics,
            "top_hiring_companies": company_metrics[:10]
        }
    
    # ============== HELPER METHODS ==============
    
    def get_conversion_rates(
        self, 
        db: Session, 
        start_date: datetime, 
        end_date: datetime
    ) -> Dict[str, float]:
        """Calculate conversion rates for the application funnel"""
        applications = db.query(Application).filter(
            and_(
                Application.applied_at >= start_date,
                Application.applied_at <= end_date
            )
        ).all()
        
        if not applications:
            return {
                "application_to_review": 0,
                "review_to_interview": 0,
                "interview_to_offer": 0,
                "offer_to_hire": 0
            }
        
        total = len(applications)
        reviewed = sum(1 for app in applications if app.status != ApplicationStatus.SUBMITTED)
        interviewed = sum(1 for app in applications if app.status in [
            ApplicationStatus.INTERVIEWED, ApplicationStatus.OFFERED, ApplicationStatus.HIRED
        ])
        offered = sum(1 for app in applications if app.status in [
            ApplicationStatus.OFFERED, ApplicationStatus.HIRED
        ])
        hired = sum(1 for app in applications if app.status == ApplicationStatus.HIRED)
        
        return {
            "application_to_review": (reviewed / total * 100) if total > 0 else 0,
            "review_to_interview": (interviewed / reviewed * 100) if reviewed > 0 else 0,
            "interview_to_offer": (offered / interviewed * 100) if interviewed > 0 else 0,
            "offer_to_hire": (hired / offered * 100) if offered > 0 else 0
        }
    
    def _empty_application_analytics(self) -> Dict[str, Any]:
        """Return empty analytics structure"""
        return {
            "total_applications": 0,
            "status_distribution": {},
            "conversion_rates": {
                "application_to_interview": 0,
                "interview_to_offer": 0,
                "offer_to_hire": 0
            },
            "time_metrics": {
                "average_time_to_hire_days": 0,
                "applications_this_month": 0
            },
            "monthly_trends": {},
            "source_analysis": {}
        }
    
    def _calculate_conversion_rate(
        self, 
        applications: List[Application], 
        from_status: ApplicationStatus,
        to_statuses: List[ApplicationStatus]
    ) -> float:
        """Calculate conversion rate between application statuses"""
        from_count = sum(1 for app in applications if app.status == from_status)
        to_count = sum(1 for app in applications if app.status in to_statuses)
        
        return (to_count / from_count * 100) if from_count > 0 else 0
    
    def _group_by_month(self, items: List[Any], date_field: str) -> Dict[str, int]:
        """Group items by month"""
        monthly_data = {}
        for item in items:
            date_value = getattr(item, date_field)
            if date_value:
                month_key = date_value.strftime("%Y-%m")
                monthly_data[month_key] = monthly_data.get(month_key, 0) + 1
        
        return monthly_data
    
    def _analyze_application_sources(self, applications: List[Application]) -> Dict[str, int]:
        """Analyze application sources (if tracking)"""
        # This would be implemented based on how you track application sources
        # For now, return empty dict
        return {}
    
    def _analyze_skills_demand(self, db: Session, jobs: List[Job]) -> List[Dict[str, Any]]:
        """Analyze which skills are most in demand"""
        job_ids = [job.id for job in jobs]
        if not job_ids:
            return []
        
        # This assumes JobSkillRequirement model exists
        skill_counts = db.query(
            Skill.name,
            func.count(Skill.id).label('count')
        ).join(
            Job.skill_requirements
        ).filter(
            Job.id.in_(job_ids)
        ).group_by(
            Skill.name
        ).order_by(
            desc('count')
        ).limit(10).all()
        
        return [
            {"skill": skill, "demand_count": count}
            for skill, count in skill_counts
        ]
    
    def _analyze_candidate_skills(self, db: Session, candidates: List[CandidateProfile]) -> List[Dict[str, Any]]:
        """Analyze most common candidate skills"""
        candidate_ids = [c.id for c in candidates]
        if not candidate_ids:
            return []
        
        skill_counts = db.query(
            Skill.name,
            func.count(Skill.id).label('count')
        ).join(
            CandidateSkill.skill
        ).filter(
            CandidateSkill.candidate_id.in_(candidate_ids)
        ).group_by(
            Skill.name
        ).order_by(
            desc('count')
        ).limit(10).all()
        
        return [
            {"skill": skill, "candidate_count": count}
            for skill, count in skill_counts
        ]
    
    def _analyze_candidate_success_rates(self, db: Session, candidates: List[CandidateProfile]) -> Dict[str, Any]:
        """Analyze candidate application success rates"""
        candidate_ids = [c.id for c in candidates]
        if not candidate_ids:
            return {"average_applications_per_candidate": 0, "average_success_rate": 0}
        
        total_applications = db.query(Application).filter(
            Application.candidate_id.in_(candidate_ids)
        ).count()
        
        hired_applications = db.query(Application).filter(
            and_(
                Application.candidate_id.in_(candidate_ids),
                Application.status == ApplicationStatus.HIRED
            )
        ).count()
        
        return {
            "average_applications_per_candidate": round(total_applications / len(candidates), 1),
            "average_success_rate": round((hired_applications / total_applications * 100), 1) if total_applications > 0 else 0
        }


# Create service instance
analytics_service = AnalyticsService()