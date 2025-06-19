// src/store/useCompaniesStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { CompaniesService } from '../services/api/companies-service';
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
} from '../types/company';

// State interface
interface CompaniesState {
  // Basic company data
  companies: Company[];
  companyDetails: Record<string, Company>;
  
  // Contacts and employees data
  companyContacts: Record<string, CompanyContact[]>;
  companyEmployees: Record<string, {
    employees: CompanyEmployee[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>;
  
  // Hiring preferences
  companyHiringPreferences: Record<string, CompanyHiringPreferences>;
  
  // Analytics data
  companyStats: Record<string, CompanyStats>;
  dashboardStats: Record<string, CompanyDashboardStats>;
  talentPipeline: Record<string, CompanyTalentPipeline>;
  competitorAnalysis: Record<string, CompanyCompetitorAnalysis>;
  recruitmentEfficiency: Record<string, CompanyRecruitmentEfficiency>;
  
  // Search results
  searchResults: PaginatedCompaniesResponse | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingContacts: boolean;
  isLoadingEmployees: boolean;
  isLoadingHiringPreferences: boolean;
  isLoadingStats: boolean;
  isLoadingDashboard: boolean;
  isLoadingTalentPipeline: boolean;
  isLoadingCompetitorAnalysis: boolean;
  isLoadingRecruitmentEfficiency: boolean;
  isLoadingSearch: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: string | null;
  detailsError: string | null;
  contactsError: string | null;
  employeesError: string | null;
  hiringPreferencesError: string | null;
  statsError: string | null;
  dashboardError: string | null;
  talentPipelineError: string | null;
  competitorAnalysisError: string | null;
  recruitmentEfficiencyError: string | null;
  searchError: string | null;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  
  // Pagination
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

// Actions interface
interface CompaniesActions {
  // Basic operations
  fetchCompanies: (params?: Partial<CompanySearchParams>) => Promise<PaginatedCompaniesResponse | null>;
  fetchCompanyById: (id: string) => Promise<Company | null>;
  createCompany: (data: CompanyCreateDTO) => Promise<Company | null>;
  createCompanyWithAdmin: (data: CompanyCreateDTO & { 
    admin_first_name: string; 
    admin_last_name: string; 
    admin_email: string; 
    admin_password: string; 
  }) => Promise<Company | null>;
  updateCompany: (id: string, data: CompanyUpdateDTO) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<boolean>;
  verifyCompany: (id: string, verificationNotes?: string) => Promise<Company | null>;
  
  // Search and filters
  searchCompanies: (params: CompanySearchParams) => Promise<PaginatedCompaniesResponse | null>;
  
  // Contacts
  fetchCompanyContacts: (companyId: string) => Promise<CompanyContact[] | null>;
  addCompanyContact: (companyId: string, data: CompanyContactCreateDTO) => Promise<CompanyContact | null>;
  updateCompanyContact: (companyId: string, contactId: string, data: CompanyContactUpdateDTO) => Promise<CompanyContact | null>;
  deleteCompanyContact: (companyId: string, contactId: string) => Promise<boolean>;
  
  // Employees
  fetchCompanyEmployees: (companyId: string, page?: number, pageSize?: number) => Promise<{
    employees: CompanyEmployee[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  } | null>;
  
  // Hiring preferences
  fetchCompanyHiringPreferences: (companyId: string) => Promise<CompanyHiringPreferences | null>;
  updateCompanyHiringPreferences: (companyId: string, data: CompanyHiringPreferencesUpdateDTO) => Promise<CompanyHiringPreferences | null>;
  
  // Analytics
  fetchCompanyStats: (companyId: string, startDate?: string, endDate?: string) => Promise<CompanyStats | null>;
  fetchDashboardStats: (companyId: string) => Promise<CompanyDashboardStats | null>;
  fetchTalentPipeline: (companyId: string, jobId?: string) => Promise<CompanyTalentPipeline | null>;
  fetchCompetitorAnalysis: (companyId: string) => Promise<CompanyCompetitorAnalysis | null>;
  fetchRecruitmentEfficiency: (companyId: string, dateFrom?: string, dateTo?: string) => Promise<CompanyRecruitmentEfficiency | null>;
  
  // Utility actions
  resetErrors: () => void;
  resetState: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

// Combined store type
type CompaniesStore = CompaniesState & CompaniesActions;

// Create the store
export const useCompaniesStore = create<CompaniesStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    companies: [],
    companyDetails: {},
    
    companyContacts: {},
    companyEmployees: {},
    
    companyHiringPreferences: {},
    
    companyStats: {},
    dashboardStats: {},
    talentPipeline: {},
    competitorAnalysis: {},
    recruitmentEfficiency: {},
    
    searchResults: null,
    
    isLoading: false,
    isLoadingDetails: false,
    isLoadingContacts: false,
    isLoadingEmployees: false,
    isLoadingHiringPreferences: false,
    isLoadingStats: false,
    isLoadingDashboard: false,
    isLoadingTalentPipeline: false,
    isLoadingCompetitorAnalysis: false,
    isLoadingRecruitmentEfficiency: false,
    isLoadingSearch: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    
    error: null,
    detailsError: null,
    contactsError: null,
    employeesError: null,
    hiringPreferencesError: null,
    statsError: null,
    dashboardError: null,
    talentPipelineError: null,
    competitorAnalysisError: null,
    recruitmentEfficiencyError: null,
    searchError: null,
    createError: null,
    updateError: null,
    deleteError: null,
    
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    pageSize: 20,
    
    // Basic operations
    fetchCompanies: async (params = {}) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await CompaniesService.getAll(params);
        
        set({
          companies: response.companies,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch companies';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchCompanyById: async (id) => {
      set({ isLoadingDetails: true, detailsError: null });
      
      try {
        const company = await CompaniesService.getById(id);
        
        set(state => ({
          companyDetails: {
            ...state.companyDetails,
            [id]: company
          },
          isLoadingDetails: false
        }));
        
        return company;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company details';
        set({ detailsError: errorMessage, isLoadingDetails: false });
        return null;
      }
    },
    
    createCompany: async (data) => {
      set({ isCreating: true, createError: null });
      
      try {
        const newCompany = await CompaniesService.create(data);
        
        set(state => ({
          companies: [...state.companies, newCompany],
          isCreating: false
        }));
        
        return newCompany;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create company';
        set({ createError: errorMessage, isCreating: false });
        return null;
      }
    },
    
    createCompanyWithAdmin: async (data) => {
      set({ isCreating: true, createError: null });
      
      try {
        const newCompany = await CompaniesService.createWithAdmin(data);
        
        set(state => ({
          companies: [...state.companies, newCompany],
          isCreating: false
        }));
        
        return newCompany;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create company with admin';
        set({ createError: errorMessage, isCreating: false });
        return null;
      }
    },
    
    updateCompany: async (id, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const updatedCompany = await CompaniesService.update(id, data);
        
        set(state => ({
          companies: state.companies.map(company => company.id === id ? updatedCompany : company),
          companyDetails: {
            ...state.companyDetails,
            [id]: updatedCompany
          },
          isUpdating: false
        }));
        
        return updatedCompany;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update company';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    deleteCompany: async (id) => {
      set({ isDeleting: true, deleteError: null });
      
      try {
        await CompaniesService.delete(id);
        
        set(state => ({
          companies: state.companies.filter(company => company.id !== id),
          companyDetails: {
            ...state.companyDetails,
            [id]: undefined
          },
          isDeleting: false
        }));
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete company';
        set({ deleteError: errorMessage, isDeleting: false });
        return false;
      }
    },
    
    verifyCompany: async (id, verificationNotes) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const verifiedCompany = await CompaniesService.verifyCompany(id, verificationNotes);
        
        set(state => ({
          companies: state.companies.map(company => company.id === id ? verifiedCompany : company),
          companyDetails: {
            ...state.companyDetails,
            [id]: verifiedCompany
          },
          isUpdating: false
        }));
        
        return verifiedCompany;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to verify company';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    // Search and filters
    searchCompanies: async (params) => {
      set({ isLoadingSearch: true, searchError: null });
      
      try {
        const results = await CompaniesService.getAll(params);
        
        set({
          searchResults: results,
          isLoadingSearch: false
        });
        
        return results;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search companies';
        set({ searchError: errorMessage, isLoadingSearch: false });
        return null;
      }
    },
    
    // Contacts
    fetchCompanyContacts: async (companyId) => {
      set({ isLoadingContacts: true, contactsError: null });
      
      try {
        const contacts = await CompaniesService.getCompanyContacts(companyId);
        
        set(state => ({
          companyContacts: {
            ...state.companyContacts,
            [companyId]: contacts
          },
          isLoadingContacts: false
        }));
        
        return contacts;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company contacts';
        set({ contactsError: errorMessage, isLoadingContacts: false });
        return null;
      }
    },
    
    addCompanyContact: async (companyId, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const newContact = await CompaniesService.addCompanyContact(companyId, data);
        
        set(state => {
          const currentContacts = state.companyContacts[companyId] || [];
          
          return {
            companyContacts: {
              ...state.companyContacts,
              [companyId]: [...currentContacts, newContact]
            },
            isUpdating: false
          };
        });
        
        return newContact;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add company contact';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    updateCompanyContact: async (companyId, contactId, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const updatedContact = await CompaniesService.updateCompanyContact(companyId, contactId, data);
        
        set(state => {
          const currentContacts = state.companyContacts[companyId] || [];
          
          return {
            companyContacts: {
              ...state.companyContacts,
              [companyId]: currentContacts.map(contact => 
                contact.id === contactId ? updatedContact : contact
              )
            },
            isUpdating: false
          };
        });
        
        return updatedContact;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update company contact';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    deleteCompanyContact: async (companyId, contactId) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        await CompaniesService.deleteCompanyContact(companyId, contactId);
        
        set(state => {
          const currentContacts = state.companyContacts[companyId] || [];
          
          return {
            companyContacts: {
              ...state.companyContacts,
              [companyId]: currentContacts.filter(contact => contact.id !== contactId)
            },
            isUpdating: false
          };
        });
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete company contact';
        set({ updateError: errorMessage, isUpdating: false });
        return false;
      }
    },
    
    // Employees
    fetchCompanyEmployees: async (companyId, page = 1, pageSize = 20) => {
      set({ isLoadingEmployees: true, employeesError: null });
      
      try {
        const employeesData = await CompaniesService.getCompanyEmployees(companyId, page, pageSize);
        
        set(state => ({
          companyEmployees: {
            ...state.companyEmployees,
            [companyId]: employeesData
          },
          isLoadingEmployees: false
        }));
        
        return employeesData;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company employees';
        set({ employeesError: errorMessage, isLoadingEmployees: false });
        return null;
      }
    },
    
    // Hiring preferences
    fetchCompanyHiringPreferences: async (companyId) => {
      set({ isLoadingHiringPreferences: true, hiringPreferencesError: null });
      
      try {
        const preferences = await CompaniesService.getHiringPreferences(companyId);
        
        set(state => ({
          companyHiringPreferences: {
            ...state.companyHiringPreferences,
            [companyId]: preferences
          },
          isLoadingHiringPreferences: false
        }));
        
        return preferences;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company hiring preferences';
        set({ hiringPreferencesError: errorMessage, isLoadingHiringPreferences: false });
        return null;
      }
    },
    
    updateCompanyHiringPreferences: async (companyId, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const updatedPreferences = await CompaniesService.updateHiringPreferences(companyId, data);
        
        set(state => ({
          companyHiringPreferences: {
            ...state.companyHiringPreferences,
            [companyId]: updatedPreferences
          },
          isUpdating: false
        }));
        
        return updatedPreferences;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update company hiring preferences';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    // Analytics
    fetchCompanyStats: async (companyId, startDate, endDate) => {
      set({ isLoadingStats: true, statsError: null });
      
      try {
        const stats = await CompaniesService.getCompanyAnalytics(companyId, startDate, endDate);
        
        set(state => ({
          companyStats: {
            ...state.companyStats,
            [companyId]: stats
          },
          isLoadingStats: false
        }));
        
        return stats;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch company stats';
        set({ statsError: errorMessage, isLoadingStats: false });
        return null;
      }
    },
    
    fetchDashboardStats: async (companyId) => {
      set({ isLoadingDashboard: true, dashboardError: null });
      
      try {
        const stats = await CompaniesService.getDashboardStats(companyId);
        
        set(state => ({
          dashboardStats: {
            ...state.dashboardStats,
            [companyId]: stats
          },
          isLoadingDashboard: false
        }));
        
        return stats;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard stats';
        set({ dashboardError: errorMessage, isLoadingDashboard: false });
        return null;
      }
    },
    
    fetchTalentPipeline: async (companyId, jobId) => {
      set({ isLoadingTalentPipeline: true, talentPipelineError: null });
      
      try {
        const pipeline = await CompaniesService.getTalentPipeline(companyId, jobId);
        
        set(state => ({
          talentPipeline: {
            ...state.talentPipeline,
            [companyId]: pipeline
          },
          isLoadingTalentPipeline: false
        }));
        
        return pipeline;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch talent pipeline';
        set({ talentPipelineError: errorMessage, isLoadingTalentPipeline: false });
        return null;
      }
    },
    
    fetchCompetitorAnalysis: async (companyId) => {
      set({ isLoadingCompetitorAnalysis: true, competitorAnalysisError: null });
      
      try {
        const analysis = await CompaniesService.getCompetitorAnalysis(companyId);
        
        set(state => ({
          competitorAnalysis: {
            ...state.competitorAnalysis,
            [companyId]: analysis
          },
          isLoadingCompetitorAnalysis: false
        }));
        
        return analysis;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch competitor analysis';
        set({ competitorAnalysisError: errorMessage, isLoadingCompetitorAnalysis: false });
        return null;
      }
    },
    
    fetchRecruitmentEfficiency: async (companyId, dateFrom, dateTo) => {
      set({ isLoadingRecruitmentEfficiency: true, recruitmentEfficiencyError: null });
      
      try {
        const efficiency = await CompaniesService.getRecruitmentEfficiency(companyId, dateFrom, dateTo);
        
        set(state => ({
          recruitmentEfficiency: {
            ...state.recruitmentEfficiency,
            [companyId]: efficiency
          },
          isLoadingRecruitmentEfficiency: false
        }));
        
        return efficiency;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recruitment efficiency';
        set({ recruitmentEfficiencyError: errorMessage, isLoadingRecruitmentEfficiency: false });
        return null;
      }
    },
    
    // Utility actions
    resetErrors: () => {
      set({
        error: null,
        detailsError: null,
        contactsError: null,
        employeesError: null,
        hiringPreferencesError: null,
        statsError: null,
        dashboardError: null,
        talentPipelineError: null,
        competitorAnalysisError: null,
        recruitmentEfficiencyError: null,
        searchError: null,
        createError: null,
        updateError: null,
        deleteError: null
      });
    },
    
    resetState: () => {
      set({
        companies: [],
        companyDetails: {},
        
        companyContacts: {},
        companyEmployees: {},
        
        companyHiringPreferences: {},
        
        companyStats: {},
        dashboardStats: {},
        talentPipeline: {},
        competitorAnalysis: {},
        recruitmentEfficiency: {},
        
        searchResults: null,
        
        isLoading: false,
        isLoadingDetails: false,
        isLoadingContacts: false,
        isLoadingEmployees: false,
        isLoadingHiringPreferences: false,
        isLoadingStats: false,
        isLoadingDashboard: false,
        isLoadingTalentPipeline: false,
        isLoadingCompetitorAnalysis: false,
        isLoadingRecruitmentEfficiency: false,
        isLoadingSearch: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        
        error: null,
        detailsError: null,
        contactsError: null,
        employeesError: null,
        hiringPreferencesError: null,
        statsError: null,
        dashboardError: null,
        talentPipelineError: null,
        competitorAnalysisError: null,
        recruitmentEfficiencyError: null,
        searchError: null,
        createError: null,
        updateError: null,
        deleteError: null,
        
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
        pageSize: 20
      });
    },
    
    setCurrentPage: (page) => {
      set({ currentPage: page });
    },
    
    setPageSize: (size) => {
      set({ pageSize: size });
    }
  }))
);

// Create stable selectors for SSR compatibility
export const selectCompanies = (state: CompaniesStore) => state.companies;
export const selectCompanyDetails = (state: CompaniesStore) => state.companyDetails;
export const selectCompanyContacts = (state: CompaniesStore) => state.companyContacts;
export const selectCompanyEmployees = (state: CompaniesStore) => state.companyEmployees;
export const selectCompanyHiringPreferences = (state: CompaniesStore) => state.companyHiringPreferences;
export const selectCompanyStats = (state: CompaniesStore) => state.companyStats;
export const selectDashboardStats = (state: CompaniesStore) => state.dashboardStats;
export const selectTalentPipeline = (state: CompaniesStore) => state.talentPipeline;
export const selectCompetitorAnalysis = (state: CompaniesStore) => state.competitorAnalysis;
export const selectRecruitmentEfficiency = (state: CompaniesStore) => state.recruitmentEfficiency;
export const selectSearchResults = (state: CompaniesStore) => state.searchResults;

export const selectIsLoading = (state: CompaniesStore) => state.isLoading;
export const selectIsLoadingDetails = (state: CompaniesStore) => state.isLoadingDetails;
export const selectIsLoadingContacts = (state: CompaniesStore) => state.isLoadingContacts;
export const selectIsLoadingEmployees = (state: CompaniesStore) => state.isLoadingEmployees;
export const selectIsLoadingHiringPreferences = (state: CompaniesStore) => state.isLoadingHiringPreferences;
export const selectIsLoadingStats = (state: CompaniesStore) => state.isLoadingStats;
export const selectIsLoadingDashboard = (state: CompaniesStore) => state.isLoadingDashboard;
export const selectIsLoadingTalentPipeline = (state: CompaniesStore) => state.isLoadingTalentPipeline;
export const selectIsLoadingCompetitorAnalysis = (state: CompaniesStore) => state.isLoadingCompetitorAnalysis;
export const selectIsLoadingRecruitmentEfficiency = (state: CompaniesStore) => state.isLoadingRecruitmentEfficiency;
export const selectIsLoadingSearch = (state: CompaniesStore) => state.isLoadingSearch;
export const selectIsCreating = (state: CompaniesStore) => state.isCreating;
export const selectIsUpdating = (state: CompaniesStore) => state.isUpdating;
export const selectIsDeleting = (state: CompaniesStore) => state.isDeleting;

export const selectError = (state: CompaniesStore) => state.error;
export const selectDetailsError = (state: CompaniesStore) => state.detailsError;
export const selectContactsError = (state: CompaniesStore) => state.contactsError;
export const selectEmployeesError = (state: CompaniesStore) => state.employeesError;
export const selectHiringPreferencesError = (state: CompaniesStore) => state.hiringPreferencesError;
export const selectStatsError = (state: CompaniesStore) => state.statsError;
export const selectDashboardError = (state: CompaniesStore) => state.dashboardError;
export const selectTalentPipelineError = (state: CompaniesStore) => state.talentPipelineError;
export const selectCompetitorAnalysisError = (state: CompaniesStore) => state.competitorAnalysisError;
export const selectRecruitmentEfficiencyError = (state: CompaniesStore) => state.recruitmentEfficiencyError;
export const selectSearchError = (state: CompaniesStore) => state.searchError;
export const selectCreateError = (state: CompaniesStore) => state.createError;
export const selectUpdateError = (state: CompaniesStore) => state.updateError;
export const selectDeleteError = (state: CompaniesStore) => state.deleteError;

export const selectPagination = (state: CompaniesStore) => ({
  currentPage: state.currentPage,
  totalItems: state.totalItems,
  totalPages: state.totalPages,
  pageSize: state.pageSize
});