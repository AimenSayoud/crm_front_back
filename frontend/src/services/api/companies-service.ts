// src/services/api/companies-service.ts
import apiClient from './axios-client';
import {
  Company,
  CompanyCreateDTO,
  CompanyUpdateDTO,
  CompanySearchParams,
  PaginatedCompaniesResponse,
  CompanyContact,
  CompanyContactCreateDTO,
  CompanyContactUpdateDTO,
  CompanyEmployee,
  CompanyHiringPreferences,
  CompanyHiringPreferencesUpdateDTO,
  CompanyStats,
  CompanyDashboardStats,
  CompanyTalentPipeline,
  CompanyCompetitorAnalysis,
  CompanyRecruitmentEfficiency
} from '@/types/company';
import { PaginatedJobsResponse } from '@/types/job';

export const CompaniesService = {
  /**
   * Get paginated list of companies with search and filters
   */
  getAll: async (params: Partial<CompanySearchParams> = {}): Promise<PaginatedCompaniesResponse> => {
    try {
      const response = await apiClient.get<PaginatedCompaniesResponse>('/companies', { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      throw error;
    }
  },

  /**
   * Get company by ID
   */
  getById: async (companyId: string): Promise<Company> => {
    try {
      const response = await apiClient.get<Company>(`/companies/${companyId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch company with ID ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new company
   */
  create: async (companyData: CompanyCreateDTO): Promise<Company> => {
    try {
      const response = await apiClient.post<Company>('/companies', companyData);
      return response;
    } catch (error) {
      console.error('Failed to create company:', error);
      throw error;
    }
  },

  /**
   * Create a new company with admin user
   */
  createWithAdmin: async (
    companyData: CompanyCreateDTO & { 
      admin_first_name: string; 
      admin_last_name: string; 
      admin_email: string; 
      admin_password: string; 
    }
  ): Promise<Company> => {
    try {
      const response = await apiClient.post<Company>('/companies/create-with-admin', companyData);
      return response;
    } catch (error) {
      console.error('Failed to create company with admin:', error);
      throw error;
    }
  },

  /**
   * Update an existing company
   */
  update: async (companyId: string, companyData: CompanyUpdateDTO): Promise<Company> => {
    try {
      const response = await apiClient.put<Company>(`/companies/${companyId}`, companyData);
      return response;
    } catch (error) {
      console.error(`Failed to update company with ID ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a company
   */
  delete: async (companyId: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/companies/${companyId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete company with ID ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company jobs
   */
  getJobsByCompany: async (
    companyId: string,
    page: number = 1,
    pageSize: number = 20,
    status?: string
  ): Promise<PaginatedJobsResponse> => {
    try {
      const response = await apiClient.get<PaginatedJobsResponse>(`/companies/${companyId}/jobs`, {
        params: {
          page,
          page_size: pageSize,
          status
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch jobs for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Verify a company
   */
  verifyCompany: async (companyId: string, verificationNotes?: string): Promise<Company> => {
    try {
      const response = await apiClient.post<Company>(`/companies/${companyId}/verify`, {
        verification_notes: verificationNotes
      });
      return response;
    } catch (error) {
      console.error(`Failed to verify company with ID ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company employees
   */
  getCompanyEmployees: async (
    companyId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    employees: CompanyEmployee[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> => {
    try {
      const response = await apiClient.get<{
        employees: CompanyEmployee[];
        total: number;
        page: number;
        page_size: number;
        total_pages: number;
      }>(`/companies/${companyId}/employees`, {
        params: { page, page_size: pageSize }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch employees for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company contacts
   */
  getCompanyContacts: async (companyId: string): Promise<CompanyContact[]> => {
    try {
      const response = await apiClient.get<CompanyContact[]>(`/companies/${companyId}/contacts`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch contacts for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Add company contact
   */
  addCompanyContact: async (
    companyId: string,
    contactData: CompanyContactCreateDTO
  ): Promise<CompanyContact> => {
    try {
      const response = await apiClient.post<CompanyContact>(
        `/companies/${companyId}/contacts`,
        contactData
      );
      return response;
    } catch (error) {
      console.error(`Failed to add contact to company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Update company contact
   */
  updateCompanyContact: async (
    companyId: string,
    contactId: string,
    contactData: CompanyContactUpdateDTO
  ): Promise<CompanyContact> => {
    try {
      const response = await apiClient.put<CompanyContact>(
        `/companies/${companyId}/contacts/${contactId}`,
        contactData
      );
      return response;
    } catch (error) {
      console.error(`Failed to update contact ${contactId} for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Delete company contact
   */
  deleteCompanyContact: async (
    companyId: string,
    contactId: string
  ): Promise<boolean> => {
    try {
      await apiClient.delete(`/companies/${companyId}/contacts/${contactId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete contact ${contactId} from company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company hiring preferences
   */
  getHiringPreferences: async (companyId: string): Promise<CompanyHiringPreferences> => {
    try {
      const response = await apiClient.get<CompanyHiringPreferences>(`/companies/${companyId}/hiring-preferences`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch hiring preferences for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Update company hiring preferences
   */
  updateHiringPreferences: async (
    companyId: string,
    preferencesData: CompanyHiringPreferencesUpdateDTO
  ): Promise<CompanyHiringPreferences> => {
    try {
      const response = await apiClient.put<CompanyHiringPreferences>(
        `/companies/${companyId}/hiring-preferences`,
        preferencesData
      );
      return response;
    } catch (error) {
      console.error(`Failed to update hiring preferences for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company analytics
   */
  getCompanyAnalytics: async (
    companyId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CompanyStats> => {
    try {
      const response = await apiClient.get<CompanyStats>(`/companies/${companyId}/analytics`, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch analytics for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company dashboard stats
   */
  getDashboardStats: async (companyId: string): Promise<CompanyDashboardStats> => {
    try {
      const response = await apiClient.get<CompanyDashboardStats>(`/companies/${companyId}/dashboard-stats`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch dashboard stats for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company talent pipeline
   */
  getTalentPipeline: async (companyId: string, jobId?: string): Promise<CompanyTalentPipeline> => {
    try {
      const response = await apiClient.get<CompanyTalentPipeline>(`/companies/${companyId}/talent-pipeline`, {
        params: { job_id: jobId }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch talent pipeline for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company competitor analysis
   */
  getCompetitorAnalysis: async (companyId: string): Promise<CompanyCompetitorAnalysis> => {
    try {
      const response = await apiClient.get<CompanyCompetitorAnalysis>(`/companies/${companyId}/competitor-analysis`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch competitor analysis for company ${companyId}:`, error);
      throw error;
    }
  },

  /**
   * Get company recruitment efficiency
   */
  getRecruitmentEfficiency: async (
    companyId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<CompanyRecruitmentEfficiency> => {
    try {
      const response = await apiClient.get<CompanyRecruitmentEfficiency>(`/companies/${companyId}/recruitment-efficiency`, {
        params: {
          date_from: dateFrom,
          date_to: dateTo
        }
      });
      return response;
    } catch (error) {
      console.error(`Failed to fetch recruitment efficiency for company ${companyId}:`, error);
      throw error;
    }
  }
};

export default CompaniesService;