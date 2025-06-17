from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.skill import Skill, SkillCategory
from app.schemas.skill import (
    SkillCreate, SkillUpdate,
    SkillCategoryCreate, SkillCategoryUpdate
)


class CRUDSkill(CRUDBase[Skill, SkillCreate, SkillUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Skill]:
        """Get skill by name"""
        return db.query(Skill).filter(Skill.name.ilike(name)).first()
    
    def get_by_category(self, db: Session, *, category_id: UUID, skip: int = 0, limit: int = 100) -> List[Skill]:
        """Get skills by category"""
        return db.query(Skill)\
            .filter(Skill.category_id == category_id)\
            .order_by(asc(Skill.name))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def search_skills(self, db: Session, *, query: str, limit: int = 20) -> List[Skill]:
        """Search skills by name"""
        search_term = f"%{query}%"
        return db.query(Skill)\
            .options(joinedload(Skill.category))\
            .filter(
                or_(
                    Skill.name.ilike(search_term),
                    Skill.description.ilike(search_term)
                )
            )\
            .order_by(asc(Skill.name))\
            .limit(limit)\
            .all()
    
    def get_popular_skills(self, db: Session, *, limit: int = 50) -> List[Skill]:
        """Get most popular skills based on usage count"""
        return db.query(Skill)\
            .filter(Skill.usage_count > 0)\
            .order_by(desc(Skill.usage_count))\
            .limit(limit)\
            .all()
    
    def increment_usage(self, db: Session, *, skill_id: UUID) -> Optional[Skill]:
        """Increment skill usage count"""
        skill = self.get(db, id=skill_id)
        if skill:
            skill.usage_count = (skill.usage_count or 0) + 1
            db.commit()
            db.refresh(skill)
        return skill
    
    def get_skills_with_categories(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Skill]:
        """Get skills with their categories"""
        return db.query(Skill)\
            .options(joinedload(Skill.category))\
            .order_by(asc(Skill.name))\
            .offset(skip)\
            .limit(limit)\
            .all()


class CRUDSkillCategory(CRUDBase[SkillCategory, SkillCategoryCreate, SkillCategoryUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[SkillCategory]:
        """Get category by name"""
        return db.query(SkillCategory).filter(SkillCategory.name.ilike(name)).first()
    
    def get_with_skills(self, db: Session, *, id: UUID) -> Optional[SkillCategory]:
        """Get category with its skills"""
        return db.query(SkillCategory)\
            .options(joinedload(SkillCategory.skills))\
            .filter(SkillCategory.id == id)\
            .first()
    
    def get_all_with_skills(self, db: Session) -> List[SkillCategory]:
        """Get all categories with their skills"""
        return db.query(SkillCategory)\
            .options(joinedload(SkillCategory.skills))\
            .order_by(asc(SkillCategory.name))\
            .all()
    
    def get_category_stats(self, db: Session, *, category_id: UUID) -> Dict[str, Any]:
        """Get statistics for a category"""
        category = self.get(db, id=category_id)
        if not category:
            return {}
        
        skill_count = db.query(func.count(Skill.id))\
            .filter(Skill.category_id == category_id)\
            .scalar()
        
        total_usage = db.query(func.sum(Skill.usage_count))\
            .filter(Skill.category_id == category_id)\
            .scalar()
        
        return {
            "category_id": category_id,
            "category_name": category.name,
            "skill_count": skill_count or 0,
            "total_usage": total_usage or 0
        }
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        query: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[SkillCategory], int]:
        """Get skill categories with search filters and pagination"""
        db_query = db.query(SkillCategory)
        
        # Apply filters
        if query:
            search_term = f"%{query}%"
            db_query = db_query.filter(
                or_(
                    SkillCategory.name.ilike(search_term),
                    SkillCategory.description.ilike(search_term)
                )
            )
        
        if is_active is not None:
            db_query = db_query.filter(SkillCategory.is_active == is_active)
        
        # Get total count
        total = db_query.count()
        
        # Apply pagination and ordering
        categories = db_query.order_by(asc(SkillCategory.name))\
                           .offset(skip)\
                           .limit(limit)\
                           .all()
        
        return categories, total


# Create CRUD instances
skill = CRUDSkill(Skill)
skill_category = CRUDSkillCategory(SkillCategory)