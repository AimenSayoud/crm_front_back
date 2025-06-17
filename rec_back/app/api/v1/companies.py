from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_admin_user,
    get_employer_user, get_pagination_params, PaginationParams,
    check_company_access, get_common_filters, CommonFilters
)
from app.services.company import company_service
from app.schemas.employer import (
    CompanyCreate, CompanyUpdate, Company, CompanyStats,
    CompanySearchFilters, CompanyListResponse,
    CompanyContact, CompanyContactCreate, CompanyContactUpdate,
    CompanyHiringPreferences, CompanyHiringPreferencesCreate, CompanyHiringPreferencesUpdate,
    RecruitmentHistory, RecruitmentHistoryCreate, RecruitmentHistoryUpdate,
    EmployerProfile, EmployerProfileCreate, EmployerProfileUpdate
)
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter()

@router.get("/", response_model=CompanyListResponse)
async def list_companies(
    # Search and filtering
    name: Optional[str] = Query(None, description="Search by company name"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    company_size: Optional[str] = Query(None, description="Filter by company size"),
    location: Optional[str] = Query(None, description="Filter by location"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    List companies with search and filtering.
    All authenticated users can view companies.
    """
    try:
        # Build search filters
        search_filters = CompanySearchFilters(
            name=name or filters.q,
            industry=industry,
            company_size=company_size,
            location=location,
            is_active=is_active,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "name",
            sort_order=filters.sort_order
        )
        
        companies, total = company_service.get_companies_with_search(
            db, filters=search_filters
        )
        
        return CompanyListResponse(
            companies=companies,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving companies: {str(e)}"
        )

@router.post("/", response_model=Company)
async def create_company(
    company_data: CompanyCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new company.
    Only admins and superadmins can create companies.
    """
    try:
        company = company_service.create_company(
            db,
            company_data=company_data,
            created_by=current_user.id
        )
        return company
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating company: {str(e)}"
        )

@router.get("/{company_id}", response_model=Company)
async def get_company(
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get company details by ID.
    All authenticated users can view company details.
    """
    try:
        company = company_service.get_company_with_details(db, id=company_id)
        if not company:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
        
        return company
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving company: {str(e)}"
        )

@router.put("/{company_id}", response_model=Company)
async def update_company(
    company_update: CompanyUpdate,
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update company information.
    Only employers from the company or admins can update.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to update this company"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to update company"
        )
    
    try:
        updated_company = company_service.update_company(
            db,
            company_id=company_id,
            update_data=company_update,
            updated_by=current_user.id
        )
        if not updated_company:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
        return updated_company
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating company: {str(e)}"
        )

@router.delete("/{company_id}")
async def delete_company(
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete a company.
    Only admins and superadmins can delete companies.
    """
    try:
        success = company_service.delete_company(
            db,
            company_id=company_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
        return {"message": "Company deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting company: {str(e)}"
        )

@router.get("/{company_id}/jobs")
async def get_company_jobs(
    company_id: UUID = Path(..., description="Company ID"),
    status: Optional[str] = Query(None, description="Filter by job status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get all jobs posted by a company.
    All authenticated users can view company jobs.
    """
    try:
        jobs, total = company_service.get_company_jobs(
            db,
            company_id=company_id,
            status=status,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        
        return {
            "items": jobs,
            "total": total,
            "page": pagination.page,
            "page_size": pagination.page_size,
            "pages": (total + pagination.page_size - 1) // pagination.page_size
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving company jobs: {str(e)}"
        )

@router.get("/{company_id}/employees", response_model=List[EmployerProfile])
async def get_company_employees(
    company_id: UUID = Path(..., description="Company ID"),
    pagination: PaginationParams = Depends(get_pagination_params),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get company employees/employer profiles.
    Only company members or admins can view.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company employees"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view company employees"
        )
    
    try:
        employees = company_service.get_company_employees(
            db,
            company_id=company_id,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        return employees
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving company employees: {str(e)}"
        )

@router.get("/{company_id}/analytics", response_model=CompanyStats)
async def get_company_analytics(
    company_id: UUID = Path(..., description="Company ID"),
    start_date: Optional[str] = Query(None, description="Start date for analytics"),
    end_date: Optional[str] = Query(None, description="End date for analytics"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get company hiring analytics and statistics.
    Only company members or admins can view.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company analytics"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view company analytics"
        )
    
    try:
        analytics = company_service.get_company_analytics(
            db,
            company_id=company_id,
            start_date=start_date,
            end_date=end_date
        )
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving company analytics: {str(e)}"
        )

@router.get("/{company_id}/contacts", response_model=List[CompanyContact])
async def get_company_contacts(
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get company contacts.
    Only company members or admins can view.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company contacts"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view company contacts"
        )
    
    try:
        contacts = company_service.get_company_contacts(db, company_id=company_id)
        return contacts
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving company contacts: {str(e)}"
        )

@router.post("/{company_id}/contacts", response_model=CompanyContact)
async def add_company_contact(
    contact_data: CompanyContactCreate,
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Add a new company contact.
    Only company members or admins can add contacts.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to add company contacts"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to add company contacts"
        )
    
    try:
        contact = company_service.add_company_contact(
            db,
            company_id=company_id,
            contact_data=contact_data,
            created_by=current_user.id
        )
        return contact
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error adding company contact: {str(e)}"
        )

@router.put("/{company_id}/contacts/{contact_id}", response_model=CompanyContact)
async def update_company_contact(
    contact_update: CompanyContactUpdate,
    company_id: UUID = Path(..., description="Company ID"),
    contact_id: UUID = Path(..., description="Contact ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update a company contact.
    Only company members or admins can update contacts.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to update company contacts"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to update company contacts"
        )
    
    try:
        contact = company_service.update_company_contact(
            db,
            contact_id=contact_id,
            update_data=contact_update,
            updated_by=current_user.id
        )
        if not contact:
            raise HTTPException(
                status_code=404,
                detail="Contact not found"
            )
        return contact
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating company contact: {str(e)}"
        )

@router.delete("/{company_id}/contacts/{contact_id}")
async def delete_company_contact(
    company_id: UUID = Path(..., description="Company ID"),
    contact_id: UUID = Path(..., description="Contact ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Delete a company contact.
    Only company members or admins can delete contacts.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to delete company contacts"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to delete company contacts"
        )
    
    try:
        success = company_service.delete_company_contact(
            db,
            contact_id=contact_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Contact not found"
            )
        return {"message": "Contact deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting company contact: {str(e)}"
        )

@router.get("/{company_id}/hiring-preferences", response_model=CompanyHiringPreferences)
async def get_hiring_preferences(
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get company hiring preferences.
    Only company members or admins can view.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company hiring preferences"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to view hiring preferences"
        )
    
    try:
        preferences = company_service.get_hiring_preferences(db, company_id=company_id)
        if not preferences:
            raise HTTPException(
                status_code=404,
                detail="Hiring preferences not found"
            )
        return preferences
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving hiring preferences: {str(e)}"
        )

@router.put("/{company_id}/hiring-preferences", response_model=CompanyHiringPreferences)
async def update_hiring_preferences(
    preferences_update: CompanyHiringPreferencesUpdate,
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Update company hiring preferences.
    Only company members or admins can update.
    """
    # Check permissions
    if current_user.role == UserRole.EMPLOYER:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to update hiring preferences"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to update hiring preferences"
        )
    
    try:
        preferences = company_service.update_hiring_preferences(
            db,
            company_id=company_id,
            update_data=preferences_update,
            updated_by=current_user.id
        )
        return preferences
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating hiring preferences: {str(e)}"
        )

# ============== COMPANY DASHBOARD & ANALYTICS ==============

@router.get("/{company_id}/dashboard-stats")
async def get_company_dashboard_stats(
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get comprehensive company dashboard statistics.
    Only company members or admins can view dashboard stats.
    """
    try:
        # Check permissions
        if current_user.role == UserRole.EMPLOYER:
            if not company_service.is_company_member(db, company_id=company_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to company dashboard"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view company dashboard"
            )
        
        stats = company_service.get_company_dashboard_stats(db, company_id=company_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving company dashboard stats: {str(e)}"
        )

@router.get("/{company_id}/talent-pipeline")
async def get_company_talent_pipeline(
    company_id: UUID = Path(..., description="Company ID"),
    job_id: Optional[UUID] = Query(None, description="Filter by specific job ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get talent pipeline analytics for company.
    Only company members or admins can view talent pipeline.
    """
    try:
        # Check permissions
        if current_user.role == UserRole.EMPLOYER:
            if not company_service.is_company_member(db, company_id=company_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to company talent pipeline"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view talent pipeline"
            )
        
        pipeline = company_service.get_talent_pipeline(db, company_id=company_id, job_id=job_id)
        return pipeline
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving talent pipeline: {str(e)}"
        )

@router.get("/{company_id}/competitor-analysis")
async def get_company_competitor_analysis(
    company_id: UUID = Path(..., description="Company ID"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get competitor analysis for company.
    Only company members or admins can view competitor analysis.
    """
    try:
        # Check permissions
        if current_user.role == UserRole.EMPLOYER:
            if not company_service.is_company_member(db, company_id=company_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to competitor analysis"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view competitor analysis"
            )
        
        analysis = company_service.get_competitor_analysis(db, company_id=company_id)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving competitor analysis: {str(e)}"
        )

@router.get("/{company_id}/recruitment-efficiency")
async def get_company_recruitment_efficiency(
    company_id: UUID = Path(..., description="Company ID"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get recruitment efficiency metrics for company.
    Only company members or admins can view efficiency metrics.
    """
    try:
        # Check permissions
        if current_user.role == UserRole.EMPLOYER:
            if not company_service.is_company_member(db, company_id=company_id, user_id=current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to recruitment efficiency metrics"
                )
        elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view efficiency metrics"
            )
        
        # Parse dates if provided
        from datetime import datetime
        date_from_obj = None
        date_to_obj = None
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")
        
        metrics = company_service.get_recruitment_efficiency_metrics(
            db, 
            company_id=company_id,
            date_from=date_from_obj,
            date_to=date_to_obj
        )
        return metrics
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving recruitment efficiency metrics: {str(e)}"
        )

@router.post("/create-with-admin", response_model=Company)
async def create_company_with_admin(
    company_data: CompanyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Create a new company and assign current user as admin.
    Only employers can create companies with themselves as admin.
    """
    if current_user.role not in [UserRole.EMPLOYER, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to create company"
        )
    
    try:
        company = company_service.create_company_with_admin(
            db,
            company_data=company_data,
            admin_user_id=current_user.id
        )
        return company
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating company: {str(e)}"
        )

@router.post("/{company_id}/verify")
async def verify_company(
    company_id: UUID = Path(..., description="Company ID"),
    verification_notes: Optional[str] = Query(None, description="Verification notes"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Verify a company profile.
    Only admins can verify companies.
    """
    try:
        success = company_service.verify_company(
            db,
            company_id=company_id,
            verified_by=current_user.id,
            verification_notes=verification_notes
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
        
        return {"message": "Company verified successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error verifying company: {str(e)}"
        )