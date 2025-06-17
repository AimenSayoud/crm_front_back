# app/api/v1/endpoints/candidates.py
from typing import Any, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.v1 import deps
from app.models.enums import UserRole
from app.schemas.candidate import (
    CandidateProfile, CandidateProfileCreate, CandidateProfileUpdate,
    CandidateFullProfile, Education, EducationCreate, EducationUpdate,
    WorkExperience, WorkExperienceCreate, WorkExperienceUpdate,
    CandidateJobPreference, CandidateJobPreferenceCreate, CandidateJobPreferenceUpdate,
    CandidateSearchFilters, CandidateListResponse,
    CandidateNotificationSettings, CandidateNotificationSettingsUpdate,
    CandidateSkill, CandidateSkillCreate
)
from app.services.candidate import candidate_service

router = APIRouter()


@router.get("/me", response_model=CandidateProfile)
def get_my_candidate_profile(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user's candidate profile
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    return profile


@router.post("/me", response_model=CandidateProfile)
def create_my_candidate_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: CandidateProfileCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Create candidate profile for current user
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    # Check if profile already exists
    existing = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists"
        )
    
    profile_in.user_id = current_user.id
    profile = candidate_service.crud.create(db, obj_in=profile_in)
    return profile


@router.put("/me", response_model=CandidateProfile)
def update_my_candidate_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: CandidateProfileUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update current user's candidate profile
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    profile = candidate_service.crud.update(db, db_obj=profile, obj_in=profile_in)
    return profile


@router.post("/me/complete-profile", response_model=CandidateProfile)
def complete_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_data: dict,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Complete candidate profile with all components (education, experience, skills, preferences)
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    try:
        profile = candidate_service.create_complete_profile(
            db,
            user_id=current_user.id,
            profile_data=profile_data
        )
        return profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me/completion-percentage")
