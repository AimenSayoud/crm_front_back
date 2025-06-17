import axios from 'axios';

// Define base API configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api/v1';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for authentication if needed
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

// API functions
export const api = {
  // CV Analysis
  analyzeCv: async (cvText: string): Promise<CVAnalysisResponse> => {
    try {
      const response = await apiClient.post('/ai-tools/analyze-cv', { cv_text: cvText });
      return response.data;
    } catch (error) {
      console.error('Error analyzing CV:', error);
      throw error;
    }
  },
  
  // Combined CV Analysis and Job Matching
  analyzeCvWithJobMatch: async (cvText: string): Promise<{cv_analysis: CVAnalysisResponse, job_matches: JobMatchResponseItem[]}> => {
    try {
      const response = await apiClient.post('/ai-tools/analyze-cv-with-job-match', { cv_text: cvText });
      return response.data;
    } catch (error) {
      console.error('Error analyzing CV and matching jobs:', error);
      throw error;
    }
  },

  // Job Matching
  matchJobs: async (cvAnalysis: CVAnalysisResponse, jobId?: number, maxJobsToMatch?: number): Promise<JobMatchResponseItem[]> => {
    try {
      const response = await apiClient.post('/ai-tools/match-jobs', {
        cv_analysis: cvAnalysis,
        job_id: jobId,
        max_jobs_to_match: maxJobsToMatch || 5
      });
      return response.data;
    } catch (error) {
      console.error('Error matching jobs:', error);
      throw error;
    }
  },

  // Email Generation
  generateEmail: async (templateId: string, context: Record<string, any>): Promise<EmailGenerationResponse> => {
    try {
      const response = await apiClient.post('/ai-tools/generate-email', {
        template_id: templateId,
        context: context
      });
      return response.data;
    } catch (error) {
      console.error('Error generating email:', error);
      throw error;
    }
  },

  // Interview Questions Generation
  generateInterviewQuestions: async (
    jobDescription: { 
      title: string;
      company_name?: string;
      description?: string;
      requirements?: string[];
      skills?: string[];
    },
    candidateInfo?: {
      name?: string;
      skills?: string[];
      experience_summary?: string;
      experience_years?: number;
    }
  ): Promise<InterviewQuestionItem[]> => {
    try {
      const response = await apiClient.post('/ai-tools/generate-interview-questions', {
        job_description: jobDescription,
        candidate_info: candidateInfo
      });
      return response.data;
    } catch (error) {
      console.error('Error generating interview questions:', error);
      throw error;
    }
  },

  // Job Description Generation
  generateJobDescription: async (
    position: string,
    companyName: string,
    industry?: string,
    requiredSkills?: string[]
  ): Promise<JobDescriptionResponse> => {
    try {
      const response = await apiClient.post('/ai-tools/generate-job-description', {
        position,
        company_name: companyName,
        industry,
        required_skills: requiredSkills
      });
      return response.data;
    } catch (error) {
      console.error('Error generating job description:', error);
      throw error;
    }
  },

  // Chat Completion (General Queries)
  processGeneralQuery: async (query: string, context?: string): Promise<ChatCompletionResponse> => {
    try {
      const response = await apiClient.post('/ai-tools/chat-completion', {
        messages: [
          { role: "system", content: "You are a helpful AI assistant for recruitment." },
          ...(context ? [{ role: "user", content: `Context: ${context}` }] : []),
          { role: "user", content: query }
        ]
      });
      return response.data;
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  },

  // Get Email Templates
  getEmailTemplates: async (): Promise<EmailTemplateInfo[]> => {
    try {
      const response = await apiClient.get('/ai-tools/email-templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  },

  // Get Candidate Email Context
  getCandidateEmailContext: async (candidateId: string): Promise<Record<string, any>> => {
    try {
      const response = await apiClient.get(`/ai-tools/candidates/${candidateId}/email-context`);
      return response.data;
    } catch (error) {
      console.error('Error fetching candidate email context:', error);
      throw error;
    }
  },

  // Candidate Feedback (Special endpoint to add)
  generateCandidateFeedback: async (candidate: any): Promise<string> => {
    try {
      // This requires a new endpoint on the backend
      const response = await apiClient.post('/ai-tools/generate-candidate-feedback', { candidate });
      return response.data.feedback;
    } catch (error) {
      console.error('Error generating candidate feedback:', error);
      throw error;
    }
  }
};

export default api;