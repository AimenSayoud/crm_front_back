# app/services/application.py
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from uuid import UUID
from datetime import datetime, timedelta, date

from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory, ApplicationNote
from app.models.job import Job
from app.models.candidate import CandidateProfile
from app.models.consultant import ConsultantProfile
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationStatusChange,
    ScheduleInterview, MakeOffer, BulkApplicationUpdate,
    ApplicationSearchFilters
)
from app.crud import application as application_crud,application_status_history,application_note
from app.services.base import BaseService
from app.crud.application import CRUDApplication


class ApplicationService(BaseService[Application, CRUDApplication]):
    """Service for application management and workflow"""
    
    def __init__(self):
        super().__init__(application_crud)
        self.status_history_crud = application_status_history
        self.note_crud = application_note
    
    async def search_applications(
        self, 
        db: Session, 
        query: str, 
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search applications - placeholder implementation"""
        # For now, return empty results
        # TODO: Implement actual search logic
        return {
            "applications": [],
            "total": 0
        }
    
    def submit_application(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID,
        job_id: UUID,
        application_data: ApplicationCreate
    ) -> Application:
        """Submit a new job application"""
        # Check if already applied
        existing = db.query(Application).filter(
            and_(
                Application.candidate_id == candidate_id,
                Application.job_id == job_id
            )
        ).first()
        
        if existing:
            raise ValueError("Already applied to this job")
        
        # Validate job is open
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job or job.status != "open":
            raise ValueError("Job is not available for applications")
        
        # Create application
        application_data_dict = application_data.model_dump()
        application_data_dict.update({
            "candidate_id": candidate_id,
            "job_id": job_id,
            "status": ApplicationStatus.SUBMITTED,
            "applied_at": datetime.utcnow()
        })
        
        application = self.crud.create(
            db, 
            obj_in=ApplicationCreate(**application_data_dict)
        )
        
        # Create initial status history
        self.status_history_crud.create_status_change(
            db,
            application_id=application.id,
            status=ApplicationStatus.SUBMITTED,
            comment="Application submitted"
        )
        
        # Update job application count
        job.application_count = (job.application_count or 0) + 1
        
        # Trigger notifications
        self._notify_application_submitted(db, application)
        
        db.commit()
        return application
    
    def process_application_status(
        self, 
        db: Session, 
        *, 
        application_id: UUID,
        status_change: ApplicationStatusChange,
        changed_by: UUID
    ) -> Optional[Application]:
        """Process application status change with workflow validation"""
        application = self.crud.get_with_details(db, id=application_id)
        if not application:
            return None
        
        # Validate status transition
        if not self._validate_status_transition(
            application.status, 
            status_change.new_status
        ):
            raise ValueError(f"Invalid status transition from {application.status} to {status_change.new_status}")
        
        # Update status
        application = self.crud.change_status(
            db,
            application_id=application_id,
            status_change=status_change,
            changed_by=changed_by
        )
        
        # Handle status-specific actions
        self._handle_status_change_actions(
            db, 
            application, 
            status_change,
            changed_by
        )
        
        # Send notifications if requested
        if status_change.notify_candidate:
            self._notify_status_change(db, application, status_change)
        
        return application
    
    def schedule_interview(
        self, 
        db: Session, 
        *, 
        application_id: UUID,
        interview_data: ScheduleInterview,
        scheduled_by: UUID
    ) -> Optional[Application]:
        """Schedule interview for application"""
        application = self.crud.schedule_interview(
            db,
            application_id=application_id,
            interview_data=interview_data
        )
        
        if not application:
            return None
        
        # Add status history
        self.status_history_crud.create_status_change(
            db,
            application_id=application_id,
            status=ApplicationStatus.INTERVIEWED,
            comment=f"Interview scheduled for {interview_data.interview_date}",
            changed_by=scheduled_by
        )
        
        # Send notifications
        if interview_data.notify_candidate:
            self._notify_interview_scheduled(db, application, interview_data)
        
        return application
    
    def make_offer(
        self, 
        db: Session, 
        *, 
        application_id: UUID,
        offer_data: MakeOffer,
        offered_by: UUID
    ) -> Optional[Application]:
        """Make job offer to candidate"""
        application = self.crud.make_offer(
            db,
            application_id=application_id,
            offer_data=offer_data
        )
        
        if not application:
            return None
        
        # Add status history
        self.status_history_crud.create_status_change(
            db,
            application_id=application_id,
            status=ApplicationStatus.OFFERED,
            comment=f"Offer made: {offer_data.currency} {offer_data.salary_amount}",
            changed_by=offered_by
        )
        
        # Send offer letter
        if offer_data.notify_candidate:
            self._send_offer_letter(db, application, offer_data)
        
        return application
    
    def handle_offer_response(
        self, 
        db: Session, 
        *, 
        application_id: UUID,
        response: str,  # accepted, rejected, negotiating
        candidate_feedback: Optional[str] = None
    ) -> Optional[Application]:
        """Handle candidate's response to offer"""
        application = self.get(db, id=application_id)
        if not application or application.status != ApplicationStatus.OFFERED:
            return None
        
        application.offer_response = response
        if candidate_feedback:
            application.candidate_feedback = candidate_feedback
        
        # Update status based on response
        if response == "accepted":
            application.status = ApplicationStatus.HIRED
            self._process_successful_hire(db, application)
        elif response == "rejected":
            application.status = ApplicationStatus.REJECTED
        
        # Add to history
        self.status_history_crud.create_status_change(
            db,
            application_id=application_id,
            status=application.status,
            comment=f"Offer {response}: {candidate_feedback}"
        )
        
        db.commit()
        return application
    
    def assign_consultant(
        self, 
        db: Session, 
        *, 
        application_id: UUID,
        consultant_id: UUID,
        assigned_by: UUID
    ) -> Optional[Application]:
        """Assign consultant to manage application"""
        application = self.get(db, id=application_id)
        if not application:
            return None
        
        # Validate consultant
        consultant = db.query(ConsultantProfile).filter(
            ConsultantProfile.id == consultant_id
        ).first()
        
        if not consultant or consultant.status != "active":
            raise ValueError("Invalid or inactive consultant")
        
        application.consultant_id = consultant_id
        
        # Create assignment record
        from app.crud.consultant import consultant_candidate
        consultant_candidate.assign_candidate(
            db,
            consultant_id=consultant_id,
            candidate_id=application.candidate_id,
            notes=f"Assigned for job application {application_id}"
        )
        
        # Add note
        self.note_crud.create_note(
            db,
            application_id=application_id,
            consultant_id=consultant_id,
            note_text=f"Consultant assigned by user {assigned_by}"
        )
        
        db.commit()
        return application
    
    def get_application_timeline(
        self, 
        db: Session, 
        *, 
        application_id: UUID
    ) -> List[Dict[str, Any]]:
        """Get complete timeline of application events"""
        application = self.crud.get_with_details(db, id=application_id)
        if not application:
            return []
        
        timeline = []
        
        # Application submitted
        timeline.append({
            "event": "Application Submitted",
            "date": application.applied_at,
            "status": ApplicationStatus.SUBMITTED,
            "details": f"Applied for {application.job.title}"
        })
        
        # Status changes
        for history in application.status_history:
            timeline.append({
                "event": f"Status changed to {history.status}",
                "date": history.changed_at,
                "status": history.status,
                "details": history.comment,
                "changed_by": history.changed_by_name
            })
        
        # Interview scheduled
        if application.interview_date:
            timeline.append({
                "event": "Interview Scheduled",
                "date": application.interview_date,
                "status": application.status,
                "details": f"{application.interview_type} interview"
            })
        
        # Offer made
        if application.offer_date:
            timeline.append({
                "event": "Offer Made",
                "date": application.offer_date,
                "status": ApplicationStatus.OFFERED,
                "details": f"{application.offer_currency} {application.offer_salary}"
            })
        
        # Sort by date
        timeline.sort(key=lambda x: x["date"])
        
        return timeline
    
    def get_pipeline_analytics(
        self, 
        db: Session, 
        *, 
        filters: ApplicationSearchFilters
    ) -> Dict[str, Any]:
        """Get application pipeline analytics"""
        # Base query
        query = db.query(Application).join(
            Job, Application.job_id == Job.id
        )
        
        # Apply filters
        if filters.company_id:
            query = query.filter(Job.company_id == filters.company_id)
        
        if filters.consultant_id:
            query = query.filter(Application.consultant_id == filters.consultant_id)
        
        if filters.applied_after:
            query = query.filter(Application.applied_at >= filters.applied_after)
        
        if filters.applied_before:
            query = query.filter(Application.applied_at <= filters.applied_before)
        
        applications = query.all()
        
        # Calculate metrics
        total = len(applications)
        
        analytics = {
            "total_applications": total,
            "conversion_funnel": self._calculate_conversion_funnel(applications),
            "average_time_to_hire": self._calculate_avg_time_to_hire(applications),
            "rejection_reasons": self._analyze_rejection_reasons(applications),
            "source_effectiveness": self._analyze_source_effectiveness(applications),
            "consultant_performance": self._analyze_consultant_performance(
                db, applications
            ) if filters.consultant_id else None
        }
        
        return analytics
    
    def bulk_process_applications(
        self, 
        db: Session, 
        *, 
        bulk_update: BulkApplicationUpdate,
        processed_by: UUID
    ) -> Dict[str, Any]:
        """Process multiple applications in bulk"""
        result = self.crud.bulk_update(
            db,
            bulk_update=bulk_update,
            updated_by=processed_by
        )
        
        # Log bulk action
        self.log_action(
            "bulk_application_update",
            user_id=processed_by,
            details={
                "application_count": len(bulk_update.application_ids),
                "updates": bulk_update.model_dump(exclude={'application_ids'})
            }
        )
        
        return result
    
    def get_candidate_application_history(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID
    ) -> List[Dict[str, Any]]:
        """Get complete application history for a candidate"""
        applications = self.crud.get_by_candidate(
            db, 
            candidate_id=candidate_id,
            limit=1000  # Get all
        )
        
        history = []
        for app in applications:
            history.append({
                "application_id": app.id,
                "job": {
                    "id": app.job.id,
                    "title": app.job.title,
                    "company": app.job.company.name
                },
                "applied_date": app.applied_at,
                "status": app.status,
                "last_update": app.last_updated,
                "outcome": self._determine_outcome(app)
            })
        
        return history
    
    def _validate_status_transition(
        self,
        current_status: ApplicationStatus,
        new_status: ApplicationStatus
    ) -> bool:
        """Validate if status transition is allowed"""
        valid_transitions = {
            ApplicationStatus.SUBMITTED: [
                ApplicationStatus.UNDER_REVIEW,
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN
            ],
            ApplicationStatus.UNDER_REVIEW: [
                ApplicationStatus.INTERVIEWED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN
            ],
            ApplicationStatus.INTERVIEWED: [
                ApplicationStatus.OFFERED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN
            ],
            ApplicationStatus.OFFERED: [
                ApplicationStatus.HIRED,
                ApplicationStatus.REJECTED,
                ApplicationStatus.WITHDRAWN
            ],
            ApplicationStatus.HIRED: [],  # Final status
            ApplicationStatus.REJECTED: [],  # Final status
            ApplicationStatus.WITHDRAWN: []  # Final status
        }
        
        return new_status in valid_transitions.get(current_status, [])
    
    def _handle_status_change_actions(
        self,
        db: Session,
        application: Application,
        status_change: ApplicationStatusChange,
        changed_by: UUID
    ):
        """Handle actions based on status change"""
        if status_change.new_status == ApplicationStatus.HIRED:
            self._process_successful_hire(db, application)
        
        elif status_change.new_status == ApplicationStatus.REJECTED:
            # Store rejection reason
            if status_change.comment:
                application.rejection_reason = status_change.comment
    
    def _process_successful_hire(self, db: Session, application: Application):
        """Process successful hire"""
        # Update job status if needed
        job = application.job
        hired_count = db.query(func.count(Application.id)).filter(
            and_(
                Application.job_id == job.id,
                Application.status == ApplicationStatus.HIRED
            )
        ).scalar()
        
        # Close job if positions filled
        # This would depend on job requirements
        
        # Update consultant metrics
        if application.consultant_id:
            consultant = db.query(ConsultantProfile).filter(
                ConsultantProfile.id == application.consultant_id
            ).first()
            if consultant:
                consultant.successful_placements += 1
                consultant.total_placements += 1
        
        # Create recruitment history record
        from app.models.company import RecruitmentHistory
        history = RecruitmentHistory(
            company_id=job.company_id,
            job_title=job.title,
            date_filled=date.today(),
            time_to_fill=(datetime.utcnow() - job.created_at).days,
            consultant_id=application.consultant_id
        )
        db.add(history)
    
    def _calculate_conversion_funnel(
        self,
        applications: List[Application]
    ) -> Dict[str, Any]:
        """Calculate conversion rates through hiring funnel"""
        if not applications:
            return {}
        
        total = len(applications)
        statuses = {
            "submitted": 0,
            "under_review": 0,
            "interviewed": 0,
            "offered": 0,
            "hired": 0,
            "rejected": 0,
            "withdrawn": 0
        }
        
        for app in applications:
            statuses[app.status] += 1
        
        # Calculate conversion rates
        conversions = {
            "application_to_review": (
                statuses["under_review"] / statuses["submitted"] * 100
            ) if statuses["submitted"] > 0 else 0,
            "review_to_interview": (
                statuses["interviewed"] / statuses["under_review"] * 100
            ) if statuses["under_review"] > 0 else 0,
            "interview_to_offer": (
                statuses["offered"] / statuses["interviewed"] * 100
            ) if statuses["interviewed"] > 0 else 0,
            "offer_to_hire": (
                statuses["hired"] / statuses["offered"] * 100
            ) if statuses["offered"] > 0 else 0,
            "overall_success_rate": (
                statuses["hired"] / total * 100
            ) if total > 0 else 0
        }
        
        return {
            "stages": statuses,
            "conversions": conversions
        }
    
    def _calculate_avg_time_to_hire(
        self,
        applications: List[Application]
    ) -> Optional[float]:
        """Calculate average time to hire"""
        hire_times = []
        
        for app in applications:
            if app.status == ApplicationStatus.HIRED and app.last_updated:
                days = (app.last_updated - app.applied_at).days
                hire_times.append(days)
        
        return sum(hire_times) / len(hire_times) if hire_times else None
    
    def _analyze_rejection_reasons(
        self,
        applications: List[Application]
    ) -> Dict[str, int]:
        """Analyze rejection reasons"""
        reasons = {}
        
        for app in applications:
            if app.status == ApplicationStatus.REJECTED and app.rejection_reason:
                reason = app.rejection_reason.lower()
                # Categorize reasons
                if "experience" in reason:
                    key = "Insufficient Experience"
                elif "skill" in reason:
                    key = "Skill Mismatch"
                elif "culture" in reason or "fit" in reason:
                    key = "Cultural Fit"
                elif "salary" in reason or "compensation" in reason:
                    key = "Salary Expectations"
                else:
                    key = "Other"
                
                reasons[key] = reasons.get(key, 0) + 1
        
        return reasons
    
    def _analyze_source_effectiveness(
        self,
        applications: List[Application]
    ) -> Dict[str, Dict[str, Any]]:
        """Analyze effectiveness of application sources"""
        sources = {}
        
        for app in applications:
            source = app.source or "direct"
            if source not in sources:
                sources[source] = {
                    "total": 0,
                    "interviewed": 0,
                    "offered": 0,
                    "hired": 0
                }
            
            sources[source]["total"] += 1
            
            if app.status in [ApplicationStatus.INTERVIEWED, ApplicationStatus.OFFERED, ApplicationStatus.HIRED]:
                sources[source]["interviewed"] += 1
            if app.status in [ApplicationStatus.OFFERED, ApplicationStatus.HIRED]:
                sources[source]["offered"] += 1
            if app.status == ApplicationStatus.HIRED:
                sources[source]["hired"] += 1
        
        # Calculate effectiveness rates
        for source, data in sources.items():
            if data["total"] > 0:
                data["interview_rate"] = data["interviewed"] / data["total"] * 100
                data["hire_rate"] = data["hired"] / data["total"] * 100
        
        return sources
    
    def _analyze_consultant_performance(
        self,
        db: Session,
        applications: List[Application]
    ) -> Dict[str, Any]:
        """Analyze consultant performance on applications"""
        consultant_stats = {}
        
        for app in applications:
            if app.consultant_id:
                if app.consultant_id not in consultant_stats:
                    consultant_stats[app.consultant_id] = {
                        "total": 0,
                        "successful": 0,
                        "in_progress": 0,
                        "rejected": 0
                    }
                
                consultant_stats[app.consultant_id]["total"] += 1
                
                if app.status == ApplicationStatus.HIRED:
                    consultant_stats[app.consultant_id]["successful"] += 1
                elif app.status in [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INTERVIEWED, ApplicationStatus.OFFERED]:
                    consultant_stats[app.consultant_id]["in_progress"] += 1
                elif app.status == ApplicationStatus.REJECTED:
                    consultant_stats[app.consultant_id]["rejected"] += 1
        
        return consultant_stats
    
    def _determine_outcome(self, application: Application) -> str:
        """Determine application outcome for history"""
        if application.status == ApplicationStatus.HIRED:
            return "Hired"
        elif application.status == ApplicationStatus.REJECTED:
            return f"Rejected - {application.rejection_reason or 'Not specified'}"
        elif application.status == ApplicationStatus.WITHDRAWN:
            return "Withdrawn by candidate"
        elif application.status in [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INTERVIEWED]:
            return "In Progress"
        elif application.status == ApplicationStatus.OFFERED:
            return f"Offer {application.offer_response or 'pending'}"
        else:
            return "Unknown"
    
    def _notify_application_submitted(self, db: Session, application: Application):
        """Send notification for new application"""
        # This would integrate with notification service
        pass
    
    def _notify_status_change(
        self, 
        db: Session, 
        application: Application,
        status_change: ApplicationStatusChange
    ):
        """Send notification for status change"""
        # This would integrate with notification service
        pass
    
    def _notify_interview_scheduled(
        self,
        db: Session,
        application: Application,
        interview_data: ScheduleInterview
    ):
        """Send interview invitation"""
        # This would integrate with notification service
        pass
    
    def _send_offer_letter(
        self,
        db: Session,
        application: Application,
        offer_data: MakeOffer
    ):
        """Send offer letter to candidate"""
        # This would integrate with notification service
        pass


# Create service instance
application_service = ApplicationService()