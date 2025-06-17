// src/types/application.ts

export type ApplicationStatus = 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'INTERVIEW_SCHEDULED' 
  | 'INTERVIEWED' 
  | 'OFFERED' 
  | 'HIRED' 
  | 'REJECTED' 
  | 'WITHDRAWN';

export type InterviewType = 'phone' | 'video' | 'in_person';

export type OfferResponse = 'pending' | 'accepted' | 'rejected' | 'negotiating';

export interface Application {
  id: string;
  candidate_id: string;
  job_id: string;
  consultant_id?: string;
  status: ApplicationStatus;
  applied_at: string;
  last_updated: string;
  cover_letter?: string;
  source?: string;
  
  // Interview details
  interview_date?: string;
  interview_type?: InterviewType;
  interview_location?: string;
  interview_notes?: string;
  
  // Offer details
  offer_salary?: number;
  offer_currency?: string;
  offer_date?: string;
  offer_expiry_date?: string;
  offer_response?: OfferResponse;
  offer_benefits?: string;
  
  // Flags
  is_shortlisted?: boolean;
  is_favorite?: boolean;
  
  // Additional metadata
  rating?: number;
  feedback?: string;
  tags?: string[];
  
  // These fields might be populated in detailed responses
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  company_name?: string;
  company_id?: string;
}

export interface ApplicationWithDetails extends Application {
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  candidate_resume_url?: string;
  
  job_title: string;
  job_description?: string;
  
  company_name: string;
  company_id: string;
  
  consultant_name?: string;
  consultant_email?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  status: ApplicationStatus;
  comment?: string;
  changed_by: string;
  changed_by_name?: string;
  changed_at: string;
}

export interface ApplicationNote {
  id: string;
  application_id: string;
  consultant_id: string;
  consultant_name?: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreate {
  candidate_id: string;
  job_id: string;
  cover_letter?: string;
  source?: string;
  is_shortlisted?: boolean;
  is_favorite?: boolean;
}

export interface ApplicationUpdate {
  status?: ApplicationStatus;
  consultant_id?: string;
  cover_letter?: string;
  source?: string;
  interview_date?: string;
  interview_type?: InterviewType;
  interview_location?: string;
  interview_notes?: string;
  offer_salary?: number;
  offer_currency?: string;
  offer_date?: string;
  offer_expiry_date?: string;
  offer_response?: OfferResponse;
  offer_benefits?: string;
  is_shortlisted?: boolean;
  is_favorite?: boolean;
  rating?: number;
  feedback?: string;
  tags?: string[];
}

export interface ApplicationStatusChange {
  new_status: ApplicationStatus;
  comment?: string;
  notify_candidate?: boolean;
  notify_employer?: boolean;
  notify_consultant?: boolean;
}

export interface ScheduleInterview {
  interview_date: string;
  interview_type: InterviewType;
  interview_location?: string;
  interview_notes?: string;
  notify_candidate?: boolean;
  notify_employer?: boolean;
  notify_consultant?: boolean;
}

export interface MakeOffer {
  offer_salary: number;
  offer_currency: string;
  offer_date: string;
  offer_expiry_date: string;
  offer_benefits?: string;
  notify_candidate?: boolean;
  notify_employer?: boolean;
  notify_consultant?: boolean;
}

export interface ApplicationNoteCreate {
  note_text: string;
}

export interface ApplicationNoteUpdate {
  note_text: string;
}

export interface BulkApplicationUpdate {
  application_ids: string[];
  status?: ApplicationStatus;
  consultant_id?: string;
  add_note?: string;
  is_shortlisted?: boolean;
  is_favorite?: boolean;
}

export interface ApplicationSearchParams {
  q?: string;
  status?: ApplicationStatus | ApplicationStatus[];
  candidate_id?: string;
  job_id?: string;
  company_id?: string;
  consultant_id?: string;
  source?: string;
  is_shortlisted?: boolean;
  is_favorite?: boolean;
  interview_scheduled?: boolean;
  offer_pending?: boolean;
  applied_after?: string;
  applied_before?: string;
  sort_by?: 'applied_at' | 'last_updated' | 'status' | 'candidate_name' | 'job_title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface PaginatedApplicationsResponse {
  applications: ApplicationWithDetails[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApplicationPipelineView {
  statuses: {
    [key in ApplicationStatus]?: {
      count: number;
      applications: ApplicationWithDetails[];
    }
  };
  total: number;
  stats: {
    submitted_count: number;
    review_count: number;
    interview_count: number;
    offer_count: number;
    hired_count: number;
    rejected_count: number;
    withdrawn_count: number;
    conversion_rate_interview: number; // percentage
    conversion_rate_offer: number; // percentage
    conversion_rate_hire: number; // percentage
    avg_time_to_hire: number; // in days
  };
}