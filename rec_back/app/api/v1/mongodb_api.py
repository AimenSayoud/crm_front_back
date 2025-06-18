from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
import logging
from beanie import PydanticObjectId

from app.models.mongodb_models import (
    UserDocument, 
    CandidateDocument, 
    JobDocument, 
    ApplicationDocument,
    CompanyDocument,
    SkillDocument,
    MessageDocument,
    ConversationDocument
)
from app.api.v1.deps import get_mongodb

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/info")
async def mongodb_info():
    """Get MongoDB connection info"""
    from app.db.mongodb import mongodb
    
    mongo_connected = await mongodb.check_connection()
    
    return {
        "connected": mongo_connected,
        "database": mongodb.db.name if mongodb.db else None,
    }

@router.get("/skills", response_model=List[Dict[str, Any]])
async def get_skills(
    limit: int = Query(10, ge=1, le=100),
    skip: int = Query(0, ge=0),
    sort_by: str = Query("name", pattern="^(name|category|created_at)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$")
):
    """Get skills from MongoDB"""
    try:
        sort_dir = 1 if sort_order == "asc" else -1
        
        query = SkillDocument.find(
            SkillDocument.is_active == True
        )
        
        # Apply sorting
        if sort_by == "name":
            query = query.sort((SkillDocument.name, sort_dir))
        elif sort_by == "category":
            query = query.sort((SkillDocument.category, sort_dir))
        elif sort_by == "created_at":
            query = query.sort((SkillDocument.created_at, sort_dir))
        
        # Apply pagination
        query = query.skip(skip).limit(limit)
        
        # Execute query
        skills = await query.to_list()
        
        # Convert to dicts with string IDs
        result = []
        for skill in skills:
            skill_dict = skill.dict()
            skill_dict["id"] = str(skill.id)
            result.append(skill_dict)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching skills from MongoDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.post("/skills", response_model=Dict[str, Any])
async def create_skill(skill: Dict[str, Any]):
    """Create a skill in MongoDB"""
    try:
        # Check if skill already exists
        existing = await SkillDocument.find_one(
            SkillDocument.name == skill["name"],
            SkillDocument.is_active == True
        )
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill with name '{skill['name']}' already exists"
            )
        
        # Create new skill
        skill_doc = SkillDocument(
            name=skill["name"],
            category=skill.get("category"),
            description=skill.get("description")
        )
        
        # Save to database
        await skill_doc.insert()
        
        # Return created skill
        result = skill_doc.dict()
        result["id"] = str(skill_doc.id)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating skill in MongoDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.get("/skills/{skill_id}", response_model=Dict[str, Any])
async def get_skill(skill_id: str):
    """Get a skill from MongoDB by ID"""
    try:
        # Try to parse as UUID first
        try:
            skill_uuid = UUID(skill_id)
            skill = await SkillDocument.find_one(
                SkillDocument.id == skill_uuid,
                SkillDocument.is_active == True
            )
        except ValueError:
            # Try as Beanie PydanticObjectId
            skill = await SkillDocument.get(PydanticObjectId(skill_id))
        
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill with ID {skill_id} not found"
            )
        
        # Return skill
        result = skill.dict()
        result["id"] = str(skill.id)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching skill from MongoDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.put("/skills/{skill_id}", response_model=Dict[str, Any])
async def update_skill(skill_id: str, skill_update: Dict[str, Any]):
    """Update a skill in MongoDB"""
    try:
        # Find skill
        try:
            skill_uuid = UUID(skill_id)
            skill = await SkillDocument.find_one(
                SkillDocument.id == skill_uuid,
                SkillDocument.is_active == True
            )
        except ValueError:
            skill = await SkillDocument.get(PydanticObjectId(skill_id))
            
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill with ID {skill_id} not found"
            )
        
        # Check if name is being updated and already exists
        if "name" in skill_update and skill_update["name"] != skill.name:
            existing = await SkillDocument.find_one(
                SkillDocument.name == skill_update["name"],
                SkillDocument.is_active == True,
                SkillDocument.id != skill.id
            )
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Skill with name '{skill_update['name']}' already exists"
                )
        
        # Update fields
        if "name" in skill_update:
            skill.name = skill_update["name"]
        if "category" in skill_update:
            skill.category = skill_update["category"]
        if "description" in skill_update:
            skill.description = skill_update["description"]
        
        # Save updates
        await skill.save()
        
        # Return updated skill
        result = skill.dict()
        result["id"] = str(skill.id)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating skill in MongoDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/skills/{skill_id}")
async def delete_skill(skill_id: str):
    """Delete a skill from MongoDB (soft delete)"""
    try:
        # Find skill
        try:
            skill_uuid = UUID(skill_id)
            skill = await SkillDocument.find_one(
                SkillDocument.id == skill_uuid,
                SkillDocument.is_active == True
            )
        except ValueError:
            skill = await SkillDocument.get(PydanticObjectId(skill_id))
            
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Skill with ID {skill_id} not found"
            )
        
        # Soft delete
        skill.is_active = False
        await skill.save()
        
        return {"message": f"Skill {skill_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting skill from MongoDB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )