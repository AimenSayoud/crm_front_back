// src/types/index.ts

// --- Existing types ---
export interface TagWithColor {
  id: string;
  name: string;
  color?: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  status: 'new' | 'interview' | 'offer' | 'hired' | 'rejected' | 'waiting';
  cvUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: (string | TagWithColor)[];
  rating?: number;
  assignedTo?: string;
  officeId: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  openPositions: number;
  officeId: string;
}

export interface Job {
  candidates: number; // Assuming this is a count
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  description: string;
  requirements: string[];
  location: string;
  salaryRange?: string;
  status: 'open' | 'filled' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  officeId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'employee';
  officeId: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Office {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- AI Service Specific Types (New) ---

// CV Analysis
export interface CvAnalysisRequest {
  cv_text: string;
}

export interface EducationEntry {
  degree?: string;
  institution?: string;
  field?: string;
  start_year?: string;
  end_year?: string;
}

export interface ExperienceEntry {
  title?: string;
  company?: string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  responsibilities?: string[];
}

export interface CvAnalysisResponse {
  skills?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  total_experience_years?: number;
  summary?: string;
  skill_ids?: number[];
  analysis_method?: string;
}

// Job Matching
export interface JobMatchRequest {
  cv_analysis: CvAnalysisResponse;
  job_id?: number;
  max_jobs_to_match?: number;
}

export interface JobMatch { // Corresponds to JobMatchResponseItem in backend
  job_id: number;
  job_title: string;
  company_name: string;
  match_score: number;
  matching_skills: string[];
  non_matching_skills: string[];
  match_explanation: string;
  improvement_suggestion: string;
  match_method?: string;
}

// Email Generation
export interface EmailGenerationContext {
  // Define specific context properties your backend expects for emails
  // Example:
  candidate_name?: string;
  job_title?: string;
  company_name?: string;
  contact_person?: string;
  industry?: string;
  // ... any other placeholders used in your backend's AIService._prepare_email_context
  [key: string]: any; // Allow other dynamic properties
}
export interface EmailGenerationRequest {
  template_id: string;
  context: EmailGenerationContext;
}

export interface EmailGenerationResponse {
  subject: string;
  body: string;
}

// Interview Questions
export interface JobDetailsForQuestions {
  title: string;
  company_name?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
}
export interface CandidateInfoForQuestions {
  name?: string;
  skills?: string[];
  experience_summary?: string;
  experience_years?: number;
}
export interface InterviewQuestionsRequest {
  job_description: JobDetailsForQuestions;
  candidate_info?: CandidateInfoForQuestions;
}

export interface InterviewQuestionItem {
  question: string;
  purpose: string;
  evaluation_guidance: string;
}

// Job Description
export interface JobDescriptionRequest {
  position: string;
  company_name: string;
  industry?: string;
  required_skills?: string[];
}

export interface JobDescriptionResponse {
  title: string;
  company_overview: string;
  role_summary: string;
  key_responsibilities: string[];
  required_qualifications: string[];
  preferred_qualifications?: string[];
  required_skills: string[];
  benefits?: string[];
  location_environment?: string;
  application_process?: string;
  full_text: string;
  generation_method?: string;
}

// For generic Chat Completion via backend
export interface OpenAIMessage { // Re-using from original openai-service.ts
  role: 'system' | 'user' | 'assistant';
  content: string;
}
export interface ChatCompletionRequest {
  messages: OpenAIMessage[];
}
export interface ChatCompletionResponse {
  content: string;
}

// For fetching email templates list
export interface EmailTemplateInfo {
  id: string;
  name: string;
  subject: string;
  description: string;
  placeholders: string[];
}

// Re-export types from other modules
export * from './messaging';
export * from './job';
export * from './company';
export * from './application';