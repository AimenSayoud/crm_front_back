from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.base import BaseModel as DBBaseModel

ModelType = TypeVar("ModelType", bound=DBBaseModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).

        **Parameters**

        * `model`: A SQLAlchemy model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def get(self, db: Session, id: UUID) -> Optional[ModelType]:
        """Get a single record by ID"""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[ModelType]:
        """Get multiple records with pagination"""
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record"""
        obj_in_data = jsonable_encoder(obj_in)
        db_obj = self.model(**obj_in_data)  # type: ignore
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update an existing record"""
        obj_data = jsonable_encoder(db_obj)
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: UUID) -> ModelType:
        """Delete a record by ID"""
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def count(self, db: Session) -> int:
        """Count total records"""
        return db.query(self.model).count()

    def exists(self, db: Session, *, id: UUID) -> bool:
        """Check if a record exists by ID"""
        return db.query(self.model).filter(self.model.id == id).first() is not None

    def get_or_create(
        self, 
        db: Session, 
        *, 
        defaults: Optional[Dict[str, Any]] = None, 
        **kwargs
    ) -> tuple[ModelType, bool]:
        """Get a record or create it if it doesn't exist"""
        instance = db.query(self.model).filter_by(**kwargs).first()
        if instance:
            return instance, False
        else:
            params = {**kwargs, **(defaults or {})}
            instance = self.model(**params)
            db.add(instance)
            db.commit()
            db.refresh(instance)
            return instance, True

    def bulk_create(
        self, 
        db: Session, 
        *, 
        objs_in: List[CreateSchemaType]
    ) -> List[ModelType]:
        """Create multiple records in bulk"""
        db_objs = []
        for obj_in in objs_in:
            obj_in_data = jsonable_encoder(obj_in)
            db_obj = self.model(**obj_in_data)
            db_objs.append(db_obj)
        
        db.add_all(db_objs)
        db.commit()
        for db_obj in db_objs:
            db.refresh(db_obj)
        return db_objs

    def bulk_update(
        self, 
        db: Session, 
        *, 
        objs_in: List[Dict[str, Any]]
    ) -> List[ModelType]:
        """Update multiple records in bulk"""
        updated_objs = []
        for obj_data in objs_in:
            if 'id' not in obj_data:
                continue
            
            db_obj = self.get(db, id=obj_data['id'])
            if db_obj:
                for field, value in obj_data.items():
                    if field != 'id' and hasattr(db_obj, field):
                        setattr(db_obj, field, value)
                updated_objs.append(db_obj)
        
        db.commit()
        for db_obj in updated_objs:
            db.refresh(db_obj)
        return updated_objs

    def bulk_delete(self, db: Session, *, ids: List[UUID]) -> int:
        """Delete multiple records in bulk"""
        deleted_count = db.query(self.model).filter(self.model.id.in_(ids)).delete(synchronize_session=False)
        db.commit()
        return deleted_count