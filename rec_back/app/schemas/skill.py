from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID


# Base schemas for Skill Category
class SkillCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    display_order: Optional[int] = Field(0, ge=0)


class SkillCategoryCreate(SkillCategoryBase):
    pass


class SkillCategoryUpdate(SkillCategoryBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class SkillCategory(SkillCategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Base schemas for Skill
class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    skill_type: Optional[str] = Field("technical", pattern="^(technical|soft|language|certification)$")
    is_verified: Optional[bool] = False
    is_trending: Optional[bool] = False


class SkillCreate(SkillBase):
    pass


class SkillUpdate(SkillBase):
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class Skill(SkillBase):
    id: UUID
    usage_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    
    # Relationships
    category: Optional[SkillCategory] = None

    class Config:
        from_attributes = True


# Skill with category information
class SkillWithCategory(Skill):
    category_name: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True


# Search and filter schemas
class SkillSearchFilters(BaseModel):
    query: Optional[str] = Field(None, description="Search query")
    category_id: Optional[UUID] = Field(None, description="Filter by category")
    skill_type: Optional[str] = Field(None, description="Filter by skill type")
    proficiency_level: Optional[str] = Field(None, description="Filter by proficiency level")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    industry: Optional[str] = Field(None, description="Filter by industry relevance")
    is_verified: Optional[bool] = Field(None, description="Filter verified skills")
    is_trending: Optional[bool] = Field(None, description="Filter trending skills")
    min_usage: Optional[int] = Field(None, ge=0, description="Minimum usage count")
    
    # Pagination
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    # Sorting
    sort_by: Optional[str] = Field("name", pattern="^(name|usage_count|created_at|updated_at)$")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$")


class SkillListResponse(BaseModel):
    skills: List[SkillWithCategory]
    total: int
    page: int
    page_size: int
    total_pages: int

    class Config:
        from_attributes = True


class SkillCategoryListResponse(BaseModel):
    categories: List[SkillCategory]
    total: int

    class Config:
        from_attributes = True


# Skill statistics
class SkillStats(BaseModel):
    skill_id: UUID
    skill_name: str
    usage_count: int
    candidate_count: int
    job_requirement_count: int
    trending_score: Optional[float] = None

    class Config:
        from_attributes = True


class CategoryStats(BaseModel):
    category_id: UUID
    category_name: str
    skill_count: int
    total_usage: int
    top_skills: List[SkillStats]

    class Config:
        from_attributes = True