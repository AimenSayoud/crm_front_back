from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_admin_user,
    get_pagination_params, PaginationParams,
    get_common_filters, CommonFilters
)
from app.services.job import job_service
from app.schemas.job import (
    JobBase, JobCreate, JobUpdate, Job, JobWithDetails,
    JobSkillRequirementBase, JobSkillRequirementCreate, JobSkillRequirementUpdate, JobSkillRequirement,
    JobSearchFilters, JobListResponse, JobApplicationSummary
)
from app.models.user import User
from app.models.enums import UserRole, JobStatus, ExperienceLevel

router = APIRouter()

# ============== JOB SEARCH & MATCHING ==============

@router.get("/search", response_model=JobListResponse)
async def search_jobs(
    q: str = Query(..., description="Search query"),
    skills: Optional[List[str]] = Query(None, description="Required skills"),
    location: Optional[str] = Query(None, description="Location"),
    remote_only: Optional[bool] = Query(False, description="Remote jobs only"),
    experience_level: Optional[ExperienceLevel] = Query(None, description="Experience level"),
    salary_min: Optional[float] = Query(None, description="Minimum salary"),
    salary_max: Optional[float] = Query(None, description="Maximum salary"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Advanced job search with multiple criteria.
    All authenticated users can search jobs.
    """
    try:
        search_filters = JobSearchFilters(
            query=q,
            skills=skills,
            location=location,
            is_remote=remote_only,
            experience_level=experience_level,
            salary_min=salary_min,
            salary_max=salary_max,
            status=JobStatus.OPEN,  # Only show open jobs in search
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by="relevance",
            sort_order="desc"
        )
        
        jobs, total = job_service.get_jobs_with_search(db, filters=search_filters)
        
        return JobListResponse(
            jobs=jobs,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error searching jobs: {str(e)}"
        )

# ============== JOB CRUD OPERATIONS ==============

@router.get("/", response_model=JobListResponse)
async def list_jobs(
    # Search and filtering
    status_filter: Optional[JobStatus] = Query(None, description="Filter by job status"),
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    location: Optional[str] = Query(None, description="Filter by location"),
    experience_level: Optional[ExperienceLevel] = Query(None, description="Filter by experience level"),
    remote_only: Optional[bool] = Query(None, description="Show only remote jobs"),
    salary_min: Optional[float] = Query(None, description="Minimum salary filter"),
    salary_max: Optional[float] = Query(None, description="Maximum salary filter"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    List jobs with filtering and search.
    All authenticated users can view active jobs.
    """
    try:
        # Build search filters
        search_filters = JobSearchFilters(
            query=filters.q,
            status=status_filter,
            company_id=company_id,
            location=location,
            experience_level=experience_level,
            is_remote=remote_only,
            salary_min=salary_min,
            salary_max=salary_max,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "created_at",
            sort_order=filters.sort_order
        )
        
        jobs, total = job_service.get_jobs_with_search(db, filters=search_filters)
        
        return JobListResponse(
            jobs=jobs,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving jobs: {str(e)}"
        )

@router.post("/", response_model=Job)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Create a new job posting.
    Only employers and admins can create jobs.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to create jobs"
        )
    
    try:
        job = job_service.create_job(
            db,
            job_data=job_data,
            created_by=current_user.id
        )
        return job
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating job: {str(e)}"
        )

