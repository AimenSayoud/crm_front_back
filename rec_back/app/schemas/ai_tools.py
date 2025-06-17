# app/schemas/ai_tools.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID


# CV Analysis Schemas
class CVAnalysisRequest(BaseModel):
    cv_text: str = Field(..., description="Raw CV text to analyze")
    candidate_id: Optional[UUID] = Field(None, description="Associate with existing candidate")

    class Config:
        from_attributes = True


class CVAnalysisResponse(BaseModel):
    skills: List[str] = Field(default_factory=list)
    skill_ids: List[UUID] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    total_experience_years: int = 0
    summary: str = ""
    analysis_method: str = Field("openai", description="Method used for analysis")
    
    # Additional metadata
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    processing_time: Optional[float] = None
    
    class Config:
        from_attributes = True


# Job Matching Schemas
class JobMatchRequest(BaseModel):
    candidate_id: Optional[UUID] = Field(None, description="Candidate to match")
    cv_analysis: Optional[CVAnalysisResponse] = Field(None, description="Pre-analyzed CV data")
    job_ids: Optional[List[UUID]] = Field(None, description="Specific jobs to match against")
    max_jobs_to_match: int = Field(5, ge=1, le=20)
    min_match_score: Optional[float] = Field(0.5, ge=0, le=1)

    class Config:
        from_attributes = True


class JobMatchResult(BaseModel):
    job_id: UUID
    job_title: str
    company_name: str
    match_score: float = Field(..., ge=0, le=1)
    matching_skills: List[str]
    non_matching_skills: List[str]
    match_explanation: str
    improvement_suggestion: str
    match_method: str = "openai"

    class Config:
        from_attributes = True


class JobMatchResponse(BaseModel):
    matches: List[JobMatchResult]
    total_jobs_analyzed: int
    processing_time: Optional[float] = None

    class Config:
        from_attributes = True


# Email Generation Schemas
class EmailGenerationRequest(BaseModel):
    template_id: Optional[UUID] = Field(None, description="Use existing template")
    template_type: Optional[str] = Field(None, description="Type of email to generate")
    context: Dict[str, Any] = Field(..., description="Variables for template")
    tone: Optional[str] = Field("professional", pattern="^(professional|casual|formal)$")
    language: Optional[str] = Field("en", max_length=5)

    class Config:
        from_attributes = True


class EmailGenerationResponse(BaseModel):
    subject: str
    body: str
    template_used: Optional[UUID] = None
    variables_used: List[str] = Field(default_factory=list)
    generation_method: str = "openai"

    class Config:
        from_attributes = True


# Interview Questions Schemas
class InterviewQuestionsRequest(BaseModel):
    job_id: Optional[UUID] = Field(None, description="Generate questions for specific job")
    candidate_id: Optional[UUID] = Field(None, description="Tailor questions to candidate")
    job_title: Optional[str] = None
    required_skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    question_count: int = Field(10, ge=1, le=50)
    include_technical: bool = True
    include_behavioral: bool = True

    class Config:
        from_attributes = True


class InterviewQuestion(BaseModel):
    question: str
    question_type: str = Field(..., pattern="^(technical|behavioral|situational|cultural)$")
    difficulty: str = Field(..., pattern="^(easy|medium|hard)$")
    purpose: str
    evaluation_guidance: str
    expected_time_minutes: Optional[int] = Field(None, ge=1, le=30)
    follow_up_questions: Optional[List[str]] = None

    class Config:
        from_attributes = True


class InterviewQuestionsResponse(BaseModel):
    questions: List[InterviewQuestion]
    total_estimated_time_minutes: int
    generation_method: str = "openai"

    class Config:
        from_attributes = True


# Job Description Generation Schemas
class JobDescriptionRequest(BaseModel):
    position: str = Field(..., min_length=1, max_length=200)
    company_id: Optional[UUID] = None
    company_name: Optional[str] = None
    industry: Optional[str] = None
    required_skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = False
    salary_range: Optional[Dict[str, float]] = None
    tone: Optional[str] = Field("professional", pattern="^(professional|casual|startup|corporate)$")

    class Config:
        from_attributes = True


class JobDescriptionResponse(BaseModel):
    title: str
    company_overview: str
    role_summary: str
    key_responsibilities: List[str]
    required_qualifications: List[str]
    preferred_qualifications: List[str]
    required_skills: List[str]
    benefits: List[str]
    location_environment: Optional[str] = None
    application_process: Optional[str] = None
    full_text: str
    generation_method: str = "openai"
    seo_keywords: Optional[List[str]] = None

    class Config:
        from_attributes = True


# Candidate Feedback Schemas
class CandidateFeedbackRequest(BaseModel):
    candidate_id: UUID
    application_id: Optional[UUID] = None
    feedback_type: str = Field(..., pattern="^(interview|rejection|general|improvement)$")
    specific_areas: Optional[List[str]] = None
    include_recommendations: bool = True

    class Config:
        from_attributes = True


class CandidateFeedbackResponse(BaseModel):
    feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendations: Optional[List[str]] = None
    resources: Optional[List[Dict[str, str]]] = None
    generation_method: str = "openai"

    class Config:
        from_attributes = True


# Skills Extraction Schemas  
class SkillsExtractionRequest(BaseModel):
    text: str = Field(..., description="Text to extract skills from")
    context_type: str = Field("cv", pattern="^(cv|job_description|profile)$")
    include_soft_skills: bool = True
    include_technical_skills: bool = True
    match_to_database: bool = True

    class Config:
        from_attributes = True


class ExtractedSkill(BaseModel):
    skill_name: str
    skill_id: Optional[UUID] = None
    category: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)
    context: Optional[str] = None

    class Config:
        from_attributes = True


class SkillsExtractionResponse(BaseModel):
    technical_skills: List[ExtractedSkill]
    soft_skills: List[ExtractedSkill]
    unmatched_skills: List[str]
    extraction_method: str = "openai"

    class Config:
        from_attributes = True