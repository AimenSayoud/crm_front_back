from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_admin_user, get_current_active_user,
    get_pagination_params, PaginationParams, check_company_access,
    check_candidate_access, get_consultant_user, get_employer_user
)
from app.services.analytics import analytics_service
from app.schemas.analytics import (
    DashboardOverviewResponse, ApplicationAnalyticsResponse,
    JobAnalyticsResponse, CandidateAnalyticsResponse,
    ConsultantAnalyticsResponse, CompanyAnalyticsResponse,
    AnalyticsFilters, DateRangeFilter, ExportRequest, ExportResponse
)
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter()

# Helper function to parse date range
def parse_date_range(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Optional[tuple[datetime, datetime]]:
    """Parse date range from query parameters"""
    if not start_date and not end_date:
        return None
    
    try:
        if start_date and end_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            return (start, end)
        elif start_date:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end = datetime.now()
            return (start, end)
        else:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            start = end - timedelta(days=30)  # Default to 30 days
            return (start, end)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"
        )

@router.get("/dashboard", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get comprehensive dashboard overview with key metrics.
    Requires admin or superadmin access.
    """
    date_range = parse_date_range(start_date, end_date)
    
    try:
        overview_data = analytics_service.get_dashboard_overview(
            db, date_range=date_range
        )
        return overview_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating dashboard overview: {str(e)}"
        )

@router.get("/applications", response_model=ApplicationAnalyticsResponse)
async def get_application_analytics(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    job_id: Optional[UUID] = Query(None, description="Filter by job ID"),
    consultant_id: Optional[UUID] = Query(None, description="Filter by consultant ID"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get detailed application analytics with filtering.
    Access control based on user role.
    """
    # Role-based access control
    if current_user.role == UserRole.EMPLOYER and company_id:
        if not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company data"
            )
    elif current_user.role == UserRole.CONSULTANT and consultant_id:
        if str(consultant_id) != str(current_user.consultant_profile.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant data"
            )
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions for application analytics"
        )
    
    date_range = parse_date_range(start_date, end_date)
    
    try:
        analytics_data = analytics_service.get_application_analytics(
            db,
            company_id=company_id,
            job_id=job_id,
            consultant_id=consultant_id,
            date_range=date_range
        )
        return analytics_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating application analytics: {str(e)}"
        )

@router.get("/jobs", response_model=JobAnalyticsResponse)
async def get_job_analytics(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get job posting and performance analytics.
    Employers can only see their company data.
    """
    # Role-based access control
    if current_user.role == UserRole.EMPLOYER:
        if company_id and not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company data"
            )
        # If no company_id provided, get user's company
        if not company_id and hasattr(current_user, 'employer_profiles'):
            employer_profile = current_user.employer_profiles[0] if current_user.employer_profiles else None
            if employer_profile:
                company_id = employer_profile.company_id
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN, UserRole.CONSULTANT]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions for job analytics"
        )
    
    date_range = parse_date_range(start_date, end_date)
    
    try:
        analytics_data = analytics_service.get_job_analytics(
            db,
            company_id=company_id,
            date_range=date_range
        )
        return analytics_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating job analytics: {str(e)}"
        )

@router.get("/candidates", response_model=CandidateAnalyticsResponse)
async def get_candidate_analytics(
    consultant_id: Optional[UUID] = Query(None, description="Filter by consultant ID"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get candidate pool and performance analytics.
    Consultants can only see their assigned candidates.
    """
    # Role-based access control
    if current_user.role == UserRole.CONSULTANT:
        if consultant_id and str(consultant_id) != str(current_user.consultant_profile.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied to consultant data"
            )
        # Set consultant_id to current user if not provided
        if not consultant_id:
            consultant_id = current_user.consultant_profile.id
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions for candidate analytics"
        )
    
    date_range = parse_date_range(start_date, end_date)
    
    try:
        analytics_data = analytics_service.get_candidate_analytics(
            db,
            consultant_id=consultant_id,
            date_range=date_range
        )
        return analytics_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating candidate analytics: {str(e)}"
        )

@router.get("/consultants", response_model=ConsultantAnalyticsResponse)
async def get_consultant_analytics(
    consultant_id: Optional[UUID] = Query(None, description="Filter by specific consultant"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get consultant performance analytics.
    Individual consultants can only see their own data.
    """
    # Role-based access control
    if current_user.role == UserRole.CONSULTANT:
        if consultant_id and str(consultant_id) != str(current_user.consultant_profile.id):
            raise HTTPException(
                status_code=403,
                detail="Access denied to other consultant data"
            )
        # Set to current user's consultant profile
        consultant_id = current_user.consultant_profile.id
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions for consultant analytics"
        )
    
    date_range = parse_date_range(start_date, end_date)
    
    try:
        analytics_data = analytics_service.get_consultant_analytics(
            db,
            consultant_id=consultant_id,
            date_range=date_range
        )
        return analytics_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating consultant analytics: {str(e)}"
        )

@router.get("/companies", response_model=CompanyAnalyticsResponse)
async def get_company_analytics(
    company_id: Optional[UUID] = Query(None, description="Filter by specific company"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get company hiring and performance analytics.
    Employers can only see their own company data.
    """
    # Role-based access control
    if current_user.role == UserRole.EMPLOYER:
        if company_id and not check_company_access(company_id, current_user, db):
            raise HTTPException(
                status_code=403,
                detail="Access denied to company data"
            )
        # If no company_id provided, get user's company
        if not company_id and hasattr(current_user, 'employer_profiles'):
            employer_profile = current_user.employer_profiles[0] if current_user.employer_profiles else None
            if employer_profile:
                company_id = employer_profile.company_id
    elif current_user.role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions for company analytics"
        )
    
    date_range = parse_date_range(start_date, end_date)
    
    try:
        analytics_data = analytics_service.get_company_analytics(
            db,
            company_id=company_id,
            date_range=date_range
        )
        return analytics_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating company analytics: {str(e)}"
        )

