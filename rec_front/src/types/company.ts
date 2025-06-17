// src/types/company.ts

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type CompanyStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  company_size: CompanySize;
  
  // Contact Info
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  
  // Address
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  
  // Company Details
  founded_year?: number;
  registration_number?: string;
  tax_id?: string;
  
  // Media
  logo_url?: string;
  cover_image_url?: string;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
  
  // Status
  is_verified: boolean;
  is_premium: boolean;
  status: CompanyStatus;
  
  // Metrics
  total_employees: number;
  active_jobs: number;
  notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CompanyCreateDTO {
  name: string;
  industry: string;
  description?: string;
  company_size: CompanySize;
  website?: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  founded_year?: number;
  registration_number?: string;
  tax_id?: string;
  logo_url?: string;
  cover_image_url?: string;
  social_media?: Record<string, string>;
  is_premium?: boolean;
  status?: CompanyStatus;
  notes?: string;
}

export interface CompanyUpdateDTO extends Partial<CompanyCreateDTO> {
  // Any additional update-specific fields would go here
}

export interface CompanyContact {
  id: string;
  company_id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyContactCreateDTO {
  name: string;
  title: string;
  email: string;
  phone?: string;
  is_primary?: boolean;
}

export interface CompanyContactUpdateDTO extends Partial<CompanyContactCreateDTO> {
  // Any additional update-specific fields would go here
}

export interface CompanyEmployee {
  user_id: string;
  company_id: string;
  position: string;
  department?: string;
  is_primary_contact: boolean;
  can_post_jobs: boolean;
  jobs_posted: number;
  successful_hires: number;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface CompanyHiringPreferences {
  id: string;
  company_id: string;
  preferred_experience_years?: number;
  required_education?: string[];
  culture_values?: string[];
  interview_process?: string[];
  created_at: string;
  updated_at: string;
}

export interface CompanyHiringPreferencesUpdateDTO {
  preferred_experience_years?: number;
  required_education?: string[];
  culture_values?: string[];
  interview_process?: string[];
}

export interface CompanySearchParams {
  search?: string;
  industry?: string;
  company_size?: CompanySize;
  location?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  status?: CompanyStatus;
  sort_by?: 'name' | 'active_jobs' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface PaginatedCompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CompanyStats {
  total_jobs: number;
  active_jobs: number;
  filled_jobs: number;
  total_applications: number;
  applications_in_progress: number;
  average_time_to_fill: number; // in days
  average_applications_per_job: number;
  successful_hires: number;
  job_posting_trend: {
    [date: string]: number;
  };
  application_trend: {
    [date: string]: number;
  };
}

export interface CompanyDashboardStats {
  active_jobs: number;
  total_applications: number;
  candidates_in_pipeline: number;
  upcoming_interviews: number;
  recent_activities: Array<{
    type: string;
    date: string;
    details: string;
  }>;
  time_to_hire: number; // in days
  top_performing_jobs: Array<{
    job_id: string;
    title: string;
    applications: number;
  }>;
}

export interface CompanyTalentPipeline {
  job_id?: string;
  stages: {
    [stage: string]: {
      count: number;
      percentage: number;
    };
  };
  conversion_rates: {
    application_to_interview: number;
    interview_to_offer: number;
    offer_to_hire: number;
  };
  time_in_stage: {
    [stage: string]: number; // in days
  };
  total_pipeline: number;
}

export interface CompanyCompetitorAnalysis {
  competitors: Array<{
    name: string;
    job_count: number;
    hiring_trend: 'increasing' | 'decreasing' | 'stable';
    common_positions: string[];
    average_salary_range?: {
      min: number;
      max: number;
    };
  }>;
  industry_benchmarks: {
    average_time_to_hire: number; // in days
    average_job_duration: number; // in days
    common_benefits: string[];
    salary_trends: {
      [position: string]: {
        min: number;
        avg: number;
        max: number;
      };
    };
  };
}

export interface CompanyRecruitmentEfficiency {
  overall_efficiency_score: number; // 0-100
  metrics: {
    time_to_fill: {
      value: number; // in days
      trend: 'improving' | 'declining' | 'stable';
      benchmark: number;
    };
    cost_per_hire: {
      value: number;
      trend: 'improving' | 'declining' | 'stable';
      benchmark: number;
    };
    quality_of_hire: {
      value: number; // 0-100
      trend: 'improving' | 'declining' | 'stable';
      benchmark: number;
    };
    retention_rate: {
      value: number; // percentage
      trend: 'improving' | 'declining' | 'stable';
      benchmark: number;
    };
  };
  by_department?: {
    [department: string]: {
      efficiency_score: number;
      time_to_fill: number;
      cost_per_hire: number;
    };
  };
  recommendations: string[];
}