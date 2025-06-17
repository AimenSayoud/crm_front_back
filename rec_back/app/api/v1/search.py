# app/api/v1/search.py
from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID

from app.api.v1 import deps
from app.models.enums import UserRole
from app.services.candidate import candidate_service
from app.services.company import company_service
from app.services.job import job_service
from app.services.application import application_service

router = APIRouter()


class SearchResult(BaseModel):
    id: UUID
    type: str  # "candidate", "company", "job", "application"
    title: str
    description: Optional[str] = None
    score: float  # relevance score
    metadata: Dict[str, Any] = {}


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_count: int
    query: str
    took_ms: int


class GlobalSearchFilters(BaseModel):
    query: str  # Main search query
    entity_types: Optional[List[str]] = None  # ["candidates", "companies", "jobs", "applications"]
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    company_size: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


@router.post("/global", response_model=SearchResponse)
async def global_search(
    filters: GlobalSearchFilters,
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0)
) -> Any:
    """
    Perform global search across all entities (candidates, companies, jobs, applications)
    """
    import time
    start_time = time.time()
    
    results = []
    entity_types = filters.entity_types or ["candidates", "companies", "jobs", "applications"]
    
    # Search candidates
    if "candidates" in entity_types:
        candidate_results = await candidate_service.search_candidates(
            db=db,
            query=filters.query,
            location=filters.location,
            skills=filters.skills,
            experience_level=filters.experience_level,
            limit=limit // len(entity_types),
            offset=offset // len(entity_types)
        )
        
        for candidate in candidate_results.get("candidates", []):
            results.append(SearchResult(
                id=candidate["id"],
                type="candidate",
                title=f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}",
                description=candidate.get("professional_summary"),
                score=candidate.get("relevance_score", 0.5),
                metadata={
                    "location": candidate.get("location"),
                    "experience_years": candidate.get("experience_years"),
                    "skills": candidate.get("skills", [])[:5]  # Top 5 skills
                }
            ))
    
    # Search companies
    if "companies" in entity_types:
        company_results = await company_service.search_companies(
            db=db,
            query=filters.query,
            location=filters.location,
            company_size=filters.company_size,
            limit=limit // len(entity_types),
            offset=offset // len(entity_types)
        )
        
        for company in company_results.get("companies", []):
            results.append(SearchResult(
                id=company["id"],
                type="company",
                title=company.get("name", ""),
                description=company.get("description"),
                score=company.get("relevance_score", 0.5),
                metadata={
                    "industry": company.get("industry"),
                    "size": company.get("size"),
                    "location": company.get("location"),
                    "active_jobs": company.get("active_jobs_count", 0)
                }
            ))
    
    # Search jobs
    if "jobs" in entity_types:
        job_results = await job_service.search_jobs(
            db=db,
            query=filters.query,
            location=filters.location,
            skills=filters.skills,
            job_type=filters.job_type,
            salary_min=filters.salary_min,
            salary_max=filters.salary_max,
            limit=limit // len(entity_types),
            offset=offset // len(entity_types)
        )
        
        for job in job_results.get("jobs", []):
            results.append(SearchResult(
                id=job["id"],
                type="job",
                title=job.get("title", ""),
                description=job.get("description"),
                score=job.get("relevance_score", 0.5),
                metadata={
                    "company_name": job.get("company_name"),
                    "location": job.get("location"),
                    "job_type": job.get("job_type"),
                    "salary_range": f"{job.get('salary_min', 0)}-{job.get('salary_max', 0)}",
                    "required_skills": job.get("required_skills", [])[:5]
                }
            ))
    
    # Search applications (for recruiters/admins)
    if "applications" in entity_types and current_user.role in [UserRole.RECRUITER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        application_results = await application_service.search_applications(
            db=db,
            query=filters.query,
            date_from=filters.date_from,
            date_to=filters.date_to,
            limit=limit // len(entity_types),
            offset=offset // len(entity_types)
        )
        
        for application in application_results.get("applications", []):
            results.append(SearchResult(
                id=application["id"],
                type="application",
                title=f"Application: {application.get('candidate_name', '')} -> {application.get('job_title', '')}",
                description=f"Status: {application.get('status', '')}",
                score=application.get("relevance_score", 0.5),
                metadata={
                    "candidate_name": application.get("candidate_name"),
                    "job_title": application.get("job_title"),
                    "company_name": application.get("company_name"),
                    "status": application.get("status"),
                    "applied_date": application.get("applied_date")
                }
            ))
    
    # Sort by relevance score
    results.sort(key=lambda x: x.score, reverse=True)
    
    # Apply pagination
    paginated_results = results[offset:offset + limit]
    
    took_ms = int((time.time() - start_time) * 1000)
    
    return SearchResponse(
        results=paginated_results,
        total_count=len(results),
        query=filters.query,
        took_ms=took_ms
    )


@router.get("/suggestions", response_model=List[str])
async def get_search_suggestions(
    query: str,
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user),
    limit: int = Query(default=10, le=20)
) -> Any:
    """
    Get search suggestions based on partial query
    """
    suggestions = []
    
    # Get skill suggestions
    skill_suggestions = await candidate_service.get_skill_suggestions(
        db=db, query=query, limit=limit // 2
    )
    suggestions.extend(skill_suggestions)
    
    # Get company name suggestions
    company_suggestions = await company_service.get_company_name_suggestions(
        db=db, query=query, limit=limit // 2
    )
    suggestions.extend(company_suggestions)
    
    # Get job title suggestions
    job_suggestions = await job_service.get_job_title_suggestions(
        db=db, query=query, limit=limit // 2
    )
    suggestions.extend(job_suggestions)
    
    # Remove duplicates and limit
    unique_suggestions = list(set(suggestions))[:limit]
    
    return unique_suggestions


