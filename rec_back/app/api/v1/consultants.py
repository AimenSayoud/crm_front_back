from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_admin_user,
    get_consultant_user, get_pagination_params, PaginationParams,
    get_common_filters, CommonFilters
)
from app.services.consultant import consultant_service
from app.schemas.consultant import (
    ConsultantProfileCreate, ConsultantProfileUpdate, ConsultantProfile,
    ConsultantProfileWithDetails, ConsultantSearchFilters, ConsultantListResponse,
    ConsultantTarget, ConsultantTargetCreate, ConsultantTargetUpdate,
    ConsultantPerformanceReview, ConsultantPerformanceReviewCreate, ConsultantPerformanceReviewUpdate,
    ConsultantCandidate, ConsultantCandidateCreate, ConsultantCandidateUpdate,
    ConsultantClient, ConsultantClientCreate, ConsultantClientUpdate,
    ConsultantStats
)
from app.models.user import User
from app.models.enums import UserRole, ConsultantStatus

router = APIRouter()

@router.get("/", response_model=ConsultantListResponse)
async def list_consultants(
    # Search and filtering
    status: Optional[ConsultantStatus] = Query(None, description="Filter by consultant status"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    office_location: Optional[str] = Query(None, description="Filter by office location"),
    experience_min: Optional[int] = Query(None, description="Minimum years of experience"),
    performance_rating_min: Optional[float] = Query(None, description="Minimum performance rating"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    List consultants with search and filtering.
    Only admins and superadmins can view all consultants.
    """
    try:
        # Build search filters
        search_filters = ConsultantSearchFilters(
            query=filters.q,
            status=status,
            specialization=specialization,
            office_location=office_location,
            experience_min=experience_min,
            performance_rating_min=performance_rating_min,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "created_at",
            sort_order=filters.sort_order
        )
        
        consultants, total = consultant_service.get_consultants_with_search(
            db, filters=search_filters
        )
        
        return ConsultantListResponse(
            items=consultants,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving consultants: {str(e)}"
        )

@router.post("/", response_model=ConsultantProfile)
async def create_consultant_profile(
    consultant_data: ConsultantProfileCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new consultant profile.
    Only admins and superadmins can create consultant profiles.
    """
    try:
        consultant = consultant_service.create_consultant_profile(
            db,
            consultant_data=consultant_data,
            created_by=current_user.id
        )
        return consultant
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating consultant profile: {str(e)}"
        )

@router.get("/{consultant_id}", response_model=ConsultantProfileWithDetails)
async def get_consultant(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant details by ID.
    Consultants can only view their own profile, admins can view all.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to this consultant profile"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view consultant profile"
        )
    
    try:
        consultant = consultant_service.get_consultant_with_details(db, id=consultant_id)
        if not consultant:
            raise HTTPException(
                status_code=404,
                detail="Consultant not found"
            )
        
        return consultant
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving consultant: {str(e)}"
        )

@router.put("/{consultant_id}", response_model=ConsultantProfile)
async def update_consultant(
    consultant_update: ConsultantProfileUpdate,
    consultant_id: UUID = Path(..., description="Consultant ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update consultant profile.
    Consultants can update their own profile, admins can update any.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to update this consultant profile"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to update consultant profile"
        )
    
    try:
        updated_consultant = consultant_service.update_consultant_profile(
            db,
            consultant_id=consultant_id,
            update_data=consultant_update,
            updated_by=current_user.id
        )
        if not updated_consultant:
            raise HTTPException(
                status_code=404,
                detail="Consultant not found"
            )
        return updated_consultant
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating consultant: {str(e)}"
        )

@router.delete("/{consultant_id}")
async def delete_consultant(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete a consultant profile.
    Only admins and superadmins can delete consultant profiles.
    """
    try:
        success = consultant_service.delete_consultant_profile(
            db,
            consultant_id=consultant_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Consultant not found"
            )
        return {"message": "Consultant profile deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting consultant: {str(e)}"
        )

@router.get("/{consultant_id}/clients", response_model=List[ConsultantClient])
async def get_consultant_clients(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant's assigned clients.
    Consultants can only view their own clients, admins can view all.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant clients"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view consultant clients"
        )
    
    try:
        clients = consultant_service.get_consultant_clients(
            db,
            consultant_id=consultant_id,
            is_active=is_active,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        return clients
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving consultant clients: {str(e)}"
        )

@router.get("/{consultant_id}/candidates", response_model=List[ConsultantCandidate])
async def get_consultant_candidates(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active assignments"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant's assigned candidates.
    Consultants can only view their own candidates, admins can view all.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant candidates"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view consultant candidates"
        )
    
    try:
        candidates = consultant_service.get_consultant_candidates(
            db,
            consultant_id=consultant_id,
            is_active=is_active,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        return candidates
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving consultant candidates: {str(e)}"
        )

@router.post("/{consultant_id}/assign-candidate", response_model=ConsultantCandidate)
async def assign_candidate_to_consultant(
    assignment_data: ConsultantCandidateCreate,
    consultant_id: UUID = Path(..., description="Consultant ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Assign a candidate to a consultant.
    Consultants can assign candidates to themselves, admins can assign to any.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to assign candidates to this consultant"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to assign candidates"
        )
    
    try:
        assignment = consultant_service.assign_candidate_to_consultant(
            db,
            consultant_id=consultant_id,
            candidate_id=assignment_data.candidate_id,
            assignment_data=assignment_data,
            assigned_by=current_user.id
        )
        return assignment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error assigning candidate: {str(e)}"
        )

@router.delete("/{consultant_id}/assign-candidate/{candidate_id}")
async def unassign_candidate_from_consultant(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    candidate_id: UUID = Path(..., description="Candidate ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Remove candidate assignment from consultant.
    Consultants can unassign their own candidates, admins can unassign any.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to unassign candidates from this consultant"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to unassign candidates"
        )
    
    try:
        success = consultant_service.unassign_candidate_from_consultant(
            db,
            consultant_id=consultant_id,
            candidate_id=candidate_id,
            unassigned_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found"
            )
        return {"message": "Candidate unassigned successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error unassigning candidate: {str(e)}"
        )

@router.get("/{consultant_id}/performance", response_model=List[ConsultantPerformanceReview])
async def get_consultant_performance_reviews(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    year: Optional[int] = Query(None, description="Filter by review year"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant performance reviews.
    Consultants can view their own reviews, admins can view all.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant performance reviews"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view performance reviews"
        )
    
    try:
        reviews = consultant_service.get_consultant_performance_reviews(
            db,
            consultant_id=consultant_id,
            year=year,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        return reviews
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving performance reviews: {str(e)}"
        )

@router.post("/{consultant_id}/performance", response_model=ConsultantPerformanceReview)
async def create_performance_review(
    review_data: ConsultantPerformanceReviewCreate,
    consultant_id: UUID = Path(..., description="Consultant ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a performance review for a consultant.
    Only admins and superadmins can create performance reviews.
    """
    try:
        review = consultant_service.create_performance_review(
            db,
            consultant_id=consultant_id,
            review_data=review_data,
            created_by=current_user.id
        )
        return review
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating performance review: {str(e)}"
        )

@router.get("/{consultant_id}/analytics", response_model=ConsultantStats)
async def get_consultant_analytics(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    start_date: Optional[str] = Query(None, description="Start date for analytics"),
    end_date: Optional[str] = Query(None, description="End date for analytics"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant performance analytics.
    Consultants can view their own analytics, admins can view all.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant analytics"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view consultant analytics"
        )
    
    try:
        analytics = consultant_service.get_consultant_analytics(
            db,
            consultant_id=consultant_id,
            start_date=start_date,
            end_date=end_date
        )
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving consultant analytics: {str(e)}"
        )

@router.get("/{consultant_id}/targets", response_model=List[ConsultantTarget])
async def get_consultant_targets(
    consultant_id: UUID = Path(..., description="Consultant ID"),
    year: Optional[int] = Query(None, description="Filter by target year"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant performance targets.
    Consultants can view their own targets, admins can view all.
    """
    # Check permissions
    if current_user.role == UserRole.CONSULTANT:
        if (not hasattr(current_user, 'consultant_profile') or 
            not current_user.consultant_profile or
            str(current_user.consultant_profile.id) != str(consultant_id)):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant targets"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view consultant targets"
        )
    
    try:
        targets = consultant_service.get_consultant_targets(
            db,
            consultant_id=consultant_id,
            year=year,
            is_active=is_active
        )
        return targets
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving consultant targets: {str(e)}"
        )

@router.put("/{consultant_id}/targets", response_model=List[ConsultantTarget])
async def update_consultant_targets(
    targets_update: List[ConsultantTargetUpdate],
    consultant_id: UUID = Path(..., description="Consultant ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update consultant performance targets.
    Only admins can update consultant targets.
    """
    try:
        targets = consultant_service.update_consultant_targets(
            db,
            consultant_id=consultant_id,
            targets_data=targets_update,
            updated_by=current_user.id
        )
        return targets
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating consultant targets: {str(e)}"
        )