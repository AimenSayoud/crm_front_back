from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func, case
from uuid import UUID
from datetime import datetime, date

from app.crud.base import CRUDBase
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory, ApplicationNote
from app.models.candidate import CandidateProfile
from app.models.job import Job
from app.models.company import Company
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, ApplicationSearchFilters,
    ApplicationStatusHistoryCreate, BulkApplicationUpdate,
    ApplicationStatusChange, ScheduleInterview, MakeOffer,
    ApplicationNoteCreate, ApplicationNoteUpdate
)


class CRUDApplication(CRUDBase[Application, ApplicationCreate, ApplicationUpdate]):
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[Application]:
        """Get application with all related data"""
        return db.query(Application)\
            .options(
                joinedload(Application.candidate).joinedload(CandidateProfile.user),
                joinedload(Application.job).joinedload(Job.company),
                joinedload(Application.consultant),
                selectinload(Application.status_history),
                selectinload(Application.notes)
            )\
            .filter(Application.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: ApplicationSearchFilters
    ) -> tuple[List[Application], int]:
        """Get applications with search filters and pagination"""
        query = db.query(Application)\
            .join(CandidateProfile, Application.candidate_id == CandidateProfile.id)\
            .join(User, CandidateProfile.user_id == User.id)\
            .join(Job, Application.job_id == Job.id)\
            .join(Company, Job.company_id == Company.id)\
            .options(
                joinedload(Application.candidate).joinedload(CandidateProfile.user),
                joinedload(Application.job).joinedload(Job.company),
                joinedload(Application.consultant)
            )
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    Job.title.ilike(search_term),
                    Company.name.ilike(search_term)
                )
            )
        
        if filters.candidate_id:
            query = query.filter(Application.candidate_id == filters.candidate_id)
        
        if filters.job_id:
            query = query.filter(Application.job_id == filters.job_id)
        
        if filters.company_id:
            query = query.filter(Job.company_id == filters.company_id)
        
        if filters.consultant_id:
            query = query.filter(Application.consultant_id == filters.consultant_id)
        
        if filters.status:
            query = query.filter(Application.status == filters.status)
        
        if filters.statuses:
            query = query.filter(Application.status.in_(filters.statuses))
        
        if filters.source:
            query = query.filter(Application.source.ilike(f"%{filters.source}%"))
        
        if filters.interview_scheduled is not None:
            if filters.interview_scheduled:
                query = query.filter(Application.interview_date.isnot(None))
            else:
                query = query.filter(Application.interview_date.is_(None))
        
        if filters.offer_pending is not None:
            if filters.offer_pending:
                query = query.filter(
                    and_(
                        Application.status == ApplicationStatus.OFFERED,
                        Application.offer_response.in_(["pending", "negotiating"])
                    )
                )
        
        if filters.applied_after:
            query = query.filter(Application.applied_at >= filters.applied_after)
        
        if filters.applied_before:
            query = query.filter(Application.applied_at <= filters.applied_before)
        
        # Count total before pagination
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "candidate_name":
            query = query.order_by(User.first_name, User.last_name)
        elif filters.sort_by == "job_title":
            order_column = Job.title
        elif filters.sort_by == "status":
            order_column = Application.status
        elif filters.sort_by == "last_updated":
            order_column = Application.last_updated
        else:  # default to applied_at
            order_column = Application.applied_at
        
        if filters.sort_by != "candidate_name":
            if filters.sort_order == "asc":
                query = query.order_by(asc(order_column))
            else:
                query = query.order_by(desc(order_column))
        elif filters.sort_order == "desc":
            query = query.order_by(desc(User.first_name), desc(User.last_name))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        applications = query.offset(offset).limit(filters.page_size).all()
        
        return applications, total
    
    def get_by_candidate(self, db: Session, *, candidate_id: UUID, skip: int = 0, limit: int = 100) -> List[Application]:
        """Get applications by candidate"""
        return db.query(Application)\
            .options(
                joinedload(Application.job).joinedload(Job.company),
                joinedload(Application.consultant)
            )\
            .filter(Application.candidate_id == candidate_id)\
            .order_by(desc(Application.applied_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_job(self, db: Session, *, job_id: UUID, skip: int = 0, limit: int = 100) -> List[Application]:
        """Get applications by job"""
        return db.query(Application)\
            .options(
                joinedload(Application.candidate).joinedload(CandidateProfile.user),
                joinedload(Application.consultant)
            )\
            .filter(Application.job_id == job_id)\
            .order_by(desc(Application.applied_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_status(self, db: Session, *, status: ApplicationStatus, skip: int = 0, limit: int = 100) -> List[Application]:
        """Get applications by status"""
        return db.query(Application)\
            .options(
                joinedload(Application.candidate).joinedload(CandidateProfile.user),
                joinedload(Application.job).joinedload(Job.company),
                joinedload(Application.consultant)
            )\
            .filter(Application.status == status)\
            .order_by(desc(Application.applied_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_by_consultant(self, db: Session, *, consultant_id: UUID, skip: int = 0, limit: int = 100) -> List[Application]:
        """Get applications assigned to consultant"""
        return db.query(Application)\
            .options(
                joinedload(Application.candidate).joinedload(CandidateProfile.user),
                joinedload(Application.job).joinedload(Job.company)
            )\
            .filter(Application.consultant_id == consultant_id)\
            .order_by(desc(Application.last_updated))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def change_status(
        self, 
        db: Session, 
        *, 
        application_id: UUID, 
        status_change: ApplicationStatusChange,
        changed_by: UUID
    ) -> Optional[Application]:
        """Change application status and record history"""
        application = self.get(db, id=application_id)
        if not application:
            return None
        
        # Record status history
        status_history = ApplicationStatusHistory(
            application_id=application_id,
            status=status_change.new_status,
            comment=status_change.comment,
            changed_by=changed_by,
            changed_at=datetime.utcnow()
        )
        db.add(status_history)
        
        # Update application
        application.status = status_change.new_status
        application.last_updated = datetime.utcnow()
        
        db.commit()
        db.refresh(application)
        return application
    
    def schedule_interview(
        self, 
        db: Session, 
        *, 
        application_id: UUID, 
        interview_data: ScheduleInterview
    ) -> Optional[Application]:
        """Schedule interview for application"""
        application = self.get(db, id=application_id)
        if not application:
            return None
        
        application.interview_date = interview_data.interview_date
        application.interview_type = interview_data.interview_type
        application.status = ApplicationStatus.INTERVIEWED
        application.last_updated = datetime.utcnow()
        
        # Add notes if provided
        if interview_data.notes:
            application.internal_notes = (application.internal_notes or "") + f"\nInterview scheduled: {interview_data.notes}"
        
        db.commit()
        db.refresh(application)
        return application
    
    def make_offer(
        self, 
        db: Session, 
        *, 
        application_id: UUID, 
        offer_data: MakeOffer
    ) -> Optional[Application]:
        """Make offer to candidate"""
        application = self.get(db, id=application_id)
        if not application:
            return None
        
        application.offer_salary = offer_data.salary_amount
        application.offer_currency = offer_data.currency
        application.offer_date = date.today()
        application.offer_expiry_date = offer_data.offer_expiry_date
        application.offer_response = "pending"
        application.status = ApplicationStatus.OFFERED
        application.last_updated = datetime.utcnow()
        
        # Add notes if provided
        if offer_data.notes:
            application.internal_notes = (application.internal_notes or "") + f"\nOffer made: {offer_data.notes}"
        
        db.commit()
        db.refresh(application)
        return application
    
    def bulk_update(
        self, 
        db: Session, 
        *, 
        bulk_update: BulkApplicationUpdate,
        updated_by: UUID
    ) -> Dict[str, Any]:
        """Bulk update applications"""
        updated_count = 0
        failed_count = 0
        errors = []
        
        for app_id in bulk_update.application_ids:
            try:
                application = self.get(db, id=app_id)
                if not application:
                    failed_count += 1
                    errors.append(f"Application {app_id} not found")
                    continue
                
                # Update status if provided
                if bulk_update.status:
                    # Record status history
                    status_history = ApplicationStatusHistory(
                        application_id=app_id,
                        status=bulk_update.status,
                        comment="Bulk status update",
                        changed_by=updated_by,
                        changed_at=datetime.utcnow()
                    )
                    db.add(status_history)
                    
                    application.status = bulk_update.status
                
                # Update consultant if provided
                if bulk_update.consultant_id:
                    application.consultant_id = bulk_update.consultant_id
                
                # Add note if provided
                if bulk_update.add_note:
                    application.internal_notes = (application.internal_notes or "") + f"\n{bulk_update.add_note}"
                
                application.last_updated = datetime.utcnow()
                updated_count += 1
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to update {app_id}: {str(e)}")
        
        db.commit()
        
        return {
            "updated_count": updated_count,
            "failed_count": failed_count,
            "errors": errors
        }
    
    def get_application_stats(self, db: Session, *, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """Get application statistics"""
        query = db.query(Application)
        
        # Apply filters if provided
        if filters:
            if filters.get("company_id"):
                query = query.join(Job).filter(Job.company_id == filters["company_id"])
            if filters.get("consultant_id"):
                query = query.filter(Application.consultant_id == filters["consultant_id"])
            if filters.get("date_from"):
                query = query.filter(Application.applied_at >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(Application.applied_at <= filters["date_to"])
        
        # Get status counts
        status_counts = query.with_entities(
            Application.status,
            func.count(Application.id)
        ).group_by(Application.status).all()
        
        status_dict = {status.value: 0 for status in ApplicationStatus}
        for status, count in status_counts:
            status_dict[status.value] = count
        
        total_applications = sum(status_dict.values())
        
        # Calculate conversion rates
        interview_rate = (status_dict.get("interviewed", 0) / total_applications * 100) if total_applications > 0 else 0
        offer_rate = (status_dict.get("offered", 0) / total_applications * 100) if total_applications > 0 else 0
        hire_rate = (status_dict.get("hired", 0) / total_applications * 100) if total_applications > 0 else 0
        
        return {
            "total_applications": total_applications,
            "new_applications": status_dict.get("submitted", 0),
            "under_review": status_dict.get("under_review", 0),
            "interviewed": status_dict.get("interviewed", 0),
            "offered": status_dict.get("offered", 0),
            "hired": status_dict.get("hired", 0),
            "rejected": status_dict.get("rejected", 0),
            "interview_rate": round(interview_rate, 2),
            "offer_rate": round(offer_rate, 2),
            "hire_rate": round(hire_rate, 2)
        }


class CRUDApplicationStatusHistory(CRUDBase[ApplicationStatusHistory, ApplicationStatusHistoryCreate, dict]):
    def get_by_application(self, db: Session, *, application_id: UUID) -> List[ApplicationStatusHistory]:
        """Get status history for an application"""
        return db.query(ApplicationStatusHistory)\
            .options(joinedload(ApplicationStatusHistory.changed_by_user))\
            .filter(ApplicationStatusHistory.application_id == application_id)\
            .order_by(desc(ApplicationStatusHistory.changed_at))\
            .all()
    
    def create_status_change(
        self, 
        db: Session, 
        *, 
        application_id: UUID, 
        status: ApplicationStatus,
        comment: Optional[str] = None,
        changed_by: Optional[UUID] = None
    ) -> ApplicationStatusHistory:
        """Create a new status history entry"""
        status_history = ApplicationStatusHistory(
            application_id=application_id,
            status=status,
            comment=comment,
            changed_by=changed_by,
            changed_at=datetime.utcnow()
        )
        db.add(status_history)
        db.commit()
        db.refresh(status_history)
        return status_history


class CRUDApplicationNote(CRUDBase[ApplicationNote, ApplicationNoteCreate, ApplicationNoteUpdate]):
    def get_by_application(self, db: Session, *, application_id: UUID) -> List[ApplicationNote]:
        """Get all notes for an application"""
        return db.query(ApplicationNote)\
            .options(joinedload(ApplicationNote.consultant))\
            .filter(ApplicationNote.application_id == application_id)\
            .order_by(desc(ApplicationNote.created_at))\
            .all()
    
    def get_by_consultant(self, db: Session, *, consultant_id: UUID, skip: int = 0, limit: int = 100) -> List[ApplicationNote]:
        """Get all notes by a consultant"""
        return db.query(ApplicationNote)\
            .options(joinedload(ApplicationNote.application))\
            .filter(ApplicationNote.consultant_id == consultant_id)\
            .order_by(desc(ApplicationNote.created_at))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def create_note(
        self, 
        db: Session, 
        *, 
        application_id: UUID, 
        consultant_id: UUID, 
        note_text: str
    ) -> ApplicationNote:
        """Create a note for an application"""
        note = ApplicationNote(
            application_id=application_id,
            consultant_id=consultant_id,
            note_text=note_text
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note


# Create CRUD instances
application = CRUDApplication(Application)
application_status_history = CRUDApplicationStatusHistory(ApplicationStatusHistory)
application_note = CRUDApplicationNote(ApplicationNote)