from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

# --- CV Analysis Models ---
class CVAnalysisRequest(BaseModel):
    cv_text: str
    candidate_id: Optional[str] = None

class CandidateFeedbackRequest(BaseModel):
    candidate: Dict[str, Any]

class CandidateFeedbackResponse(BaseModel):
    feedback: str

class EducationEntry(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None

class ExperienceEntry(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    current: Optional[bool] = None
    responsibilities: Optional[List[str]] = None

class CVAnalysisResponse(BaseModel):
    skills: Optional[List[str]] = Field(default_factory=list)
    education: Optional[List[EducationEntry]] = Field(default_factory=list)
    experience: Optional[List[ExperienceEntry]] = Field(default_factory=list)
    total_experience_years: Optional[int] = 0
    summary: Optional[str] = ""
    skill_ids: Optional[List[str]] = Field(default_factory=list)
    analysis_method: Optional[str] = None # To indicate if it was OpenAI or fallback

# --- Job Matching Models ---
class JobMatchRequest(BaseModel):
    cv_analysis: CVAnalysisResponse # Can use the CVAnalysisResponse directly
    job_id: Optional[str] = None
    max_jobs_to_match: Optional[int] = 5

class JobMatchResponseItem(BaseModel):
    job_id: str
    job_title: str
    company_name: str
    match_score: float
    matching_skills: List[str]
    non_matching_skills: List[str]
    match_explanation: str
    improvement_suggestion: str
    match_method: Optional[str] = None # To indicate if it was OpenAI or fallback

# --- Email Generation Models ---
class EmailGenerationRequest(BaseModel):
    template_id: str
    context: Dict[str, Any]

class EmailGenerationResponse(BaseModel):
    subject: str
    body: str # This will be the fully formatted email including greeting and signature

# --- Interview Questions Models ---
class JobDetailsForQuestions(BaseModel):
    title: str
    company_name: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = Field(default_factory=list)
    skills: Optional[List[str]] = Field(default_factory=list)

class CandidateInfoForQuestions(BaseModel):
    name: Optional[str] = None
    skills: Optional[List[str]] = Field(default_factory=list)
    experience_summary: Optional[str] = None
    experience_years: Optional[int] = None

class InterviewQuestionsRequest(BaseModel):
    job_description: JobDetailsForQuestions # Renamed from job_details for clarity with frontend
    candidate_info: Optional[CandidateInfoForQuestions] = None

class InterviewQuestionItem(BaseModel):
    question: str
    purpose: str
    evaluation_guidance: str

# --- Job Description Models ---
class JobDescriptionRequest(BaseModel):
    position: str
    company_name: str
    industry: Optional[str] = None
    required_skills: Optional[List[str]] = None

class JobDescriptionResponse(BaseModel):
    title: str
    company_overview: str
    role_summary: str
    key_responsibilities: List[str]
    required_qualifications: List[str]
    preferred_qualifications: Optional[List[str]] = Field(default_factory=list)
    required_skills: List[str]
    benefits: Optional[List[str]] = Field(default_factory=list)
    location_environment: Optional[str] = None
    application_process: Optional[str] = None
    full_text: str
    generation_method: Optional[str] = None

# --- Email Templates Info (for GET endpoint) ---
class PlaceholderInfo(BaseModel):
    name: str
    # Potentially add description or type if needed later

class EmailTemplateInfoResponseItem(BaseModel):
    id: str
    name: str
    subject: str
    description: str
    placeholders: List[str] # Kept as list of strings as in original backend

# --- Chat Completion Models (if you add a generic chat endpoint) ---
class OpenAIMessage(BaseModel):
    role: str # "system", "user", or "assistant"
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[OpenAIMessage]
    # Add other parameters like model, temperature if you want to control from frontend

class ChatCompletionResponse(BaseModel):
    content: str