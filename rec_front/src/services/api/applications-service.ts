// src/services/api/applications-service.ts
import apiClient from './axios-client';
import {
  Application,
  ApplicationWithDetails,
  ApplicationCreate,
  ApplicationUpdate,
  ApplicationStatusChange,
  ScheduleInterview,
  MakeOffer,
  ApplicationStatusHistory,
  ApplicationNote,
  ApplicationNoteCreate,
  ApplicationNoteUpdate,
  BulkApplicationUpdate,
  ApplicationSearchParams,
  PaginatedApplicationsResponse,
  ApplicationPipelineView
} from '@/types/application';

export const ApplicationsService = {
  /**
   * Get paginated list of applications with filtering
   */
  getAll: async (params: Partial<ApplicationSearchParams> = {}): Promise<PaginatedApplicationsResponse> => {
    try {
      const response = await apiClient.get<PaginatedApplicationsResponse>('/applications', { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      throw error;
    }
  },

  /**
   * Get application by ID
   */
  getById: async (applicationId: string): Promise<ApplicationWithDetails> => {
    try {
      const response = await apiClient.get<ApplicationWithDetails>(`/applications/${applicationId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch application with ID ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new application
   */
  create: async (applicationData: ApplicationCreate): Promise<Application> => {
    try {
      const response = await apiClient.post<Application>('/applications', applicationData);
      return response;
    } catch (error) {
      console.error('Failed to create application:', error);
      throw error;
    }
  },

  /**
   * Update an existing application
   */
  update: async (applicationId: string, applicationData: ApplicationUpdate): Promise<Application> => {
    try {
      const response = await apiClient.put<Application>(`/applications/${applicationId}`, applicationData);
      return response;
    } catch (error) {
      console.error(`Failed to update application with ID ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Change application status
   */
  changeStatus: async (applicationId: string, statusData: ApplicationStatusChange): Promise<Application> => {
    try {
      const response = await apiClient.post<Application>(`/applications/${applicationId}/status`, statusData);
      return response;
    } catch (error) {
      console.error(`Failed to change status for application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Schedule an interview
   */
  scheduleInterview: async (applicationId: string, interviewData: ScheduleInterview): Promise<Application> => {
    try {
      const response = await apiClient.post<Application>(`/applications/${applicationId}/schedule-interview`, interviewData);
      return response;
    } catch (error) {
      console.error(`Failed to schedule interview for application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Make a job offer
   */
  makeOffer: async (applicationId: string, offerData: MakeOffer): Promise<Application> => {
    try {
      const response = await apiClient.post<Application>(`/applications/${applicationId}/make-offer`, offerData);
      return response;
    } catch (error) {
      console.error(`Failed to make offer for application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Get application status history
   */
  getStatusHistory: async (applicationId: string): Promise<ApplicationStatusHistory[]> => {
    try {
      const response = await apiClient.get<ApplicationStatusHistory[]>(`/applications/${applicationId}/status-history`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch status history for application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Get application notes
   */
  getNotes: async (applicationId: string): Promise<ApplicationNote[]> => {
    try {
      const response = await apiClient.get<ApplicationNote[]>(`/applications/${applicationId}/notes`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch notes for application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Add application note
   */
  addNote: async (applicationId: string, noteData: ApplicationNoteCreate): Promise<ApplicationNote> => {
    try {
      const response = await apiClient.post<ApplicationNote>(`/applications/${applicationId}/notes`, noteData);
      return response;
    } catch (error) {
      console.error(`Failed to add note to application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Update application note
   */
  updateNote: async (applicationId: string, noteId: string, noteData: ApplicationNoteUpdate): Promise<ApplicationNote> => {
    try {
      const response = await apiClient.put<ApplicationNote>(
        `/applications/${applicationId}/notes/${noteId}`,
        noteData
      );
      return response;
    } catch (error) {
      console.error(`Failed to update note ${noteId} for application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Delete application note
   */
  deleteNote: async (applicationId: string, noteId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/applications/${applicationId}/notes/${noteId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete note ${noteId} from application ${applicationId}:`, error);
      throw error;
    }
  },

  /**
   * Bulk change application status
   */
  bulkChangeStatus: async (bulkData: BulkApplicationUpdate): Promise<boolean> => {
    try {
      await apiClient.post('/applications/bulk-status-change', bulkData);
      return true;
    } catch (error) {
      console.error('Failed to bulk change application status:', error);
      throw error;
    }
  },

  /**
   * Bulk update applications
   */
  bulkUpdate: async (bulkData: BulkApplicationUpdate): Promise<boolean> => {
    try {
      await apiClient.post('/applications/bulk-update', bulkData);
      return true;
    } catch (error) {
      console.error('Failed to bulk update applications:', error);
      throw error;
    }
  },

  /**
   * Get application pipeline view
   */
  getPipelineView: async (companyId?: string, consultantId?: string): Promise<ApplicationPipelineView> => {
    try {
      const response = await apiClient.get<ApplicationPipelineView>('/applications/pipeline', {
        params: {
          company_id: companyId,
          consultant_id: consultantId
        }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch application pipeline view:', error);
      throw error;
    }
  },

  /**
   * Get applications by candidate
   */
  getByCandidate: async (
    candidateId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedApplicationsResponse> => {
    try {
      const response = await apiClient.get<PaginatedApplicationsResponse>('/applications', {
        params: {
          candidate_id: candidateId,
          page,
          page_size: pageSize
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch applications for candidate ${candidateId}:`, error);
      throw error;
    }
  },

  /**
   * Get applications by job
   */
  getByJob: async (
    jobId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedApplicationsResponse> => {
    try {
      const response = await apiClient.get<PaginatedApplicationsResponse>('/applications', {
        params: {
          job_id: jobId,
          page,
          page_size: pageSize
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch applications for job ${jobId}:`, error);
      throw error;
    }
  },

  /**
   * Get applications by company
   */
  getByCompany: async (
    companyId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedApplicationsResponse> => {
    try {
      const response = await apiClient.get<PaginatedApplicationsResponse>('/applications', {
        params: {
          company_id: companyId,
          page,
          page_size: pageSize
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch applications for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get applications by consultant
   */
  getByConsultant: async (
    consultantId: string, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<PaginatedApplicationsResponse> => {
    try {
      const response = await apiClient.get<PaginatedApplicationsResponse>('/applications', {
        params: {
          consultant_id: consultantId,
          page,
          page_size: pageSize
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch applications for consultant ${consultantId}:`, error);
      throw error;
    }
  }
};

export default ApplicationsService;