def get_profile_completion(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get profile completion percentage
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        return {"completion_percentage": 0}
    
    percentage = candidate_service.get_profile_completion_percentage(
        db,
        candidate_id=profile.id
    )
    return {"completion_percentage": percentage}


# Education endpoints
@router.get("/me/education", response_model=List[Education])
def get_my_education(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user's education records
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    education = candidate_service.education_crud.get_by_candidate(
        db,
        candidate_id=profile.id
    )
    return education


@router.post("/me/education", response_model=Education)
def add_education(
    *,
    db: Session = Depends(deps.get_db),
    education_in: EducationCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Add education record
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    education_in.candidate_id = profile.id
    education = candidate_service.education_crud.create_for_candidate(
        db,
        obj_in=education_in
    )
    
    # Update profile completion
    candidate_service.crud.update_profile_completion(db, candidate_id=profile.id)
    
    return education


@router.put("/me/education/{education_id}", response_model=Education)
def update_education(
    *,
    db: Session = Depends(deps.get_db),
    education_id: UUID,
    education_in: EducationUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update education record
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    education = candidate_service.education_crud.get(db, id=education_id)
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education record not found"
        )
    
    # Verify ownership
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile or education.candidate_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this education record"
        )
    
    education = candidate_service.education_crud.update(
        db,
        db_obj=education,
        obj_in=education_in
    )
    return education


@router.delete("/me/education/{education_id}")
def delete_education(
    *,
    db: Session = Depends(deps.get_db),
    education_id: UUID,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete education record
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    education = candidate_service.education_crud.get(db, id=education_id)
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education record not found"
        )
    
    # Verify ownership
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile or education.candidate_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this education record"
        )
    
    candidate_service.education_crud.remove(db, id=education_id)
    
    # Update profile completion
    candidate_service.crud.update_profile_completion(db, candidate_id=profile.id)
    
    return {"message": "Education record deleted successfully"}


# Work Experience endpoints
@router.get("/me/experience", response_model=List[WorkExperience])
def get_my_experience(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user's work experience records
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    experience = candidate_service.experience_crud.get_by_candidate(
        db,
        candidate_id=profile.id
    )
    return experience


@router.post("/me/experience", response_model=WorkExperience)
def add_experience(
    *,
    db: Session = Depends(deps.get_db),
    experience_in: WorkExperienceCreate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Add work experience record
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    experience_in.candidate_id = profile.id
    experience = candidate_service.experience_crud.create_for_candidate(
        db,
        obj_in=experience_in
    )
    
    # Update years of experience
    total_years = candidate_service.experience_crud.calculate_total_experience(
        db,
        candidate_id=profile.id
    )
    profile.years_of_experience = total_years
    
    # Update profile completion
    candidate_service.crud.update_profile_completion(db, candidate_id=profile.id)
    
    return experience


@router.put("/me/experience/{experience_id}", response_model=WorkExperience)
def update_experience(
    *,
    db: Session = Depends(deps.get_db),
    experience_id: UUID,
    experience_in: WorkExperienceUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update work experience record
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    experience = candidate_service.experience_crud.get(db, id=experience_id)
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience record not found"
        )
    
    # Verify ownership
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile or experience.candidate_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this experience record"
        )
    
    experience = candidate_service.experience_crud.update(
        db,
        db_obj=experience,
        obj_in=experience_in
    )
    
    # Update years of experience
    total_years = candidate_service.experience_crud.calculate_total_experience(
        db,
        candidate_id=profile.id
    )
    profile.years_of_experience = total_years
    db.commit()
    
    return experience


@router.delete("/me/experience/{experience_id}")
def delete_experience(
    *,
    db: Session = Depends(deps.get_db),
    experience_id: UUID,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Delete work experience record
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    experience = candidate_service.experience_crud.get(db, id=experience_id)
    if not experience:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Experience record not found"
        )
    
    # Verify ownership
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile or experience.candidate_id != profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this experience record"
        )
    
    candidate_service.experience_crud.remove(db, id=experience_id)
    
    # Update years of experience
    total_years = candidate_service.experience_crud.calculate_total_experience(
        db,
        candidate_id=profile.id
    )
    profile.years_of_experience = total_years
    
    # Update profile completion
    candidate_service.crud.update_profile_completion(db, candidate_id=profile.id)
    db.commit()
    
    return {"message": "Experience record deleted successfully"}


# Skills endpoints
@router.get("/me/skills", response_model=List[CandidateSkill])
def get_my_skills(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user's skills
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    skills = candidate_service.skill_crud.get_by_candidate(db, candidate_id=profile.id)
    return skills


@router.put("/me/skills", response_model=List[CandidateSkill])
def update_my_skills(
    *,
    db: Session = Depends(deps.get_db),
    skills: List[Dict[str, Any]],
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update all skills (replaces existing)
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    updated_skills = candidate_service.update_candidate_skills(
        db,
        candidate_id=profile.id,
        skills=skills
    )
    
    # Update profile completion
    candidate_service.crud.update_profile_completion(db, candidate_id=profile.id)
    
    return updated_skills


# Job Preferences endpoints
@router.get("/me/preferences", response_model=CandidateJobPreference)
def get_my_preferences(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get current user's job preferences
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    preferences = candidate_service.preference_crud.get_by_candidate(
        db,
        candidate_id=profile.id
    )
    if not preferences:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )
    
    return preferences


@router.put("/me/preferences", response_model=CandidateJobPreference)
def update_my_preferences(
    *,
    db: Session = Depends(deps.get_db),
    preferences_in: CandidateJobPreferenceUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update job preferences
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    preferences = candidate_service.preference_crud.create_or_update(
        db,
        candidate_id=profile.id,
        obj_in=preferences_in
    )
    
    # Update profile completion
    candidate_service.crud.update_profile_completion(db, candidate_id=profile.id)
    
    return preferences


# Notification Settings endpoints
@router.get("/me/notification-settings", response_model=CandidateNotificationSettings)
def get_my_notification_settings(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get notification settings
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    settings = candidate_service.notification_crud.get_by_candidate(
        db,
        candidate_id=profile.id
    )
    if not settings:
        # Create default settings
        settings = candidate_service.notification_crud.create_or_update(
            db,
            candidate_id=profile.id,
            obj_in=CandidateNotificationSettingsUpdate()
        )
    
    return settings


@router.put("/me/notification-settings", response_model=CandidateNotificationSettings)
def update_my_notification_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: CandidateNotificationSettingsUpdate,
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Update notification settings
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    settings = candidate_service.notification_crud.create_or_update(
        db,
        candidate_id=profile.id,
        obj_in=settings_in
    )
    
    return settings


# Job Matching endpoints
@router.get("/me/matching-jobs")
def get_matching_jobs(
    *,
    db: Session = Depends(deps.get_db),
    limit: int = Query(10, ge=1, le=50),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get jobs matching candidate profile
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    matching_jobs = candidate_service.find_matching_jobs(
        db,
        candidate_id=profile.id,
        limit=limit
    )
    
    return {
        "jobs": [
            {
                "job": job,
                "match_score": score
            }
            for job, score in matching_jobs
        ]
    }


@router.get("/me/skill-recommendations")
def get_skill_recommendations(
    *,
    db: Session = Depends(deps.get_db),
    limit: int = Query(10, ge=1, le=20),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get skill recommendations based on profile
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    recommendations = candidate_service.suggest_skills_for_candidate(
        db,
        candidate_id=profile.id,
        limit=limit
    )
    
    return {"recommendations": recommendations}


@router.get("/me/career-progression")
def get_career_progression(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get career progression suggestions
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    progression = candidate_service.get_career_progression_suggestions(
        db,
        candidate_id=profile.id
    )
    
    return progression


@router.get("/me/application-analytics")
def get_application_analytics(
    *,
    db: Session = Depends(deps.get_db),
    current_user: deps.CurrentUser = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get application analytics
    """
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a candidate user"
        )
    
    profile = candidate_service.crud.get_by_user_id(db, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    analytics = candidate_service.get_application_analytics(
        db,
        candidate_id=profile.id
    )
    
    return analytics


# Search candidates (for consultants/admins)
@router.post("/search", response_model=CandidateListResponse)
def search_candidates(
    *,
    db: Session = Depends(deps.get_db),
    filters: CandidateSearchFilters,
    current_user: deps.CurrentUser = Depends(deps.get_current_consultant_or_admin)
) -> Any:
    """
    Search candidates with filters (Consultant/Admin only)
    """
    candidates, total = candidate_service.crud.get_multi_with_search(
        db,
        filters=filters
    )
    
    return CandidateListResponse(
        candidates=[CandidateFullProfile.from_orm(c) for c in candidates],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        total_pages=(total + filters.page_size - 1) // filters.page_size
    )


@router.get("/{candidate_id}", response_model=CandidateFullProfile)
def get_candidate(
    *,
    db: Session = Depends(deps.get_db),
    candidate_id: UUID,
    current_user: deps.CurrentUser = Depends(deps.get_current_consultant_or_admin)
) -> Any:
    """
    Get candidate by ID (Consultant/Admin only)
    """
    candidate = candidate_service.crud.get_with_details(db, id=candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return CandidateFullProfile.from_orm(candidate)