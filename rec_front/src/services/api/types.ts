// src/services/api/types.ts
// Type definitions for API responses

export interface CVAnalysisResponse {
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    field?: string;
    start_year?: string;
    end_year?: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    start_date?: string;
    end_date?: string;
    current?: boolean;
    responsibilities?: string[];
  }>;
  total_experience_years: number;
  summary: string;
  skill_ids?: number[];
  analysis_method?: string;
}

export interface JobMatchResponseItem {
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

export interface EmailGenerationResponse {
  subject: string;
  body: string;
}

export interface InterviewQuestionItem {
  question: string;
  purpose: string;
  evaluation_guidance: string;
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

export interface ChatCompletionResponse {
  content: string;
}

export interface EmailTemplateInfo {
  id: string;
  name: string;
  subject: string;
  description: string;
  placeholders: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}