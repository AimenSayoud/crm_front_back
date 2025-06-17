from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from uuid import UUID

from app.api.v1.deps import (
    get_database, get_current_active_user, get_admin_user,
    get_optional_current_user, get_pagination_params, PaginationParams,
    get_common_filters, CommonFilters
)
from app.services.skill import skill_service
from app.schemas.skill import (
    SkillCreate, SkillUpdate, Skill, SkillWithCategory,
    SkillCategoryCreate, SkillCategoryUpdate, SkillCategory,
    SkillSearchFilters, SkillListResponse, SkillCategoryListResponse,
    SkillStats, CategoryStats
)
from app.models.user import User
from app.models.enums import UserRole

router = APIRouter()

# ============== SKILLS MANAGEMENT ==============

@router.get("/", response_model=SkillListResponse)
async def list_skills(
    # Search and filtering
    category_id: Optional[UUID] = Query(None, description="Filter by skill category"),
    proficiency_level: Optional[str] = Query(None, description="Filter by proficiency level"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    industry: Optional[str] = Query(None, description="Filter by industry relevance"),
    
    # Pagination and common filters
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    
    # Authentication (optional for public access)
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database)
):
    """
    List skills with search and filtering.
    Public endpoint, but authenticated users get additional details.
    """
    try:
        # Build search filters
        search_filters = SkillSearchFilters(
            query=filters.q,
            category_id=category_id,
            proficiency_level=proficiency_level,
            is_active=is_active,
            industry=industry,
            page=pagination.page,
            page_size=pagination.page_size,
            sort_by=filters.sort_by or "name",
            sort_order=filters.sort_order
        )
        
        # Get additional details for authenticated users
        include_stats = current_user is not None
        
        skills, total = skill_service.get_skills_with_search(
            db, 
            filters=search_filters,
            include_stats=include_stats
        )
        
        return SkillListResponse(
            skills=skills,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving skills: {str(e)}"
        )

@router.post("/", response_model=Skill)
async def create_skill(
    skill_data: SkillCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new skill.
    Only admins can create skills.
    """
    try:
        skill = skill_service.create_skill(
            db,
            skill_data=skill_data,
            created_by=current_user.id
        )
        return skill
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating skill: {str(e)}"
        )

@router.get("/categories", response_model=SkillCategoryListResponse)
async def list_skill_categories(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database)
):
    """
    List skill categories.
    Public endpoint with optional filtering.
    """
    try:
        categories, total = skill_service.get_skill_categories_with_search(
            db,
            query=filters.q,
            is_active=is_active,
            skip=pagination.offset,
            limit=pagination.page_size
        )
        
        return SkillCategoryListResponse(
            categories=categories,
            total=total
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving skill categories: {str(e)}"
        )

@router.get("/{skill_id}", response_model=SkillWithCategory)
async def get_skill(
    skill_id: UUID = Path(..., description="Skill ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database)
):
    """
    Get skill details by ID.
    Public endpoint with additional details for authenticated users.
    """
    try:
        include_stats = current_user is not None
        
        skill = skill_service.get_skill_with_details(
            db, 
            id=skill_id,
            include_stats=include_stats
        )
        if not skill:
            raise HTTPException(
                status_code=404,
                detail="Skill not found"
            )
        
        return skill
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving skill: {str(e)}"
        )

@router.put("/{skill_id}", response_model=Skill)
async def update_skill(
    skill_update: SkillUpdate,
    skill_id: UUID = Path(..., description="Skill ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update skill information.
    Only admins can update skills.
    """
    try:
        updated_skill = skill_service.update_skill(
            db,
            skill_id=skill_id,
            update_data=skill_update,
            updated_by=current_user.id
        )
        if not updated_skill:
            raise HTTPException(
                status_code=404,
                detail="Skill not found"
            )
        return updated_skill
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating skill: {str(e)}"
        )

