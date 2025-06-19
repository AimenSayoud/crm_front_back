// src/types/candidate.ts
import { Skill } from './skill';

// Basic candidate profile
export interface CandidateProfile {
  id: string;
  user_id: string;
  summary?: string;
  years_of_experience?: number;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  career_level?: string;
  profile_completion?: number;
  created_at: string;
  updated_at: string;
}

// Education entry
export interface Education {
  id: string;
  candidate_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  is_current?: boolean;
  created_at: string;
  updated_at: string;
}

// Work experience entry
export interface WorkExperience {
  id: string;
  candidate_id: string;
  company_name: string;
  position: string;
  start_date: string;
  end_date?: string;
  location?: string;
  description?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

// Candidate skill with proficiency
export interface CandidateSkill {
  candidate_id: string;
  skill_id: string;
  skill: Skill;
  proficiency_level: number;
  years_of_experience?: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Job preferences
export interface CandidateJobPreference {
  id: string;
  candidate_id: string;
  desired_job_types: string[];
  desired_locations: string[];
  remote_preference?: string;
  relocation_willingness: boolean;
  desired_salary_min?: number;
  desired_salary_max?: number;
  desired_benefits?: string[];
  availability_date?: string;
  created_at: string;
  updated_at: string;
}

// Notification settings
export interface CandidateNotificationSettings {
  id: string;
  candidate_id: string;
  email_job_matches: boolean;
  email_application_updates: boolean;
  email_messages: boolean;
  email_marketing: boolean;
  created_at: string;
  updated_at: string;
}

// Full candidate profile (combines all of the above)
export interface CandidateFullProfile extends CandidateProfile {
  education: Education[];
  work_experience: WorkExperience[];
  skills: CandidateSkill[];
  job_preferences?: CandidateJobPreference;
  notification_settings?: CandidateNotificationSettings;
}

// Request/Response types
export interface CreateProfileRequest {
  summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface UpdateProfileRequest {
  summary?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface CreateEducationRequest {
  institution: string;
  degree: string;
  field_of_study: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  is_current?: boolean;
}

export interface UpdateEducationRequest {
  institution?: string;
  degree?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  grade?: string;
  description?: string;
  is_current?: boolean;
}

export interface CreateExperienceRequest {
  company_name: string;
  position: string;
  start_date: string;
  end_date?: string;
  location?: string;
  description?: string;
  is_current: boolean;
}

export interface UpdateExperienceRequest {
  company_name?: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  description?: string;
  is_current?: boolean;
}

export interface UpdateSkillsRequest {
  skills: {
    skill_id: string;
    proficiency_level: number;
    years_of_experience?: number;
    is_primary?: boolean;
  }[];
}

export interface UpdatePreferencesRequest {
  desired_job_types?: string[];
  desired_locations?: string[];
  remote_preference?: string;
  relocation_willingness?: boolean;
  desired_salary_min?: number;
  desired_salary_max?: number;
  desired_benefits?: string[];
  availability_date?: string;
}

export interface UpdateNotificationSettingsRequest {
  email_job_matches?: boolean;
  email_application_updates?: boolean;
  email_messages?: boolean;
  email_marketing?: boolean;
}

export interface CandidateSearchFilters {
  search?: string;
  skills?: string[];
  experience_min?: number;
  experience_max?: number;
  education_level?: string[];
  locations?: string[];
  job_types?: string[];
  salary_min?: number;
  salary_max?: number;
  remote_only?: boolean;
  available_now?: boolean;
  page?: number;
  page_size?: number;
}

export interface CandidateListResponse {
  candidates: CandidateFullProfile[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Job matching
export interface MatchingJob {
  job: any; // This will be a Job type
  match_score: number;
}

export interface MatchingJobsResponse {
  jobs: MatchingJob[];
}

export interface SkillRecommendation {
  skill_id: string;
  skill_name: string;
  relevance_score: number;
  reason: string;
}

export interface SkillRecommendationsResponse {
  recommendations: SkillRecommendation[];
}

export interface CareerProgression {
  current_level: string;
  next_steps: {
    title: string;
    skills_needed: string[];
    experience_needed: string;
    description: string;
  }[];
  long_term_options: {
    title: string;
    skills_needed: string[];
    experience_needed: string;
    description: string;
  }[];
}

export interface ApplicationAnalytics {
  total_applications: number;
  application_status_counts: Record<string, number>;
  response_rate: number;
  average_response_time: number;
  applications_over_time: {
    date: string;
    count: number;
  }[];
  application_statuses: {
    job_id: string;
    job_title: string;
    company_name: string;
    status: string;
    applied_date: string;
    last_updated: string;
  }[];
}