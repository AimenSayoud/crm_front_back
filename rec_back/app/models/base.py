from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declared_attr, declarative_base
import uuid

Base = declarative_base()

class TimestampMixin:
    """Mixin for adding timestamp fields to models."""
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime(timezone=True), 
            server_default=func.now(), 
            onupdate=func.now(), 
            nullable=False
        )


class UUIDMixin:
    """Mixin for adding UUID primary key to models."""
    
    @declared_attr
    def id(cls):
        return Column(
            UUID(as_uuid=True), 
            primary_key=True, 
            default=uuid.uuid4, 
            unique=True, 
            nullable=False
        )


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """Base model class that all models should inherit from."""
    __abstract__ = True
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"