from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_admin_user,
    get_pagination_params, PaginationParams,
    get_common_filters, CommonFilters,
    check_resource_ownership
)
from app.services.user import user_service
from app.schemas.auth import UserResponse, RegisterRequest
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def list_users(
    # Search and filtering
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_verified: Optional[bool] = Query(None, description="Filter by verification status"),
    office_id: Optional[str] = Query(None, description="Filter by office ID"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    List users with search and filtering.
    Only admins and superadmins can view all users.
    """
    try:
        # Build search filters
        search_filters = {
            "query": filters.q,
            "role": role,
            "is_active": is_active,
            "is_verified": is_verified,
            "office_id": office_id,
            "page": pagination.page,
            "page_size": pagination.page_size,
            "sort_by": filters.sort_by or "created_at",
            "sort_order": filters.sort_order
        }
        
        users, total = user_service.get_users_with_search(
            db, filters=search_filters
        )
        
        return {
            "items": users,
            "total": total,
            "page": pagination.page,
            "page_size": pagination.page_size,
            "pages": (total + pagination.page_size - 1) // pagination.page_size
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving users: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get user details by ID.
    Users can view their own profile, admins can view any user.
    """
    # Check permissions
    if not check_resource_ownership(user_id, current_user, allow_admin=True):
        raise HTTPException(
            status_code=403,
            detail="Access denied to this user profile"
        )
    
    try:
        user = user_service.get_user_with_details(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        return user
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_update: dict,  # Would be proper UserUpdate schema
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update user information.
    Users can update their own profile, admins can update any user.
    """
    # Check permissions
    if not check_resource_ownership(user_id, current_user, allow_admin=True):
        raise HTTPException(
            status_code=403,
            detail="Access denied to update this user profile"
        )
    
    try:
        updated_user = user_service.update_user(
            db,
            user_id=user_id,
            update_data=user_update,
            updated_by=current_user.id
        )
        if not updated_user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return updated_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user: {str(e)}"
        )

@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete a user account.
    Only admins and superadmins can delete users.
    """
    try:
        success = user_service.delete_user(
            db,
            user_id=user_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting user: {str(e)}"
        )

@router.post("/{user_id}/activate")
async def activate_user(
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Activate a user account.
    Only admins and superadmins can activate users.
    """
    try:
        success = user_service.activate_user(
            db,
            user_id=user_id,
            activated_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return {"message": "User activated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error activating user: {str(e)}"
        )

@router.post("/{user_id}/deactivate")
async def deactivate_user(
    user_id: UUID = Path(..., description="User ID"),
    reason: Optional[str] = Query(None, description="Reason for deactivation"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Deactivate a user account.
    Only admins and superadmins can deactivate users.
    """
    try:
        success = user_service.deactivate_user(
            db,
            user_id=user_id,
            reason=reason,
            deactivated_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return {"message": "User deactivated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deactivating user: {str(e)}"
        )

@router.get("/{user_id}/activity")
async def get_user_activity(
    user_id: UUID = Path(..., description="User ID"),
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    start_date: Optional[str] = Query(None, description="Start date for activity log"),
    end_date: Optional[str] = Query(None, description="End date for activity log"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get user activity log.
    Only admins and superadmins can view user activity.
    """
    try:
        activity_log = user_service.get_user_activity_log(
            db,
            user_id=user_id,
            activity_type=activity_type,
            start_date=start_date,
            end_date=end_date,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        
        return {
            "user_id": str(user_id),
            "activities": activity_log,
            "page": pagination.page,
            "page_size": pagination.page_size
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving user activity: {str(e)}"
        )

@router.post("/bulk-import")
async def bulk_import_users(
    user_data: List[RegisterRequest],
    send_invitations: bool = Query(True, description="Send invitation emails to new users"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Bulk import users from a list.
    Only admins and superadmins can bulk import users.
    """
    try:
        results = user_service.bulk_import_users(
            db,
            users_data=user_data,
            send_invitations=send_invitations,
            imported_by=current_user.id
        )
        
        return {
            "total_processed": len(user_data),
            "successful_imports": len(results["successful"]),
            "failed_imports": len(results["failed"]),
            "successful_users": results["successful"],
            "failed_users": results["failed"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error bulk importing users: {str(e)}"
        )

@router.get("/{user_id}/profile-completeness")
async def get_profile_completeness(
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get user profile completeness score and suggestions.
    Users can check their own profile, admins can check any profile.
    """
    # Check permissions
    if not check_resource_ownership(user_id, current_user, allow_admin=True):
        raise HTTPException(
            status_code=403,
            detail="Access denied to this user profile"
        )
    
    try:
        completeness = user_service.get_profile_completeness(db, user_id=user_id)
        return completeness
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating profile completeness: {str(e)}"
        )

@router.post("/{user_id}/send-verification-email")
async def send_verification_email(
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Send email verification to user.
    Users can request for their own email, admins can send to any user.
    """
    # Check permissions
    if not check_resource_ownership(user_id, current_user, allow_admin=True):
        raise HTTPException(
            status_code=403,
            detail="Access denied to send verification email for this user"
        )
    
    try:
        success = user_service.send_verification_email(
            db,
            user_id=user_id,
            requested_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return {"message": "Verification email sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending verification email: {str(e)}"
        )

@router.get("/{user_id}/roles-permissions")
async def get_user_roles_and_permissions(
    user_id: UUID = Path(..., description="User ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get user roles and permissions breakdown.
    Only admins and superadmins can view user permissions.
    """
    try:
        permissions = user_service.get_user_permissions(db, user_id=user_id)
        if not permissions:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return permissions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving user permissions: {str(e)}"
        )

@router.put("/{user_id}/role")
async def update_user_role(
    user_id: UUID = Path(..., description="User ID"),
    new_role: UserRole = Query(..., description="New user role"),
    reason: Optional[str] = Query(None, description="Reason for role change"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update user role.
    Only admins and superadmins can change user roles.
    """
    try:
        success = user_service.update_user_role(
            db,
            user_id=user_id,
            new_role=new_role,
            reason=reason,
            updated_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        return {"message": f"User role updated to {new_role} successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating user role: {str(e)}"
        )

@router.get("/{user_id}/statistics")
async def get_user_statistics(
    user_id: UUID = Path(..., description="User ID"),
    start_date: Optional[str] = Query(None, description="Start date for statistics"),
    end_date: Optional[str] = Query(None, description="End date for statistics"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get user-specific statistics and metrics.
    Users can view their own stats, admins can view any user's stats.
    """
    # Check permissions
    if not check_resource_ownership(user_id, current_user, allow_admin=True):
        raise HTTPException(
            status_code=403,
            detail="Access denied to this user's statistics"
        )
    
    try:
        stats = user_service.get_user_statistics(
            db,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving user statistics: {str(e)}"
        )