@router.get("/trends")
async def get_trend_analysis(
    metric: str = Query(..., description="Metric to analyze (applications, jobs, hires, etc.)"),
    period: str = Query("monthly", description="Period for trend analysis (daily, weekly, monthly)"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get trend analysis for specified metrics.
    Requires admin access.
    """
    date_range = parse_date_range(start_date, end_date)
    
    # This would implement trend analysis logic
    # For now, return a placeholder response
    return {
        "metric_name": metric,
        "period": period,
        "trend_direction": "stable",
        "growth_rate": 0.0,
        "data_points": []
    }

@router.get("/kpis")
async def get_key_performance_indicators(
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get key performance indicators for the platform.
    Requires admin access.
    """
    date_range = parse_date_range(start_date, end_date)
    
    try:
        # Get various analytics
        dashboard_data = analytics_service.get_dashboard_overview(db, date_range=date_range)
        application_data = analytics_service.get_application_analytics(db, date_range=date_range)
        job_data = analytics_service.get_job_analytics(db, date_range=date_range)
        
        # Calculate KPIs
        kpis = {
            "time_to_hire": application_data.get("time_metrics", {}).get("average_time_to_hire_days", 0),
            "application_conversion_rate": application_data.get("conversion_rates", {}).get("application_to_interview", 0),
            "job_fill_rate": job_data.get("performance_metrics", {}).get("fill_rate", 0),
            "candidate_satisfaction": 85.0,  # This would come from surveys
            "employer_satisfaction": 87.5,   # This would come from surveys
            "platform_growth_rate": dashboard_data.get("active_metrics", {}).get("application_growth_percent", 0),
            "revenue_per_hire": 2500.0,      # This would be calculated from billing data
            "consultant_efficiency": 75.0    # Average across all consultants
        }
        
        return {
            "kpis": kpis,
            "period": {
                "start_date": date_range[0].isoformat() if date_range else None,
                "end_date": date_range[1].isoformat() if date_range else None
            },
            "generated_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating KPIs: {str(e)}"
        )

@router.post("/custom-report")
async def generate_custom_report(
    report_request: dict,  # This would be a proper schema
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Generate a custom report based on specified parameters.
    Requires admin access.
    """
    # This would implement custom report generation
    # For now, return a placeholder response
    import uuid
    
    report_id = str(uuid.uuid4())
    
    return {
        "report_id": report_id,
        "status": "generating",
        "estimated_completion": (datetime.now() + timedelta(minutes=5)).isoformat(),
        "download_url": f"/api/v1/analytics/reports/{report_id}"
    }

@router.get("/reports/{report_id}")
async def get_generated_report(
    report_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get a previously generated report.
    Requires admin access.
    """
    # This would fetch the generated report
    # For now, return a placeholder response
    return {
        "report_id": report_id,
        "status": "completed",
        "generated_at": datetime.now().isoformat(),
        "data": {
            "summary": "Report data would be here",
            "charts": [],
            "tables": []
        }
    }

@router.post("/export", response_model=ExportResponse)
async def export_analytics_data(
    export_request: ExportRequest,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Export analytics data in specified format.
    Requires admin access.
    """
    # This would implement data export functionality
    # For now, return a placeholder response
    import uuid
    
    export_id = str(uuid.uuid4())
    
    return ExportResponse(
        export_id=export_id,
        download_url=f"/api/v1/analytics/exports/{export_id}/download",
        expires_at=datetime.now() + timedelta(hours=24),
        file_size_mb=1.5
    )

@router.get("/exports/{export_id}/download")
async def download_export(
    export_id: str,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Download exported analytics data.
    Requires admin access.
    """
    # This would serve the exported file
    # For now, return a placeholder response
    return {"message": f"Download would start for export {export_id}"}

@router.get("/benchmarks")
async def get_industry_benchmarks(
    industry: Optional[str] = Query(None, description="Industry to compare against"),
    company_size: Optional[str] = Query(None, description="Company size category"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get industry benchmark comparisons.
    Requires admin access.
    """
    # This would implement benchmark comparison logic
    # For now, return placeholder data
    return {
        "industry": industry or "technology",
        "company_size": company_size or "medium",
        "benchmarks": {
            "time_to_hire": {
                "your_value": 25.5,
                "industry_average": 23.2,
                "percentile_rank": 60
            },
            "cost_per_hire": {
                "your_value": 3200.0,
                "industry_average": 2850.0,
                "percentile_rank": 40
            },
            "application_conversion_rate": {
                "your_value": 12.5,
                "industry_average": 15.2,
                "percentile_rank": 35
            }
        },
        "generated_at": datetime.now().isoformat()
    }