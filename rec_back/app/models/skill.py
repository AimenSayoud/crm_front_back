from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class SkillCategory(BaseModel):
    __tablename__ = "skill_categories"

    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    display_order = Column(Integer, default=0)

    # Relationships
    skills = relationship("Skill", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SkillCategory(id={self.id}, name={self.name})>"


class Skill(BaseModel):
    __tablename__ = "skills"

    name = Column(String, nullable=False, unique=True, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("skill_categories.id"), nullable=True)
    description = Column(Text, nullable=True)

    # Relationships
    category = relationship("SkillCategory", back_populates="skills")
    candidate_skills = relationship("CandidateSkill", back_populates="skill", cascade="all, delete-orphan")
    job_skills = relationship("JobSkillRequirement", back_populates="skill", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Skill(id={self.id}, name={self.name}, category_id={self.category_id})>"