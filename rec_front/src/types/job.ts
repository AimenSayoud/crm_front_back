// src/types/job.ts

export type JobContractType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type JobType = 'onsite' | 'remote' | 'hybrid';
export type JobExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive';
export type JobStatus = 'draft' | 'open' | 'closed' | 'filled' | 'cancelled';

export interface JobSkillRequirement {
  id: string;
  job_id: string;
  skill_id: string;
  skill_name?: string; // For UI display
  is_required: boolean;
  proficiency_level: number; // 1-5
  years_experience: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  
  // Location details
  location: string;
  is_remote: boolean;
  is_hybrid: boolean;
  
  // Employment details
  contract_type: JobContractType;
  job_type: JobType;
  experience_level: JobExperienceLevel;
  
  // Compensation
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  
  // Dates & Status
  status: JobStatus;
  posting_date: string | null;
  deadline_date: string | null;
  created_at: string;
  updated_at: string;
  
  // Additional details
  benefits: string | null;
  company_culture: string | null;
  requires_cover_letter: boolean;
  internal_notes: string | null;
  
  // Metrics
  is_featured: boolean;
  view_count: number;
  application_count: number;
  
  // Relations
  company_id: string;
  posted_by: string;
  assigned_consultant_id: string | null;
  
  // UI helper fields (may not be present in all responses)
  company_name?: string;
  skills?: JobSkillRequirement[];
}

export interface JobCreateDTO {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  location: string;
  is_remote: boolean;
  is_hybrid: boolean;
  contract_type: JobContractType;
  job_type: JobType;
  experience_level: JobExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  benefits?: string;
  company_culture?: string;
  requires_cover_letter?: boolean;
  internal_notes?: string;
  is_featured?: boolean;
  deadline_date?: string;
  company_id: string;
}

export interface JobUpdateDTO extends Partial<JobCreateDTO> {
  status?: JobStatus;
}

export interface JobSearchParams {
  q?: string;
  skills?: string[];
  location?: string;
  is_remote?: boolean;
  is_hybrid?: boolean;
  contract_type?: JobContractType;
  job_type?: JobType;
  experience_level?: JobExperienceLevel;
  salary_min?: number;
  salary_max?: number;
  status?: JobStatus;
  company_id?: string;
  posted_by?: string;
  assigned_consultant_id?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'salary_min' | 'application_count' | 'relevance';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface PaginatedJobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface JobSkillRequirementCreateDTO {
  skill_id: string;
  is_required: boolean;
  proficiency_level: number;
  years_experience: number;
}

export interface JobSkillRequirementUpdateDTO extends Partial<JobSkillRequirementCreateDTO> {}

export interface JobApplicationStats {
  total: number;
  new: number;
  under_review: number;
  interview: number;
  offer: number;
  hired: number;
  rejected: number;
}