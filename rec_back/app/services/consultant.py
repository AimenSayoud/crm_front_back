# app/services/consultant.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from datetime import datetime, timedelta, date
from decimal import Decimal

from app.models.consultant import (
    ConsultantProfile, ConsultantStatus, ConsultantTarget,
    ConsultantPerformanceReview, ConsultantCandidate, ConsultantClient
)
from app.models.application import Application, ApplicationStatus
from app.models.job import Job
from app.schemas.consultant import (
    ConsultantProfileCreate, ConsultantProfileUpdate,
    ConsultantTargetCreate, ConsultantPerformanceReviewCreate,
    ConsultantSearchFilters
)
from app.crud import consultant as consultant_crud
from app.services.base import BaseService


class ConsultantService(BaseService[ConsultantProfile, consultant_crud.CRUDConsultantProfile]):
    """Service for consultant operations and performance management"""
    
    def __init__(self):
        super().__init__(consultant_crud.consultant_profile)
        self.target_crud = consultant_crud.consultant_target
        self.review_crud = consultant_crud.consultant_performance_review
        self.candidate_crud = consultant_crud.consultant_candidate
        self.client_crud = consultant_crud.consultant_client
    
    def onboard_consultant(
        self, 
        db: Session, 
        *, 
        user_id: UUID,
        profile_data: ConsultantProfileCreate,
        onboarded_by: UUID
    ) -> ConsultantProfile:
        """Complete consultant onboarding process"""
        # Create consultant profile
        consultant = self.crud.create(db, obj_in=profile_data)
        
        # Set initial targets
        self._create_initial_targets(db, consultant_id=consultant.id)
        
        # Assign to manager if specified
        if profile_data.manager_id:
            self._assign_to_manager(db, consultant.id, profile_data.manager_id)
        
        # Log onboarding
        self.log_action(
            "consultant_onboarded",
            user_id=onboarded_by,
            details={
                "consultant_id": str(consultant.id),
                "user_id": str(user_id)
            }
        )
        
        return consultant
    
    def update_consultant_status(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        new_status: ConsultantStatus,
        reason: Optional[str] = None,
        updated_by: UUID
    ) -> Optional[ConsultantProfile]:
        """Update consultant status with validation"""
        consultant = self.get(db, id=consultant_id)
        if not consultant:
            return None
        
        old_status = consultant.status
        consultant.status = new_status
        
        # Handle status-specific actions
        if new_status == ConsultantStatus.INACTIVE:
            # Reassign active candidates and clients
            self._handle_consultant_deactivation(db, consultant_id)
        elif new_status == ConsultantStatus.ACTIVE and old_status != ConsultantStatus.ACTIVE:
            # Reactivation
            consultant.availability_status = "available"
        
        # Log status change
        self.log_action(
            "consultant_status_changed",
            user_id=updated_by,
            details={
                "consultant_id": str(consultant_id),
                "old_status": old_status,
                "new_status": new_status,
                "reason": reason
            }
        )
        
        db.commit()
        return consultant
    
    def get_consultant_dashboard(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID
    ) -> Dict[str, Any]:
        """Get comprehensive consultant dashboard data"""
        consultant = self.crud.get_with_details(db, id=consultant_id)
        if not consultant:
            return {}
        
        dashboard = {
            "profile": {
                "id": consultant.id,
                "name": consultant.user.full_name,
                "status": consultant.status,
                "rating": consultant.average_rating,
                "total_placements": consultant.total_placements
            },
            "current_metrics": self._get_current_period_metrics(db, consultant_id),
            "active_assignments": {
                "candidates": len([c for c in consultant.candidate_assignments if c.is_active]),
                "clients": len([c for c in consultant.client_assignments if c.is_active]),
                "applications": self._get_active_applications_count(db, consultant_id)
            },
            "targets": self._get_current_targets(db, consultant_id),
            "recent_activity": self._get_recent_activity(db, consultant_id),
            "upcoming_tasks": self._get_upcoming_tasks(db, consultant_id),
            "performance_trend": self._get_performance_trend(db, consultant_id)
        }
        
        return dashboard
    
    def assign_candidate_to_consultant(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        candidate_id: UUID,
        assignment_reason: Optional[str] = None,
        assigned_by: UUID
    ) -> ConsultantCandidate:
        """Assign candidate to consultant with workload check"""
        consultant = self.get(db, id=consultant_id)
        if not consultant or consultant.status != ConsultantStatus.ACTIVE:
            raise ValueError("Consultant is not active")
        
        # Check workload
        active_assignments = self.candidate_crud.get_consultant_candidates(
            db, consultant_id=consultant_id
        )
        active_count = sum(1 for a in active_assignments if a.is_active)
        
        if active_count >= (consultant.max_concurrent_assignments or 10):
            raise ValueError("Consultant has reached maximum assignment capacity")
        
        # Create assignment
        assignment = self.candidate_crud.assign_candidate(
            db,
            consultant_id=consultant_id,
            candidate_id=candidate_id,
            notes=assignment_reason
        )
        
        # Update consultant metrics
        consultant.current_active_jobs += 1
        
        # Log assignment
        self.log_action(
            "candidate_assigned_to_consultant",
            user_id=assigned_by,
            details={
                "consultant_id": str(consultant_id),
                "candidate_id": str(candidate_id),
                "reason": assignment_reason
            }
        )
        
        db.commit()
        return assignment
    
    def assign_client_to_consultant(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        company_id: UUID,
        is_primary: bool = False,
        assignment_notes: Optional[str] = None,
        assigned_by: UUID
    ) -> ConsultantClient:
        """Assign client company to consultant"""
        consultant = self.get(db, id=consultant_id)
        if not consultant or consultant.status != ConsultantStatus.ACTIVE:
            raise ValueError("Consultant is not active")
        
        # Create assignment
        assignment = self.client_crud.assign_client(
            db,
            consultant_id=consultant_id,
            company_id=company_id,
            is_primary=is_primary,
            notes=assignment_notes
        )
        
        # Log assignment
        self.log_action(
            "client_assigned_to_consultant",
            user_id=assigned_by,
            details={
                "consultant_id": str(consultant_id),
                "company_id": str(company_id),
                "is_primary": is_primary
            }
        )
        
        return assignment
    
    def record_placement(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        application_id: UUID,
        placement_fee: Optional[Decimal] = None
    ) -> bool:
        """Record successful placement by consultant"""
        consultant = self.get(db, id=consultant_id)
        application = db.query(Application).filter(
            Application.id == application_id
        ).first()
        
        if not consultant or not application:
            return False
        
        # Update consultant metrics
        consultant.total_placements += 1
        consultant.successful_placements += 1
        consultant.this_month_placements += 1
        
        if placement_fee:
            consultant.total_revenue_generated = (
                (consultant.total_revenue_generated or 0) + placement_fee
            )
            consultant.this_quarter_revenue = (
                (consultant.this_quarter_revenue or 0) + placement_fee
            )
        
        # Update candidate assignment metrics
        self.candidate_crud.update_metrics(
            db,
            consultant_id=consultant_id,
            candidate_id=application.candidate_id,
            metric_type="placement"
        )
        
        # Update client assignment metrics
        job = application.job
        if job:
            self.client_crud.update_performance(
                db,
                consultant_id=consultant_id,
                company_id=job.company_id,
                metric_type="placement"
            )
        
        db.commit()
        return True
    
    def create_performance_review(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        review_data: ConsultantPerformanceReviewCreate,
        reviewer_id: UUID
    ) -> ConsultantPerformanceReview:
        """Create performance review for consultant"""
        # Calculate overall rating
        ratings = [
            review_data.communication_rating,
            review_data.client_satisfaction_rating,
            review_data.target_achievement_rating,
            review_data.teamwork_rating,
            review_data.innovation_rating
        ]
        valid_ratings = [r for r in ratings if r is not None]
        
        if valid_ratings:
            review_data.overall_rating = sum(valid_ratings) / len(valid_ratings)
        
        # Create review
        review = self.review_crud.create(db, obj_in=review_data)
        
        # Update consultant's average rating if approved
        if review.status == "approved":
            self._update_consultant_rating(db, consultant_id)
        
        return review
    
    def get_team_performance(
        self, 
        db: Session, 
        *, 
        manager_id: UUID
    ) -> Dict[str, Any]:
        """Get performance metrics for consultant's team"""
        # Get team members
        team_members = db.query(ConsultantProfile).filter(
            ConsultantProfile.manager_id == manager_id
        ).all()
        
        if not team_members:
            return {"team_size": 0, "message": "No team members found"}
        
        # Aggregate metrics
        team_metrics = {
            "team_size": len(team_members),
            "total_placements": sum(m.total_placements for m in team_members),
            "total_revenue": sum(m.total_revenue_generated or 0 for m in team_members),
            "average_rating": sum(m.average_rating or 0 for m in team_members if m.average_rating) / len(team_members),
            "members": []
        }
        
        # Individual member performance
        for member in team_members:
            current_targets = self.target_crud.get_current_targets(
                db, 
                consultant_id=member.id,
                target_period="monthly"
            )
            
            team_metrics["members"].append({
                "id": member.id,
                "name": member.user.full_name,
                "status": member.status,
                "placements_this_month": member.this_month_placements,
                "target_achievement": self._calculate_target_achievement(current_targets),
                "rating": member.average_rating
            })
        
        # Sort by performance
        team_metrics["members"].sort(
            key=lambda x: x["placements_this_month"], 
            reverse=True
        )
        
        return team_metrics
    
    def get_consultant_availability(
        self, 
        db: Session, 
        *, 
        skills_required: Optional[List[str]] = None,
        location: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Find available consultants based on criteria"""
        query = db.query(ConsultantProfile).filter(
            and_(
                ConsultantProfile.status == ConsultantStatus.ACTIVE,
                ConsultantProfile.availability_status == "available"
            )
        )
        
        consultants = query.all()
        
        # Calculate availability score
        availability_list = []
        for consultant in consultants:
            score = self._calculate_availability_score(consultant)
            
            # Check skill match if required
            if skills_required:
                skill_match = self._calculate_skill_match(
                    consultant.specializations or [],
                    skills_required
                )
                if skill_match < 0.3:  # Minimum threshold
                    continue
                score *= skill_match
            
            availability_list.append({
                "consultant_id": consultant.id,
                "name": consultant.user.full_name,
                "current_load": consultant.current_active_jobs,
                "capacity": consultant.max_concurrent_assignments or 10,
                "availability_score": score,
                "specializations": consultant.specializations,
                "rating": consultant.average_rating
            })
        
        # Sort by availability score
        availability_list.sort(key=lambda x: x["availability_score"], reverse=True)
        
        return availability_list
    
    def generate_performance_report(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Generate detailed performance report for consultant"""
        consultant = self.crud.get_with_details(db, id=consultant_id)
        if not consultant:
            return {}
        
        # Get applications handled in period
        applications = db.query(Application).filter(
            and_(
                Application.consultant_id == consultant_id,
                Application.applied_at >= start_date,
                Application.applied_at <= end_date
            )
        ).all()
        
        report = {
            "consultant": {
                "id": consultant.id,
                "name": consultant.user.full_name,
                "department": consultant.department,
                "manager": consultant.manager.user.full_name if consultant.manager else None
            },
            "period": {
                "start": start_date,
                "end": end_date
            },
            "metrics": {
                "applications_managed": len(applications),
                "interviews_scheduled": sum(1 for a in applications if a.interview_date),
                "offers_made": sum(1 for a in applications if a.status == ApplicationStatus.OFFERED),
                "successful_placements": sum(1 for a in applications if a.status == ApplicationStatus.HIRED),
                "rejection_rate": (
                    sum(1 for a in applications if a.status == ApplicationStatus.REJECTED) / 
                    len(applications) * 100
                ) if applications else 0
            },
            "client_metrics": self._get_client_metrics(db, consultant_id, start_date, end_date),
            "revenue_generated": self._calculate_period_revenue(db, consultant_id, start_date, end_date),
            "target_achievement": self._get_target_achievement_details(db, consultant_id, start_date, end_date),
            "strengths": [],
            "areas_for_improvement": []
        }
        
        # Analyze performance
        if report["metrics"]["successful_placements"] > 5:
            report["strengths"].append("High placement rate")
        
        if report["metrics"]["rejection_rate"] > 50:
            report["areas_for_improvement"].append("High rejection rate - review candidate screening process")
        
        return report
    
    def _create_initial_targets(self, db: Session, consultant_id: UUID):
        """Create initial targets for new consultant"""
        current_date = datetime.utcnow()
        
        # Monthly target
        monthly_target = ConsultantTargetCreate(
            consultant_id=consultant_id,
            target_period="monthly",
            target_year=current_date.year,
            target_month=current_date.month,
            placement_target=2,  # Start with modest targets
            revenue_target=Decimal("10000"),
            client_satisfaction_target=Decimal("4.0")
        )
        self.target_crud.create(db, obj_in=monthly_target)
        
        # Quarterly target
        quarter = (current_date.month - 1) // 3 + 1
        quarterly_target = ConsultantTargetCreate(
            consultant_id=consultant_id,
            target_period="quarterly",
            target_year=current_date.year,
            target_quarter=quarter,
            placement_target=6,
            revenue_target=Decimal("30000"),
            client_satisfaction_target=Decimal("4.0")
        )
        self.target_crud.create(db, obj_in=quarterly_target)
    
    def _assign_to_manager(self, db: Session, consultant_id: UUID, manager_id: UUID):
        """Assign consultant to manager"""
        consultant = self.get(db, id=consultant_id)
        manager = self.get(db, id=manager_id)
        
        if consultant and manager:
            consultant.manager_id = manager_id
            db.commit()
    
    def _handle_consultant_deactivation(self, db: Session, consultant_id: UUID):
        """Handle consultant deactivation - reassign work"""
        # Deactivate all candidate assignments
        db.query(ConsultantCandidate).filter(
            and_(
                ConsultantCandidate.consultant_id == consultant_id,
                ConsultantCandidate.is_active == True
            )
        ).update({"is_active": False, "unassigned_date": datetime.utcnow()})
        
        # Deactivate all client assignments
        db.query(ConsultantClient).filter(
            and_(
                ConsultantClient.consultant_id == consultant_id,
                ConsultantClient.is_active == True
            )
        ).update({"is_active": False, "unassigned_date": datetime.utcnow()})
        
        # Find applications that need reassignment
        active_applications = db.query(Application).filter(
            and_(
                Application.consultant_id == consultant_id,
                Application.status.in_([
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.INTERVIEWED
                ])
            )
        ).all()
        
        # Log applications needing reassignment
        if active_applications:
            self.log_action(
                "consultant_deactivation_reassignment_needed",
                user_id=consultant_id,
                details={
                    "applications_needing_reassignment": [
                        str(a.id) for a in active_applications
                    ]
                }
            )
    
    def _get_current_period_metrics(
        self, 
        db: Session, 
        consultant_id: UUID
    ) -> Dict[str, Any]:
        """Get current period performance metrics"""
        consultant = self.get(db, id=consultant_id)
        if not consultant:
            return {}
        
        current_date = datetime.utcnow()
        month_start = date(current_date.year, current_date.month, 1)
        
        # Get applications this month
        month_applications = db.query(Application).filter(
            and_(
                Application.consultant_id == consultant_id,
                Application.applied_at >= month_start
            )
        ).all()
        
        return {
            "placements_this_month": consultant.this_month_placements,
            "applications_this_month": len(month_applications),
            "interviews_scheduled": sum(
                1 for a in month_applications 
                if a.interview_date and a.interview_date >= datetime.utcnow()
            ),
            "revenue_this_quarter": consultant.this_quarter_revenue or 0
        }
    
    def _get_current_targets(
        self, 
        db: Session, 
        consultant_id: UUID
    ) -> Dict[str, Any]:
        """Get current period targets and achievement"""
        monthly_target = self.target_crud.get_current_targets(
            db, 
            consultant_id=consultant_id,
            target_period="monthly"
        )
        
        if not monthly_target:
            return {"message": "No targets set"}
        
        return {
            "monthly": {
                "placement_target": monthly_target.placement_target,
                "placement_actual": monthly_target.actual_placements,
                "placement_achievement": (
                    (monthly_target.actual_placements / monthly_target.placement_target * 100)
                    if monthly_target.placement_target else 0
                ),
                "revenue_target": monthly_target.revenue_target,
                "revenue_actual": monthly_target.actual_revenue,
                "revenue_achievement": (
                    (monthly_target.actual_revenue / monthly_target.revenue_target * 100)
                    if monthly_target.revenue_target else 0
                )
            }
        }
    
    def _get_recent_activity(
        self, 
        db: Session, 
        consultant_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent consultant activity"""
        # Get recent applications
        recent_apps = db.query(Application).filter(
            Application.consultant_id == consultant_id
        ).order_by(
            desc(Application.last_updated)
        ).limit(limit).all()
        
        activities = []
        for app in recent_apps:
            activities.append({
                "type": "application_update",
                "date": app.last_updated,
                "description": f"Updated application for {app.candidate.user.full_name}",
                "status": app.status
            })
        
        return activities
    
    def _get_upcoming_tasks(
        self, 
        db: Session, 
        consultant_id: UUID
    ) -> List[Dict[str, Any]]:
        """Get upcoming tasks for consultant"""
        tasks = []
        
        # Upcoming interviews
        upcoming_interviews = db.query(Application).filter(
            and_(
                Application.consultant_id == consultant_id,
                Application.interview_date >= datetime.utcnow()
            )
        ).order_by(asc(Application.interview_date)).limit(5).all()
        
        for app in upcoming_interviews:
            tasks.append({
                "type": "interview",
                "date": app.interview_date,
                "title": f"Interview: {app.candidate.user.full_name}",
                "job": app.job.title,
                "priority": "high"
            })
        
        # Pending offers
        pending_offers = db.query(Application).filter(
            and_(
                Application.consultant_id == consultant_id,
                Application.status == ApplicationStatus.OFFERED,
                Application.offer_response == "pending"
            )
        ).all()
        
        for app in pending_offers:
            tasks.append({
                "type": "follow_up",
                "date": app.offer_expiry_date,
                "title": f"Follow up on offer: {app.candidate.user.full_name}",
                "priority": "high"
            })
        
        # Sort by date
        tasks.sort(key=lambda x: x["date"] if x["date"] else datetime.max)
        
        return tasks[:10]
    
    def _get_performance_trend(
        self, 
        db: Session, 
        consultant_id: UUID,
        months: int = 6
    ) -> List[Dict[str, Any]]:
        """Get performance trend over time"""
        trend = []
        current_date = datetime.utcnow()
        
        for i in range(months):
            month_date = current_date - timedelta(days=30 * i)
            month_start = date(month_date.year, month_date.month, 1)
            
            if month_date.month == 12:
                month_end = date(month_date.year + 1, 1, 1)
            else:
                month_end = date(month_date.year, month_date.month + 1, 1)
            
            # Get metrics for month
            placements = db.query(func.count(Application.id)).filter(
                and_(
                    Application.consultant_id == consultant_id,
                    Application.status == ApplicationStatus.HIRED,
                    Application.last_updated >= month_start,
                    Application.last_updated < month_end
                )
            ).scalar()
            
            trend.append({
                "month": month_date.strftime("%Y-%m"),
                "placements": placements or 0
            })
        
        trend.reverse()
        return trend
    
    def _update_consultant_rating(self, db: Session, consultant_id: UUID):
        """Update consultant's average rating from reviews"""
        reviews = self.review_crud.get_by_consultant(db, consultant_id=consultant_id)
        approved_reviews = [r for r in reviews if r.status == "approved" and r.overall_rating]
        
        if approved_reviews:
            avg_rating = sum(r.overall_rating for r in approved_reviews) / len(approved_reviews)
            consultant = self.get(db, id=consultant_id)
            if consultant:
                consultant.average_rating = Decimal(str(round(avg_rating, 2)))
                db.commit()
    
    def _calculate_target_achievement(
        self, 
        target: Optional[ConsultantTarget]
    ) -> float:
        """Calculate overall target achievement percentage"""
        if not target:
            return 0.0
        
        achievements = []
        
        if target.placement_target:
            achievements.append(
                (target.actual_placements / target.placement_target) * 100
            )
        
        if target.revenue_target:
            achievements.append(
                (target.actual_revenue / target.revenue_target) * 100
            )
        
        return sum(achievements) / len(achievements) if achievements else 0.0
    
    def _calculate_availability_score(
        self, 
        consultant: ConsultantProfile
    ) -> float:
        """Calculate consultant availability score"""
        max_capacity = consultant.max_concurrent_assignments or 10
        current_load = consultant.current_active_jobs
        
        # Base availability on current load
        load_ratio = current_load / max_capacity
        availability = 1.0 - load_ratio
        
        # Adjust for performance
        if consultant.average_rating:
            availability *= (consultant.average_rating / 5.0)
        
        return max(0, min(1, availability))
    
    def _calculate_skill_match(
        self, 
        consultant_skills: List[str], 
        required_skills: List[str]
    ) -> float:
        """Calculate skill match percentage"""
        if not required_skills:
            return 1.0
        
        if not consultant_skills:
            return 0.0
        
        # Convert to lowercase for comparison
        consultant_skills_lower = [s.lower() for s in consultant_skills]
        matches = sum(
            1 for skill in required_skills 
            if skill.lower() in consultant_skills_lower
        )
        
        return matches / len(required_skills)
    
    def _get_client_metrics(
        self, 
        db: Session, 
        consultant_id: UUID,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Get client-related metrics for period"""
        client_assignments = db.query(ConsultantClient).filter(
            ConsultantClient.consultant_id == consultant_id
        ).all()
        
        active_clients = [c for c in client_assignments if c.is_active]
        
        return {
            "total_clients": len(client_assignments),
            "active_clients": len(active_clients),
            "primary_clients": sum(1 for c in active_clients if c.is_primary),
            "new_clients": sum(
                1 for c in client_assignments 
                if start_date <= c.assigned_date.date() <= end_date
            )
        }
    
    def _calculate_period_revenue(
        self, 
        db: Session, 
        consultant_id: UUID,
        start_date: date,
        end_date: date
    ) -> Decimal:
        """Calculate revenue generated in period"""
        # This is simplified - would need actual placement fee tracking
        placements = db.query(Application).filter(
            and_(
                Application.consultant_id == consultant_id,
                Application.status == ApplicationStatus.HIRED,
                Application.last_updated >= start_date,
                Application.last_updated <= end_date
            )
        ).all()
        
        # Estimate based on average placement fee
        avg_placement_fee = Decimal("5000")  # Would come from config
        return len(placements) * avg_placement_fee
    
    def _get_target_achievement_details(
        self, 
        db: Session, 
        consultant_id: UUID,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Get detailed target achievement for period"""
        # Get all targets in period
        targets = db.query(ConsultantTarget).filter(
            and_(
                ConsultantTarget.consultant_id == consultant_id,
                ConsultantTarget.target_year >= start_date.year,
                ConsultantTarget.target_year <= end_date.year
            )
        ).all()
        
        achievement_summary = {
            "targets_met": 0,
            "total_targets": len(targets),
            "details": []
        }
        
        for target in targets:
            is_achieved = target.is_achieved
            achievement_summary["details"].append({
                "period": f"{target.target_period} {target.target_year}/{target.target_month or target.target_quarter}",
                "achieved": is_achieved,
                "placement_achievement": (
                    (target.actual_placements / target.placement_target * 100)
                    if target.placement_target else None
                ),
                "revenue_achievement": (
                    (target.actual_revenue / target.revenue_target * 100)
                    if target.revenue_target else None
                )
            })
            
            if is_achieved:
                achievement_summary["targets_met"] += 1
        
        return achievement_summary


# Create service instance
consultant_service = ConsultantService()