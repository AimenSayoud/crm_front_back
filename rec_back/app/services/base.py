# app/services/base.py
from typing import TypeVar, Generic, Optional, Any, Dict, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
import logging
from uuid import UUID

from app.crud.base import CRUDBase
from app.models.base import BaseModel as DBBaseModel

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=DBBaseModel)
CRUDType = TypeVar("CRUDType", bound=CRUDBase)


class BaseService(Generic[ModelType, CRUDType]):
    """Base service class with common functionality"""
    
    def __init__(self, crud: CRUDType):
        self.crud = crud
        self.logger = logger
    
    def get(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """Get a single record by ID"""
        return self.crud.get(db, id=id)
    
    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ModelType]:
        """Get multiple records"""
        return self.crud.get_multi(db, skip=skip, limit=limit)
    
    def create(
        self, 
        db: Session, 
        *, 
        obj_in: BaseModel,
        **kwargs
    ) -> ModelType:
        """Create a new record with additional processing"""
        return self.crud.create(db, obj_in=obj_in)
    
    def update(
        self,
        db: Session,
        *,
        id: UUID,
        obj_in: BaseModel,
        **kwargs
    ) -> Optional[ModelType]:
        """Update a record with additional processing"""
        db_obj = self.get(db, id=id)
        if not db_obj:
            return None
        return self.crud.update(db, db_obj=db_obj, obj_in=obj_in)
    
    def remove(self, db: Session, *, id: UUID) -> Optional[ModelType]:
        """Delete a record"""
        return self.crud.remove(db, id=id)
    
    def log_action(
        self, 
        action: str, 
        user_id: Optional[UUID] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log service actions"""
        self.logger.info(
            f"Action: {action}, User: {user_id}, Details: {details}"
        )