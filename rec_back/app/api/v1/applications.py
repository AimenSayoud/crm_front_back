from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_candidate_user,
    get_employer_user, get_consultant_user, get_admin_user,
    get_pagination_params, PaginationParams, check_company_access,
    check_candidate_access, get_common_filters, CommonFilters
)
from app.services.application import application_service
from app.schemas.application import (
    ApplicationCreate, ApplicationUpdate, Application as ApplicationSchema,
    ApplicationStatusChange, ApplicationNote, ApplicationNoteCreate, ApplicationNoteUpdate,
    ApplicationSearchFilters, BulkApplicationUpdate, ScheduleInterview,
    MakeOffer, ApplicationStatusHistory, ApplicationListResponse
)
from app.models.user import User
from app.models.enums import UserRole, ApplicationStatus
from app.models.application import Application

router = APIRouter()

@router.get("/", response_model=List[ApplicationSchema])
async def list_applications(
    # Filtering parameters
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    job_id: Optional[UUID] = Query(None, description="Filter by job ID"),
    candidate_id: Optional[UUID] = Query(None, description="Filter by candidate ID"),
    consultant_id: Optional[UUID] = Query(None, description="Filter by consultant ID"),
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    applied_after: Optional[str] = Query(None, description="Filter applications after date (ISO format)"),
    applied_before: Optional[str] = Query(None, description="Filter applications before date (ISO format)"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    List applications with filtering and pagination.
    Access control based on user role.
    """
    # Role-based filtering
    if current_user.role == UserRole.CANDIDATE:
        # Candidates can only see their own applications
        if not hasattr(current_user, 'candidate_profile') or not current_user.candidate_profile:
            raise HTTPException(
                status_code=404,
                detail="Candidate profile not found"
            )
        candidate_id = current_user.candidate_profile.id
    elif current_user.role == UserRole.EMPLOYER:
        # Employers can only see applications for their company jobs
        if company_id and not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company applications"
            )
    elif current_user.role == UserRole.CONSULTANT:
        # Consultants can see applications they're assigned to
        if consultant_id and str(consultant_id) != str(current_user.consultant_profile.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant applications"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions"
        )
    
    # Build search filters - using basic dict for now since we don't have the schema
    search_filters = {
        "status": status,
        "job_id": job_id,
        "candidate_id": candidate_id,
        "consultant_id": consultant_id,
        "company_id": company_id,
        "query": filters.q,
        "applied_after": applied_after,
        "applied_before": applied_before,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "sort_by": filters.sort_by or "applied_at",
        "sort_order": filters.sort_order
    }
    
    try:
        # For now, return placeholder data since service method doesn't exist yet
        return {
            "items": [],
            "total": 0,
            "page": pagination.page,
            "page_size": pagination.page_size,
            "pages": 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving applications: {str(e)}"
        )

@router.post("/", response_model=ApplicationSchema)
async def submit_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_candidate_user),
    db: Session = Depends(get_database)
):
    """
    Submit a new job application.
    Only candidates can submit applications.
    """
    if not hasattr(current_user, 'candidate_profile') or not current_user.candidate_profile:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found"
        )
    
    try:
        application = application_service.submit_application(
            db,
            candidate_id=current_user.candidate_profile.id,
            job_id=application_data.job_id,
            application_data=application_data
        )
        return application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting application: {str(e)}"
        )

@router.get("/{application_id}", response_model=ApplicationSchema)
async def get_application(
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get application details by ID.
    Access control based on user role and ownership.
    """
    try:
        application = application_service.get(db, id=application_id)
        if not application:
            raise HTTPException(
                status_code=404,
                detail="Application not found"
            )
        
        # Check access permissions
        has_access = False
        
        if current_user.role == UserRole.CANDIDATE:
            has_access = (hasattr(current_user, 'candidate_profile') and 
                         current_user.candidate_profile and
                         str(application.candidate_id) == str(current_user.candidate_profile.id))
        elif current_user.role == UserRole.EMPLOYER:
            # Would need to check company access through job
            has_access = True  # Simplified for now
        elif current_user.role == UserRole.CONSULTANT:
            has_access = (application.consultant_id and 
                         str(application.consultant_id) == str(current_user.consultant_profile.id))
        elif current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            has_access = True
        
        if not has_access:
            raise HTTPException(
                status_code=403,
                detail="Access denied to this application"
            )
        
        return application
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving application: {str(e)}"
        )

@router.put("/{application_id}", response_model=ApplicationSchema)
async def update_application(
    application_update: ApplicationUpdate,
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update application details.
    Only consultants and admins can update applications.
    """
    if current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to update applications"
        )
    
    try:
        updated_application = application_service.update(
            db,
            id=application_id,
            obj_in=application_update
        )
        if not updated_application:
            raise HTTPException(
                status_code=404,
                detail="Application not found"
            )
        return updated_application
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating application: {str(e)}"
        )

@router.post("/{application_id}/status")
async def change_application_status(
    status_change: ApplicationStatusChange,
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Change application status.
    Employers, consultants, and admins can change status.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to change application status"
        )
    
    try:
        # Get application
        application = application_service.get(db, id=application_id)
        if not application:
            raise HTTPException(
                status_code=404,
                detail="Application not found"
            )
        
        # Update status
        application.status = status_change.status
        db.commit()
        db.refresh(application)
        
        return {"message": "Application status updated successfully", "new_status": status_change.status}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error changing application status: {str(e)}"
        )

# ============== APPLICATION INTERVIEW & OFFER MANAGEMENT ==============

@router.post("/{application_id}/schedule-interview")
async def schedule_interview(
    interview_data: ScheduleInterview,
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Schedule an interview for an application.
    Only employers, consultants, or admins can schedule interviews.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to schedule interviews"
        )
    
    try:
        # Check if user can manage this application
        application = application_service.get(db, id=application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if current_user.role == UserRole.EMPLOYER:
            # Check if user is part of the company that posted the job
            if not application_service.can_user_manage_application(
                db, application_id=application_id, user_id=current_user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to manage this application"
                )
        
        scheduled_interview = application_service.schedule_interview(
            db,
            application_id=application_id,
            interview_data=interview_data,
            scheduled_by=current_user.id
        )
        return scheduled_interview
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error scheduling interview: {str(e)}"
        )

@router.post("/{application_id}/make-offer")
async def make_offer(
    offer_data: MakeOffer,
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Make a job offer for an application.
    Only employers, consultants, or admins can make offers.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to make offers"
        )
    
    try:
        # Check if user can manage this application
        application = application_service.get(db, id=application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if current_user.role == UserRole.EMPLOYER:
            if not application_service.can_user_manage_application(
                db, application_id=application_id, user_id=current_user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to manage this application"
                )
        
        offer = application_service.make_offer(
            db,
            application_id=application_id,
            offer_data=offer_data,
            offered_by=current_user.id
        )
        return offer
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error making offer: {str(e)}"
        )

@router.get("/{application_id}/status-history", response_model=List[ApplicationStatusHistory])
async def get_application_status_history(
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get status history for an application.
    Candidates can view their own application history, employers/consultants/admins can view all.
    """
    try:
        application = application_service.get(db, id=application_id)
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        # Check permissions
        if current_user.role == UserRole.CANDIDATE:
            # Check if this is their application
            if application.candidate.user_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to view this application history"
                )
        elif current_user.role == UserRole.EMPLOYER:
            if not application_service.can_user_manage_application(
                db, application_id=application_id, user_id=current_user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to view this application history"
                )
        elif current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view application history"
            )
        
        history = application_service.get_status_history(db, application_id=application_id)
        return history
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving application history: {str(e)}"
        )

@router.get("/{application_id}/notes", response_model=List[ApplicationNote])
async def get_application_notes(
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get notes for an application.
    Only employers, consultants, or admins can view application notes.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view application notes"
        )
    
    try:
        # Check if user can manage this application
        if current_user.role == UserRole.EMPLOYER:
            if not application_service.can_user_manage_application(
                db, application_id=application_id, user_id=current_user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to view application notes"
                )
        
        notes = application_service.get_application_notes(db, application_id=application_id)
        return notes
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving application notes: {str(e)}"
        )

@router.post("/{application_id}/notes", response_model=ApplicationNote)
async def add_application_note(
    note_data: ApplicationNoteCreate,
    application_id: UUID = Path(..., description="Application ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Add a note to an application.
    Only employers, consultants, or admins can add application notes.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to add application notes"
        )
    
    try:
        # Check if user can manage this application
        if current_user.role == UserRole.EMPLOYER:
            if not application_service.can_user_manage_application(
                db, application_id=application_id, user_id=current_user.id
            ):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to add notes to this application"
                )
        
        note = application_service.add_application_note(
            db,
            application_id=application_id,
            note_data=note_data,
            created_by=current_user.id
        )
        return note
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error adding application note: {str(e)}"
        )

@router.put("/{application_id}/notes/{note_id}", response_model=ApplicationNote)
async def update_application_note(
    note_update: ApplicationNoteUpdate,
    application_id: UUID = Path(..., description="Application ID"),
    note_id: UUID = Path(..., description="Note ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update an application note.
    Only the note creator or admins can update notes.
    """
    try:
        updated_note = application_service.update_application_note(
            db,
            note_id=note_id,
            note_update=note_update,
            updated_by=current_user.id
        )
        if not updated_note:
            raise HTTPException(
                status_code=404,
                detail="Note not found or access denied"
            )
        return updated_note
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating application note: {str(e)}"
        )

@router.delete("/{application_id}/notes/{note_id}")
async def delete_application_note(
    application_id: UUID = Path(..., description="Application ID"),
    note_id: UUID = Path(..., description="Note ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Delete an application note.
    Only the note creator or admins can delete notes.
    """
    try:
        success = application_service.delete_application_note(
            db,
            note_id=note_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Note not found or access denied"
            )
        
        return {"message": "Application note deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting application note: {str(e)}"
        )

# ============== APPLICATION BULK OPERATIONS ==============

@router.post("/bulk-status-change")
async def bulk_change_application_status(
    bulk_update: BulkApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Change status of multiple applications at once.
    Only employers, consultants, or admins can perform bulk operations.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to perform bulk operations"
        )
    
    try:
        results = application_service.bulk_update_status(
            db,
            bulk_update=bulk_update,
            updated_by=current_user.id
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing bulk status change: {str(e)}"
        )

@router.post("/bulk-update")
async def bulk_update_applications(
    bulk_update: BulkApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Bulk update multiple applications.
    Only consultants and admins can perform bulk updates.
    """
    if current_user.role not in [UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions for bulk updates"
        )
    
    try:
        updated_count = 0
        failed_count = 0
        
        for app_id in bulk_update.application_ids:
            try:
                application = application_service.get(db, id=app_id)
                if application:
                    # Apply updates
                    for field, value in bulk_update.update_data.items():
                        if hasattr(application, field):
                            setattr(application, field, value)
                    updated_count += 1
                else:
                    failed_count += 1
            except Exception:
                failed_count += 1
        
        db.commit()
        
        return {
            "updated_count": updated_count,
            "failed_count": failed_count,
            "message": f"Bulk update completed: {updated_count} updated, {failed_count} failed"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing bulk update: {str(e)}"
        )

@router.get("/pipeline")
async def get_application_pipeline(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    consultant_id: Optional[UUID] = Query(None, description="Filter by consultant ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get application pipeline view with counts by status.
    Access control based on user role.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.CONSULTANT, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view pipeline"
        )
    
    try:
        # Placeholder pipeline data
        pipeline_data = {
            "total_applications": 0,
            "status_breakdown": {
                "submitted": 0,
                "under_review": 0,
                "interviewed": 0,
                "offered": 0,
                "hired": 0,
                "rejected": 0
            },
            "recent_activity": []
        }
        
        return pipeline_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving application pipeline: {str(e)}"
        )