@router.get("/trending", response_model=Dict[str, List[str]])
async def get_trending_searches(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get trending search terms and popular filters
    """
    # This would typically come from search analytics
    # For now, returning mock trending data
    return {
        "trending_skills": [
            "Python", "React", "AWS", "Machine Learning", "DevOps",
            "TypeScript", "Kubernetes", "Data Science", "Node.js", "Java"
        ],
        "trending_locations": [
            "Remote", "San Francisco", "New York", "London", "Berlin",
            "Toronto", "Austin", "Seattle", "Boston", "Amsterdam"
        ],
        "trending_job_types": [
            "Full-time", "Remote", "Contract", "Part-time", "Freelance"
        ],
        "popular_searches": [
            "Senior Software Engineer", "Frontend Developer", "Data Scientist",
            "Product Manager", "DevOps Engineer", "UX Designer", "Full Stack Developer"
        ]
    }


@router.post("/advanced", response_model=SearchResponse)
async def advanced_search(
    filters: GlobalSearchFilters,
    query: Optional[str] = "",
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user),
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="relevance"),  # relevance, date, name, salary
    sort_order: str = Query(default="desc")  # desc, asc
) -> Any:
    """
    Advanced search with extensive filtering and sorting options
    """
    import time
    start_time = time.time()
    
    results = []
    entity_types = filters.entity_types or ["candidates", "companies", "jobs"]
    
    # Advanced candidate search
    if "candidates" in entity_types:
        # For now, return empty results as advanced search methods are not implemented
        candidate_results = {"candidates": []}
        
        for candidate in candidate_results.get("candidates", []):
            results.append(SearchResult(
                id=candidate["id"],
                type="candidate",
                title=f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}",
                description=candidate.get("professional_summary"),
                score=candidate.get("relevance_score", 0.5),
                metadata={
                    "location": candidate.get("location"),
                    "experience_years": candidate.get("experience_years"),
                    "skills": candidate.get("skills", []),
                    "availability": candidate.get("availability"),
                    "salary_expectation": candidate.get("salary_expectation")
                }
            ))
    
    # Advanced company search
    if "companies" in entity_types:
        company_results = await company_service.advanced_search_companies(
            db=db,
            query=query,
            filters=filters,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        for company in company_results.get("companies", []):
            results.append(SearchResult(
                id=company["id"],
                type="company",
                title=company.get("name", ""),
                description=company.get("description"),
                score=company.get("relevance_score", 0.5),
                metadata={
                    "industry": company.get("industry"),
                    "size": company.get("size"),
                    "location": company.get("location"),
                    "founded_year": company.get("founded_year"),
                    "active_jobs": company.get("active_jobs_count", 0)
                }
            ))
    
    # Advanced job search
    if "jobs" in entity_types:
        # For now, return empty results as advanced search methods are not implemented
        job_results = {"jobs": []}
        
        for job in job_results.get("jobs", []):
            results.append(SearchResult(
                id=job["id"],
                type="job",
                title=job.get("title", ""),
                description=job.get("description"),
                score=job.get("relevance_score", 0.5),
                metadata={
                    "company_name": job.get("company_name"),
                    "location": job.get("location"),
                    "job_type": job.get("job_type"),
                    "experience_level": job.get("experience_level"),
                    "salary_min": job.get("salary_min"),
                    "salary_max": job.get("salary_max"),
                    "required_skills": job.get("required_skills", []),
                    "posted_date": job.get("posted_date")
                }
            ))
    
    # Apply sorting
    if sort_by == "relevance":
        results.sort(key=lambda x: x.score, reverse=(sort_order == "desc"))
    elif sort_by == "name":
        results.sort(key=lambda x: x.title.lower(), reverse=(sort_order == "desc"))
    elif sort_by == "date":
        results.sort(key=lambda x: x.metadata.get("posted_date", ""), reverse=(sort_order == "desc"))
    
    took_ms = int((time.time() - start_time) * 1000)
    
    return SearchResponse(
        results=results,
        total_count=len(results),
        query=query or "",
        took_ms=took_ms
    )


@router.get("/filters", response_model=Dict[str, Any])
async def get_search_filters(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get available filter options for search
    """
    return {
        "skills": await candidate_service.get_all_skills(db=db),
        "locations": await company_service.get_all_locations(db=db),
        "industries": await company_service.get_all_industries(db=db),
        "job_types": ["Full-time", "Part-time", "Contract", "Freelance", "Internship"],
        "experience_levels": ["Entry", "Junior", "Mid", "Senior", "Lead", "Principal", "Executive"],
        "company_sizes": ["Startup (1-10)", "Small (11-50)", "Medium (51-200)", "Large (201-1000)", "Enterprise (1000+)"],
        "salary_ranges": [
            {"min": 0, "max": 50000, "label": "Under $50K"},
            {"min": 50000, "max": 75000, "label": "$50K - $75K"},
            {"min": 75000, "max": 100000, "label": "$75K - $100K"},
            {"min": 100000, "max": 150000, "label": "$100K - $150K"},
            {"min": 150000, "max": 200000, "label": "$150K - $200K"},
            {"min": 200000, "max": None, "label": "$200K+"}
        ]
    }