@router.get("/{job_id}", response_model=JobWithDetails)
async def get_job(
    job_id: UUID = Path(..., description="Job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get job details by ID.
    All authenticated users can view job details.
    """
    try:
        job = job_service.get_job_with_details(db, job_id=job_id)
        if not job:
            raise HTTPException(
                status_code=404,
                detail="Job not found"
            )
        
        return job
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving job: {str(e)}"
        )

@router.put("/{job_id}", response_model=Job)
async def update_job(
    job_update: JobUpdate,
    job_id: UUID = Path(..., description="Job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update job information.
    Only job creator, company members, or admins can update.
    """
    try:
        # Check permissions
        job = job_service.get(db, id=job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if current_user.role == UserRole.EMPLOYER:
            # Check if user can modify this job
            if not job_service.can_user_modify_job(db, job_id=job_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to update this job"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to update jobs"
            )
        
        updated_job = job_service.update_job(
            db,
            job_id=job_id,
            update_data=job_update,
            updated_by=current_user.id
        )
        return updated_job
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating job: {str(e)}"
        )

@router.delete("/{job_id}")
async def delete_job(
    job_id: UUID = Path(..., description="Job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Delete a job posting.
    Only job creator, company members, or admins can delete.
    """
    try:
        # Check permissions (same as update)
        job = job_service.get(db, id=job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if current_user.role == UserRole.EMPLOYER:
            if not job_service.can_user_modify_job(db, job_id=job_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to delete this job"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to delete jobs"
            )
        
        success = job_service.delete_job(
            db,
            job_id=job_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return {"message": "Job deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting job: {str(e)}"
        )

# ============== JOB STATUS MANAGEMENT ==============

@router.post("/{job_id}/close")
async def close_job(
    job_id: UUID = Path(..., description="Job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Close a job posting.
    Only job creator, company members, or admins can close jobs.
    """
    try:
        success = job_service.close_job(
            db,
            job_id=job_id,
            closed_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Job not found or access denied"
            )
        
        return {"message": "Job closed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error closing job: {str(e)}"
        )

@router.post("/{job_id}/reopen")
async def reopen_job(
    job_id: UUID = Path(..., description="Job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Reopen a closed job posting.
    Only job creator, company members, or admins can reopen jobs.
    """
    try:
        success = job_service.reopen_job(
            db,
            job_id=job_id,
            reopened_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Job not found or access denied"
            )
        
        return {"message": "Job reopened successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reopening job: {str(e)}"
        )

# ============== JOB APPLICATIONS ==============

@router.get("/{job_id}/applications", response_model=List[JobApplicationSummary])
async def get_job_applications(
    job_id: UUID = Path(..., description="Job ID"),
    status_filter: Optional[str] = Query(None, description="Filter by application status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get applications for a specific job.
    Only job creator, company members, or admins can view applications.
    """
    try:
        # Check permissions
        if current_user.role == UserRole.EMPLOYER:
            if not job_service.can_user_modify_job(db, job_id=job_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to view job applications"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CONSULTANT]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view job applications"
            )
        
        applications = job_service.get_job_applications(
            db,
            job_id=job_id,
            status_filter=status_filter,
            skip=pagination.skip,
            limit=pagination.page_size
        )
        return applications
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving job applications: {str(e)}"
        )

# ============== JOB SKILL REQUIREMENTS ==============

@router.post("/{job_id}/skills", response_model=JobSkillRequirement)
async def add_job_skill_requirement(
    skill_data: JobSkillRequirementBase,
    job_id: UUID = Path(..., description="Job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Add skill requirement to a job.
    Only job creator, company members, or admins can add skill requirements.
    """
    try:
        # Check permissions (same as job update)
        if current_user.role == UserRole.EMPLOYER:
            if not job_service.can_user_modify_job(db, job_id=job_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to modify job requirements"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to modify job requirements"
            )
        
        # Create JobSkillRequirementCreate with job_id from path
        skill_requirement_create = JobSkillRequirementCreate(
            job_id=job_id,
            **skill_data.model_dump()
        )
        
        skill_requirement = job_service.add_skill_requirement(
            db,
            job_id=job_id,
            skill_data=skill_requirement_create
        )
        return skill_requirement
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Full error traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Error adding skill requirement: {str(e)}"
        )

@router.put("/{job_id}/skills/{skill_requirement_id}", response_model=JobSkillRequirement)
async def update_job_skill_requirement(
    skill_update: JobSkillRequirementUpdate,
    job_id: UUID = Path(..., description="Job ID"),
    skill_requirement_id: UUID = Path(..., description="Skill requirement ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update job skill requirement.
    Only job creator, company members, or admins can update skill requirements.
    """
    try:
        # Check permissions (same as job update)
        if current_user.role == UserRole.EMPLOYER:
            if not job_service.can_user_modify_job(db, job_id=job_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to modify job requirements"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to modify job requirements"
            )
        
        updated_requirement = job_service.update_skill_requirement(
            db,
            skill_requirement_id=skill_requirement_id,
            update_data=skill_update
        )
        if not updated_requirement:
            raise HTTPException(
                status_code=404,
                detail="Skill requirement not found"
            )
        return updated_requirement
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating skill requirement: {str(e)}"
        )

@router.delete("/{job_id}/skills/{skill_requirement_id}")
async def remove_job_skill_requirement(
    job_id: UUID = Path(..., description="Job ID"),
    skill_requirement_id: UUID = Path(..., description="Skill requirement ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Remove skill requirement from a job.
    Only job creator, company members, or admins can remove skill requirements.
    """
    try:
        # Check permissions (same as job update)
        if current_user.role == UserRole.EMPLOYER:
            if not job_service.can_user_modify_job(db, job_id=job_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to modify job requirements"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to modify job requirements"
            )
        
        success = job_service.remove_skill_requirement(
            db,
            skill_requirement_id=skill_requirement_id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Skill requirement not found"
            )
        
        return {"message": "Skill requirement removed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error removing skill requirement: {str(e)}"
        )

@router.get("/{job_id}/similar", response_model=List[Job])
async def get_similar_jobs(
    job_id: UUID = Path(..., description="Job ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of similar jobs to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get jobs similar to the specified job.
    All authenticated users can view similar jobs.
    """
    try:
        similar_jobs = job_service.get_similar_jobs(
            db,
            job_id=job_id,
            limit=limit
        )
        return similar_jobs
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving similar jobs: {str(e)}"
        )