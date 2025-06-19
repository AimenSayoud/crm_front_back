// src/services/api/jobs-service.ts
import apiClient from './axios-client';
import { 
  Job, 
  JobCreateDTO, 
  JobUpdateDTO, 
  JobSearchParams, 
  PaginatedJobsResponse,
  JobSkillRequirement,
  JobSkillRequirementCreateDTO,
  JobSkillRequirementUpdateDTO,
  JobApplicationStats
} from '@/types/job';

export const JobsService = {
  /**
   * Search for jobs with advanced filtering
   */
  search: async (params: JobSearchParams): Promise<PaginatedJobsResponse> => {
    try {
      const response = await apiClient.get<PaginatedJobsResponse>('/jobs/search', { params });
      return response;
    } catch (error) {
      console.error('Failed to search jobs:', error);
      throw error;
    }
  },

  /**
   * Get paginated list of jobs
   */
  getAll: async (params: Partial<JobSearchParams> = {}): Promise<PaginatedJobsResponse> => {
    try {
      const response = await apiClient.get<PaginatedJobsResponse>('/jobs', { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      throw error;
    }
  },

  /**
   * Get job by ID
   */
  getById: async (jobId: string): Promise<Job> => {
    try {
      const response = await apiClient.get<Job>(`/jobs/${jobId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch job with ID ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new job
   */
  create: async (jobData: JobCreateDTO): Promise<Job> => {
    try {
      const response = await apiClient.post<Job>('/jobs', jobData);
      return response;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  },

  /**
   * Update an existing job
   */
  update: async (jobId: string, jobData: JobUpdateDTO): Promise<Job> => {
    try {
      const response = await apiClient.put<Job>(`/jobs/${jobId}`, jobData);
      return response;
    } catch (error) {
      console.error(`Failed to update job with ID ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a job
   */
  delete: async (jobId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/jobs/${jobId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete job with ID ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Close a job posting
   */
  closeJob: async (jobId: string): Promise<Job> => {
    try {
      const response = await apiClient.post<Job>(`/jobs/${jobId}/close`);
      return response;
    } catch (error) {
      console.error(`Failed to close job with ID ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Reopen a closed job posting
   */
  reopenJob: async (jobId: string): Promise<Job> => {
    try {
      const response = await apiClient.post<Job>(`/jobs/${jobId}/reopen`);
      return response;
    } catch (error) {
      console.error(`Failed to reopen job with ID ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get applications for a specific job
   */
  getJobApplications: async (
    jobId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<any> => { // Will refine type when implementing applications
    try {
      const response = await apiClient.get(`/jobs/${jobId}/applications`, {
        params: { page, page_size: pageSize }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch applications for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get job application statistics
   */
  getJobApplicationStats: async (jobId: string): Promise<JobApplicationStats> => {
    try {
      const response = await apiClient.get<JobApplicationStats>(`/jobs/${jobId}/applications/stats`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch application stats for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get skill requirements for a job
   */
  getJobSkillRequirements: async (jobId: string): Promise<JobSkillRequirement[]> => {
    try {
      const response = await apiClient.get<JobSkillRequirement[]>(`/jobs/${jobId}/skills`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch skill requirements for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Add a skill requirement to a job
   */
  addJobSkillRequirement: async (
    jobId: string, 
    skillRequirement: JobSkillRequirementCreateDTO
  ): Promise<JobSkillRequirement> => {
    try {
      const response = await apiClient.post<JobSkillRequirement>(`/jobs/${jobId}/skills`, skillRequirement);
      return response;
    } catch (error) {
      console.error(`Failed to add skill requirement to job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Update a job skill requirement
   */
  updateJobSkillRequirement: async (
    jobId: string,
    skillRequirementId: string,
    updates: JobSkillRequirementUpdateDTO
  ): Promise<JobSkillRequirement> => {
    try {
      const response = await apiClient.put<JobSkillRequirement>(
        `/jobs/${jobId}/skills/${skillRequirementId}`,
        updates
      );
      return response;
    } catch (error) {
      console.error(`Failed to update skill requirement ${skillRequirementId} for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a skill requirement from a job
   */
  removeJobSkillRequirement: async (
    jobId: string,
    skillRequirementId: string
  ): Promise<boolean> => {
    try {
      await apiClient.delete(`/jobs/${jobId}/skills/${skillRequirementId}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove skill requirement ${skillRequirementId} from job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get jobs similar to a specified job
   */
  getSimilarJobs: async (jobId: string, limit: number = 5): Promise<Job[]> => {
    try {
      const response = await apiClient.get<Job[]>(`/jobs/${jobId}/similar`, {
        params: { limit }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch similar jobs for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get jobs by company ID
   */
  getJobsByCompany: async (
    companyId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedJobsResponse> => {
    try {
      const response = await apiClient.get<PaginatedJobsResponse>('/jobs', {
        params: {
          company_id: companyId,
          page,
          page_size: pageSize
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch jobs for company ${companyId}:`, error);
      throw error;
    }
  }
};

export default JobsService;