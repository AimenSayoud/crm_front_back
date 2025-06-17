# app/services/skill.py
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from uuid import UUID
from datetime import datetime, timedelta

from app.models.skill import Skill, SkillCategory
from app.models.candidate import CandidateSkill
from app.models.job import JobSkillRequirement
from app.schemas.skill import (
    SkillCreate, SkillUpdate, SkillCategoryCreate,
    SkillSearchFilters
)
from app.crud.skill import CRUDSkill, skill, skill_category
from app.services.base import BaseService


class SkillService(BaseService[Skill, CRUDSkill]):
    """Service for skill management and analytics"""
    
    def __init__(self):
        super().__init__(skill)
        self.category_crud = skill_category
    
    def get_skills_with_search(
        self, 
        db: Session, 
        *, 
        filters: "SkillSearchFilters",
        include_stats: bool = False
    ) -> Tuple[List[Skill], int]:
        """Get skills with search filters and pagination"""
        # Use the basic get_multi method with filters
        query = db.query(Skill)
        
        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.filter(Skill.name.ilike(search_term))
        
        if filters.category_id:
            query = query.filter(Skill.category_id == filters.category_id)
            
        if filters.is_active is not None:
            query = query.filter(Skill.is_active == filters.is_active)
        
        # Get total count
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "name":
            if filters.sort_order == "desc":
                query = query.order_by(Skill.name.desc())
            else:
                query = query.order_by(Skill.name.asc())
        else:
            query = query.order_by(Skill.created_at.desc())
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        skills = query.offset(offset).limit(filters.page_size).all()
        
        return skills, total
    
    def create_skill_with_category(
        self, 
        db: Session, 
        *, 
        skill_data: SkillCreate,
        category_name: Optional[str] = None
    ) -> Skill:
        """Create skill and optionally assign to category"""
        # Check if skill already exists
        existing = self.crud.get_by_name(db, name=skill_data.name)
        if existing:
            raise ValueError(f"Skill '{skill_data.name}' already exists")
        
        # Handle category
        if category_name:
            category = self.category_crud.get_by_name(db, name=category_name)
            if not category:
                # Create category if doesn't exist
                category = self.category_crud.create(
                    db,
                    obj_in=SkillCategoryCreate(name=category_name)
                )
            skill_data.category_id = category.id
        
        # Create skill
        skill = self.crud.create(db, obj_in=skill_data)
        
        # Log creation
        self.log_action(
            "skill_created",
            details={"skill_name": skill.name, "category": category_name}
        )
        
        return skill
    
    def create_skill_category(
        self, 
        db: Session, 
        *, 
        category_data: "SkillCategoryCreate",
        created_by: UUID
    ) -> "SkillCategory":
        """Create a new skill category"""
        # Check if category already exists
        existing = self.category_crud.get_by_name(db, name=category_data.name)
        if existing:
            raise ValueError(f"Skill category '{category_data.name}' already exists")
        
        # Create category
        category = self.category_crud.create(db, obj_in=category_data)
        
        # Log creation
        self.log_action(
            "skill_category_created",
            user_id=created_by,
            details={"category_name": category.name}
        )
        
        return category
    
    def merge_duplicate_skills(
        self, 
        db: Session, 
        *, 
        primary_skill_id: UUID,
        duplicate_skill_ids: List[UUID],
        merged_by: UUID
    ) -> Skill:
        """Merge duplicate skills into one"""
        primary_skill = self.get(db, id=primary_skill_id)
        if not primary_skill:
            raise ValueError("Primary skill not found")
        
        # Get all duplicate skills
        duplicate_skills = db.query(Skill).filter(
            Skill.id.in_(duplicate_skill_ids)
        ).all()
        
        if not duplicate_skills:
            raise ValueError("No duplicate skills found")
        
        # Update all references to point to primary skill
        for dup_skill in duplicate_skills:
            # Update candidate skills
            db.query(CandidateSkill).filter(
                CandidateSkill.skill_id == dup_skill.id
            ).update({"skill_id": primary_skill_id})
            
            # Update job skill requirements
            db.query(JobSkillRequirement).filter(
                JobSkillRequirement.skill_id == dup_skill.id
            ).update({"skill_id": primary_skill_id})
            
            # Add usage count to primary
            primary_skill.usage_count = (
                (primary_skill.usage_count or 0) + 
                (dup_skill.usage_count or 0)
            )
        
        # Delete duplicate skills
        for dup_skill in duplicate_skills:
            db.delete(dup_skill)
        
        # Log merge
        self.log_action(
            "skills_merged",
            user_id=merged_by,
            details={
                "primary_skill": primary_skill.name,
                "merged_skills": [s.name for s in duplicate_skills],
                "count": len(duplicate_skills)
            }
        )
        
        db.commit()
        return primary_skill
    
    def get_trending_skills(
        self, 
        db: Session, 
        *, 
        days: int = 30,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get trending skills based on recent job postings"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        # Get skills from recent job postings
        trending = db.query(
            Skill.id,
            Skill.name,
            Skill.category_id,
            func.count(JobSkillRequirement.job_id).label('job_count')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.skill_id == Skill.id
        ).join(
            Job,
            Job.id == JobSkillRequirement.job_id
        ).filter(
            Job.created_at >= since_date
        ).group_by(
            Skill.id,
            Skill.name,
            Skill.category_id
        ).order_by(
            desc('job_count')
        ).limit(limit).all()
        
        # Calculate trend score
        trending_skills = []
        for skill_id, skill_name, category_id, recent_count in trending:
            # Get previous period count
            prev_count = db.query(
                func.count(JobSkillRequirement.job_id)
            ).join(
                Job,
                Job.id == JobSkillRequirement.job_id
            ).filter(
                and_(
                    JobSkillRequirement.skill_id == skill_id,
                    Job.created_at >= since_date - timedelta(days=days),
                    Job.created_at < since_date
                )
            ).scalar() or 0
            
            # Calculate growth
            growth = ((recent_count - prev_count) / prev_count * 100) if prev_count > 0 else 100
            
            trending_skills.append({
                "skill_id": skill_id,
                "skill_name": skill_name,
                "category_id": category_id,
                "job_count": recent_count,
                "growth_percentage": growth,
                "trend": "rising" if growth > 0 else "falling"
            })
        
        return trending_skills
    
    def get_skill_market_demand(
        self, 
        db: Session, 
        *, 
        skill_id: UUID
    ) -> Dict[str, Any]:
        """Get comprehensive market demand analysis for a skill"""
        skill = self.get(db, id=skill_id)
        if not skill:
            return {}
        
        # Current demand
        current_job_count = db.query(func.count(JobSkillRequirement.job_id)).join(
            Job,
            Job.id == JobSkillRequirement.job_id
        ).filter(
            and_(
                JobSkillRequirement.skill_id == skill_id,
                Job.status == "open"
            )
        ).scalar() or 0
        
        # Supply (candidates with skill)
        candidate_count = db.query(func.count(CandidateSkill.candidate_id)).filter(
            CandidateSkill.skill_id == skill_id
        ).scalar() or 0
        
        # Average salary for jobs requiring this skill
        salary_data = db.query(
            func.avg(Job.salary_min),
            func.avg(Job.salary_max)
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.job_id == Job.id
        ).filter(
            and_(
                JobSkillRequirement.skill_id == skill_id,
                Job.salary_min.isnot(None)
            )
        ).first()
        
        avg_salary_min = salary_data[0] if salary_data[0] else 0
        avg_salary_max = salary_data[1] if salary_data[1] else 0
        
        # Proficiency level distribution
        proficiency_dist = db.query(
            CandidateSkill.proficiency_level,
            func.count(CandidateSkill.id)
        ).filter(
            CandidateSkill.skill_id == skill_id
        ).group_by(
            CandidateSkill.proficiency_level
        ).all()
        
        # Related skills
        related_skills = self._get_related_skills(db, skill_id)
        
        return {
            "skill": {
                "id": skill_id,
                "name": skill.name,
                "category": skill.category.name if skill.category else None
            },
            "demand": {
                "open_positions": current_job_count,
                "available_candidates": candidate_count,
                "supply_demand_ratio": (
                    candidate_count / current_job_count 
                    if current_job_count > 0 else float('inf')
                ),
                "market_status": self._determine_market_status(
                    current_job_count, 
                    candidate_count
                )
            },
            "salary": {
                "average_min": avg_salary_min,
                "average_max": avg_salary_max,
                "average_range": (avg_salary_min + avg_salary_max) / 2 if avg_salary_max else avg_salary_min
            },
            "proficiency_distribution": {
                level: count for level, count in proficiency_dist
            },
            "related_skills": related_skills,
            "growth_trend": self._calculate_growth_trend(db, skill_id)
        }
    
    def get_skill_gap_analysis(
        self, 
        db: Session, 
        *, 
        company_id: Optional[UUID] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze skill gaps in the market or for specific company"""
        # Get demanded skills from job postings
        job_query = db.query(
            Skill.id,
            Skill.name,
            func.count(JobSkillRequirement.job_id).label('demand_count')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.skill_id == Skill.id
        ).join(
            Job,
            Job.id == JobSkillRequirement.job_id
        ).filter(
            Job.status == "open"
        )
        
        if company_id:
            job_query = job_query.filter(Job.company_id == company_id)
        
        if location:
            job_query = job_query.filter(Job.location.ilike(f"%{location}%"))
        
        demanded_skills = job_query.group_by(
            Skill.id,
            Skill.name
        ).all()
        
        skill_gaps = []
        
        for skill_id, skill_name, demand_count in demanded_skills:
            # Get available candidates with this skill
            candidate_query = db.query(
                func.count(CandidateSkill.candidate_id)
            ).filter(
                CandidateSkill.skill_id == skill_id
            )
            
            if location:
                # Filter by candidate location
                candidate_query = candidate_query.join(
                    CandidateProfile,
                    CandidateProfile.id == CandidateSkill.candidate_id
                ).filter(
                    CandidateProfile.city.ilike(f"%{location}%")
                )
            
            supply_count = candidate_query.scalar() or 0
            
            # Calculate gap
            gap = demand_count - supply_count
            
            if gap > 0:
                skill_gaps.append({
                    "skill_id": skill_id,
                    "skill_name": skill_name,
                    "demand": demand_count,
                    "supply": supply_count,
                    "gap": gap,
                    "gap_percentage": (gap / demand_count * 100) if demand_count > 0 else 0,
                    "severity": self._determine_gap_severity(gap, demand_count)
                })
        
        # Sort by gap severity
        skill_gaps.sort(key=lambda x: x["gap"], reverse=True)
        
        return {
            "total_skills_analyzed": len(demanded_skills),
            "skills_with_gaps": len(skill_gaps),
            "critical_gaps": [s for s in skill_gaps if s["severity"] == "critical"],
            "moderate_gaps": [s for s in skill_gaps if s["severity"] == "moderate"],
            "low_gaps": [s for s in skill_gaps if s["severity"] == "low"],
            "top_gaps": skill_gaps[:10]
        }
    
    def suggest_skills_for_candidate(
        self, 
        db: Session, 
        *, 
        candidate_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Suggest skills for candidate based on profile and market demand"""
        # Get candidate's current skills
        current_skills = db.query(CandidateSkill.skill_id).filter(
            CandidateSkill.candidate_id == candidate_id
        ).all()
        current_skill_ids = [s[0] for s in current_skills]
        
        if not current_skill_ids:
            # Return most in-demand skills
            return self._get_most_demanded_skills(db, limit=limit)
        
        # Find skills commonly paired with candidate's skills
        paired_skills = db.query(
            Skill.id,
            Skill.name,
            func.count(JobSkillRequirement.job_id).label('co_occurrence')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.skill_id == Skill.id
        ).filter(
            and_(
                JobSkillRequirement.job_id.in_(
                    db.query(JobSkillRequirement.job_id).filter(
                        JobSkillRequirement.skill_id.in_(current_skill_ids)
                    )
                ),
                ~Skill.id.in_(current_skill_ids)
            )
        ).group_by(
            Skill.id,
            Skill.name
        ).order_by(
            desc('co_occurrence')
        ).limit(limit * 2).all()  # Get extra to filter
        
        suggestions = []
        for skill_id, skill_name, co_occurrence in paired_skills:
            # Get market demand
            demand = db.query(func.count(JobSkillRequirement.job_id)).join(
                Job,
                Job.id == JobSkillRequirement.job_id
            ).filter(
                and_(
                    JobSkillRequirement.skill_id == skill_id,
                    Job.status == "open"
                )
            ).scalar() or 0
            
            # Calculate suggestion score
            score = (co_occurrence * 0.6 + demand * 0.4)
            
            suggestions.append({
                "skill_id": skill_id,
                "skill_name": skill_name,
                "reason": self._determine_suggestion_reason(
                    co_occurrence, 
                    demand,
                    len(current_skill_ids)
                ),
                "market_demand": demand,
                "relevance_score": score,
                "learning_path": self._suggest_learning_path(db, skill_id)
            })
        
        # Sort by score and return top suggestions
        suggestions.sort(key=lambda x: x["relevance_score"], reverse=True)
        return suggestions[:limit]
    
    def bulk_import_skills(
        self, 
        db: Session, 
        *, 
        skills_data: List[Dict[str, Any]],
        imported_by: UUID
    ) -> Dict[str, Any]:
        """Bulk import skills with validation"""
        results = {
            "imported": 0,
            "skipped": 0,
            "errors": [],
            "created_skills": []
        }
        
        for skill_data in skills_data:
            try:
                skill_name = skill_data.get("name", "").strip()
                if not skill_name:
                    results["errors"].append("Empty skill name")
                    results["skipped"] += 1
                    continue
                
                # Check if exists
                existing = self.crud.get_by_name(db, name=skill_name)
                if existing:
                    results["skipped"] += 1
                    continue
                
                # Create skill
                skill = SkillCreate(
                    name=skill_name,
                    description=skill_data.get("description"),
                    category_id=skill_data.get("category_id"),
                    skill_type=skill_data.get("skill_type", "technical")
                )
                
                created = self.crud.create(db, obj_in=skill)
                results["created_skills"].append(created.name)
                results["imported"] += 1
                
            except Exception as e:
                results["errors"].append(f"Error importing {skill_data}: {str(e)}")
                results["skipped"] += 1
        
        # Log import
        self.log_action(
            "skills_bulk_imported",
            user_id=imported_by,
            details={
                "imported": results["imported"],
                "skipped": results["skipped"],
                "total": len(skills_data)
            }
        )
        
        return results
    
    def _get_related_skills(
        self, 
        db: Session, 
        skill_id: UUID,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get skills related to given skill"""
        # Find skills that appear together in job requirements
        related = db.query(
            Skill.id,
            Skill.name,
            func.count(JobSkillRequirement.job_id).label('co_occurrence')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.skill_id == Skill.id
        ).filter(
            and_(
                JobSkillRequirement.job_id.in_(
                    db.query(JobSkillRequirement.job_id).filter(
                        JobSkillRequirement.skill_id == skill_id
                    )
                ),
                Skill.id != skill_id
            )
        ).group_by(
            Skill.id,
            Skill.name
        ).order_by(
            desc('co_occurrence')
        ).limit(limit).all()
        
        return [
            {
                "skill_id": r[0],
                "skill_name": r[1],
                "correlation_strength": r[2]
            }
            for r in related
        ]
    
    def _determine_market_status(
        self, 
        demand: int, 
        supply: int
    ) -> str:
        """Determine market status based on supply and demand"""
        if demand == 0:
            return "no_demand"
        
        ratio = supply / demand
        
        if ratio < 0.5:
            return "high_demand_low_supply"
        elif ratio < 1.0:
            return "moderate_demand"
        elif ratio < 2.0:
            return "balanced"
        else:
            return "oversupplied"
    
    def _calculate_growth_trend(
        self, 
        db: Session, 
        skill_id: UUID,
        periods: int = 6
    ) -> List[Dict[str, Any]]:
        """Calculate skill demand growth trend over periods"""
        trend = []
        current_date = datetime.utcnow()
        
        for i in range(periods):
            period_start = current_date - timedelta(days=30 * (i + 1))
            period_end = current_date - timedelta(days=30 * i)
            
            demand = db.query(func.count(JobSkillRequirement.job_id)).join(
                Job,
                Job.id == JobSkillRequirement.job_id
            ).filter(
                and_(
                    JobSkillRequirement.skill_id == skill_id,
                    Job.created_at >= period_start,
                    Job.created_at < period_end
                )
            ).scalar() or 0
            
            trend.append({
                "period": period_end.strftime("%Y-%m"),
                "demand": demand
            })
        
        trend.reverse()
        return trend
    
    def _determine_gap_severity(self, gap: int, demand: int) -> str:
        """Determine severity of skill gap"""
        if demand == 0:
            return "none"
        
        gap_ratio = gap / demand
        
        if gap_ratio > 0.7:
            return "critical"
        elif gap_ratio > 0.4:
            return "moderate"
        else:
            return "low"
    
    def _get_most_demanded_skills(
        self, 
        db: Session, 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get most demanded skills overall"""
        demanded = db.query(
            Skill.id,
            Skill.name,
            func.count(JobSkillRequirement.job_id).label('demand')
        ).join(
            JobSkillRequirement,
            JobSkillRequirement.skill_id == Skill.id
        ).join(
            Job,
            Job.id == JobSkillRequirement.job_id
        ).filter(
            Job.status == "open"
        ).group_by(
            Skill.id,
            Skill.name
        ).order_by(
            desc('demand')
        ).limit(limit).all()
        
        return [
            {
                "skill_id": s[0],
                "skill_name": s[1],
                "market_demand": s[2],
                "reason": "High market demand"
            }
            for s in demanded
        ]
    
    def _determine_suggestion_reason(
        self, 
        co_occurrence: int, 
        demand: int,
        current_skill_count: int
    ) -> str:
        """Determine reason for skill suggestion"""
        if demand > 50:
            return "High market demand"
        elif co_occurrence > 20:
            return "Complements your current skills"
        elif current_skill_count < 5:
            return "Builds foundational skillset"
        else:
            return "Career advancement opportunity"
    
    def _suggest_learning_path(
        self, 
        db: Session, 
        skill_id: UUID
    ) -> Dict[str, Any]:
        """Suggest learning path for skill"""
        # This would integrate with learning resources
        return {
            "estimated_time": "2-3 months",
            "difficulty": "intermediate",
            "resources": [
                "Online courses available",
                "Practice projects recommended",
                "Certification options"
            ]
        }
    
    def get_skill_categories_with_search(
        self, 
        db: Session, 
        *, 
        query: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[SkillCategory], int]:
        """Get skill categories with search filters and pagination"""
        return self.category_crud.get_multi_with_search(
            db, 
            query=query,
            is_active=is_active,
            skip=skip, 
            limit=limit
        )


# Create service instance
skill_service = SkillService()