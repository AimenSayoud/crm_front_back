// src/services/api/ai-tools-service.ts
import apiClient from './axios-client';
import { 
  CVAnalysisResponse, 
  JobMatchResponseItem, 
  EmailGenerationResponse,
  InterviewQuestionItem,
  JobDescriptionResponse,
  ChatCompletionResponse,
  EmailTemplateInfo 
} from './types';

// AI Tools Service
export const aiToolsService = {
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

  // Candidate Feedback
  generateCandidateFeedback: async (candidate: any): Promise<string> => {
    try {
      const response = await apiClient.post('/ai-tools/generate-candidate-feedback', { candidate });
      return response.data.feedback;
    } catch (error) {
      console.error('Error generating candidate feedback:', error);
      throw error;
    }
  },

  // CV File Analysis (New Method)
  analyzeCvFile: async (
    file: File, 
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<{cv_analysis: CVAnalysisResponse, job_matches: JobMatchResponseItem[], file_info: any}> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post('/ai-tools/analyze-cv-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onUploadProgress
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing CV file:', error);
      throw error;
    }
  }
};

export default aiToolsService;