@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: UUID = Path(..., description="Skill ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete a skill.
    Only admins can delete skills.
    """
    try:
        success = skill_service.delete_skill(
            db,
            skill_id=skill_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Skill not found"
            )
        return {"message": "Skill deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting skill: {str(e)}"
        )

@router.post("/bulk-import")
async def bulk_import_skills(
    skills_data: List[SkillCreate],
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Bulk import skills from a list.
    Only admins can bulk import skills.
    """
    try:
        results = skill_service.bulk_import_skills(
            db,
            skills_data=skills_data,
            imported_by=current_user.id
        )
        
        return {
            "total_processed": len(skills_data),
            "successful_imports": len(results["successful"]),
            "failed_imports": len(results["failed"]),
            "duplicate_skills": len(results["duplicates"]),
            "successful_skills": results["successful"],
            "failed_skills": results["failed"],
            "duplicate_skills": results["duplicates"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error bulk importing skills: {str(e)}"
        )

# ============== SKILL CATEGORIES ==============

@router.get("/categories", response_model=SkillCategoryListResponse)
async def list_skill_categories(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    pagination: PaginationParams = Depends(get_pagination_params),
    filters: CommonFilters = Depends(get_common_filters),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database)
):
    """
    List skill categories.
    Public endpoint with additional details for authenticated users.
    """
    try:
        include_stats = current_user is not None
        
        categories, total = skill_service.get_skill_categories_with_search(
            db,
            query=filters.q,
            is_active=is_active,
            skip=pagination.offset,
            limit=pagination.page_size,
            include_stats=include_stats
        )
        
        return SkillCategoryListResponse(
            items=categories,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving skill categories: {str(e)}"
        )

@router.post("/categories", response_model=SkillCategory)
async def create_skill_category(
    category_data: SkillCategoryCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Create a new skill category.
    Only admins can create skill categories.
    """
    try:
        category = skill_service.create_skill_category(
            db,
            category_data=category_data,
            created_by=current_user.id
        )
        return category
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating skill category: {str(e)}"
        )

@router.get("/categories/{category_id}", response_model=SkillCategory)
async def get_skill_category(
    category_id: UUID = Path(..., description="Skill category ID"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database)
):
    """
    Get skill category details by ID.
    Public endpoint with additional details for authenticated users.
    """
    try:
        include_stats = current_user is not None
        
        category = skill_service.get_skill_category_with_details(
            db, 
            id=category_id,
            include_stats=include_stats
        )
        if not category:
            raise HTTPException(
                status_code=404,
                detail="Skill category not found"
            )
        
        return category
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving skill category: {str(e)}"
        )

@router.put("/categories/{category_id}", response_model=SkillCategory)
async def update_skill_category(
    category_update: SkillCategoryUpdate,
    category_id: UUID = Path(..., description="Skill category ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Update skill category information.
    Only admins can update skill categories.
    """
    try:
        updated_category = skill_service.update_skill_category(
            db,
            category_id=category_id,
            update_data=category_update,
            updated_by=current_user.id
        )
        if not updated_category:
            raise HTTPException(
                status_code=404,
                detail="Skill category not found"
            )
        return updated_category
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating skill category: {str(e)}"
        )

@router.delete("/categories/{category_id}")
async def delete_skill_category(
    category_id: UUID = Path(..., description="Skill category ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Delete a skill category.
    Only admins can delete skill categories.
    """
    try:
        success = skill_service.delete_skill_category(
            db,
            category_id=category_id,
            deleted_by=current_user.id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Skill category not found"
            )
        return {"message": "Skill category deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting skill category: {str(e)}"
        )

# ============== SKILL ANALYTICS & INSIGHTS ==============

@router.get("/trending", response_model=List[SkillStats])
async def get_trending_skills(
    time_period: str = Query("month", description="Time period: week, month, quarter, year"),
    limit: int = Query(10, description="Number of trending skills to return"),
    category_id: Optional[UUID] = Query(None, description="Filter by skill category"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get trending skills based on job postings and candidate profiles.
    Authenticated users can view trending skills.
    """
    try:
        trending_skills = skill_service.get_trending_skills(
            db,
            time_period=time_period,
            limit=limit,
            category_id=category_id
        )
        return trending_skills
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving trending skills: {str(e)}"
        )

@router.get("/demand-analysis")
async def get_skills_demand_analysis(
    start_date: Optional[str] = Query(None, description="Start date for analysis"),
    end_date: Optional[str] = Query(None, description="End date for analysis"),
    location: Optional[str] = Query(None, description="Filter by location"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_database)
):
    """
    Get comprehensive skills demand analysis.
    Only admins can view demand analysis.
    """
    try:
        analysis = skill_service.get_skills_demand_analysis(
            db,
            start_date=start_date,
            end_date=end_date,
            location=location,
            industry=industry
        )
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing skills demand analysis: {str(e)}"
        )

@router.get("/recommendations")
async def get_skill_recommendations(
    user_id: Optional[UUID] = Query(None, description="Get recommendations for specific user"),
    job_id: Optional[UUID] = Query(None, description="Get recommendations for job requirements"),
    limit: int = Query(5, description="Number of recommendations to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get skill recommendations based on user profile or job requirements.
    Authenticated users can get skill recommendations.
    """
    try:
        # If no user_id provided, use current user for candidates
        if not user_id and current_user.role == UserRole.CANDIDATE:
            user_id = current_user.id
        
        recommendations = skill_service.get_skill_recommendations(
            db,
            user_id=user_id,
            job_id=job_id,
            limit=limit
        )
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating skill recommendations: {str(e)}"
        )

@router.get("/gap-analysis")
async def perform_skill_gap_analysis(
    candidate_id: Optional[UUID] = Query(None, description="Candidate ID for gap analysis"),
    job_id: Optional[UUID] = Query(None, description="Job ID for requirements comparison"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Perform skill gap analysis between candidate and job requirements.
    Candidates can analyze their own gaps, consultants/admins can analyze any.
    """
    try:
        # If no candidate_id provided and user is candidate, use current user
        if not candidate_id and current_user.role == UserRole.CANDIDATE:
            candidate_id = current_user.candidate_profile.id if hasattr(current_user, 'candidate_profile') else None
        
        if not candidate_id:
            raise HTTPException(
                status_code=400,
                detail="Candidate ID is required for skill gap analysis"
            )
        
        gap_analysis = skill_service.perform_skill_gap_analysis(
            db,
            candidate_id=candidate_id,
            job_id=job_id
        )
        return gap_analysis
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing skill gap analysis: {str(e)}"
        )

@router.get("/market-insights")
async def get_skill_market_insights(
    skill_ids: Optional[List[UUID]] = Query(None, description="Specific skills to analyze"),
    location: Optional[str] = Query(None, description="Filter by location"),
    time_period: str = Query("quarter", description="Time period for insights"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """
    Get market insights for specific skills including salary trends and demand.
    Authenticated users can view market insights.
    """
    try:
        insights = skill_service.get_skill_market_insights(
            db,
            skill_ids=skill_ids,
            location=location,
            time_period=time_period
        )
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving skill market insights: {str(e)}"
        )

@router.get("/search/autocomplete")
async def skill_search_autocomplete(
    q: str = Query(..., description="Search query for autocomplete"),
    limit: int = Query(10, description="Maximum number of suggestions"),
    category_id: Optional[UUID] = Query(None, description="Filter by skill category"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_database)
):
    """
    Get skill search autocomplete suggestions.
    Public endpoint for search functionality.
    """
    try:
        suggestions = skill_service.get_skill_autocomplete_suggestions(
            db,
            query=q,
            limit=limit,
            category_id=category_id
        )
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating autocomplete suggestions: {str(e)}"
        )