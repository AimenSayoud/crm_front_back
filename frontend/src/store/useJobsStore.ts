// src/store/useJobsStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import JobsService from '../services/api/jobs-service';
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
} from '../types/job';

// State interface
interface JobsState {
  // Basic job data
  jobs: Job[];
  jobDetails: Record<string, Job>;
  similarJobs: Record<string, Job[]>;
  
  // Job skill requirements
  jobSkillRequirements: Record<string, JobSkillRequirement[]>;
  
  // Application data
  jobApplicationStats: Record<string, JobApplicationStats>;
  
  // Search results
  searchResults: PaginatedJobsResponse | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingSearch: boolean;
  isLoadingSkillRequirements: boolean;
  isLoadingApplicationStats: boolean;
  isLoadingSimilarJobs: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  error: string | null;
  detailsError: string | null;
  searchError: string | null;
  skillRequirementsError: string | null;
  applicationStatsError: string | null;
  similarJobsError: string | null;
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
interface JobsActions {
  // Basic operations
  fetchJobs: (params?: Partial<JobSearchParams>) => Promise<PaginatedJobsResponse | null>;
  fetchJobById: (id: string) => Promise<Job | null>;
  createJob: (data: JobCreateDTO) => Promise<Job | null>;
  updateJob: (id: string, data: JobUpdateDTO) => Promise<Job | null>;
  deleteJob: (id: string) => Promise<boolean>;
  
  // Job status operations
  closeJob: (id: string) => Promise<Job | null>;
  reopenJob: (id: string) => Promise<Job | null>;
  
  // Search and filters
  searchJobs: (params: JobSearchParams) => Promise<PaginatedJobsResponse | null>;
  
  // Skill requirements
  fetchJobSkillRequirements: (jobId: string) => Promise<JobSkillRequirement[] | null>;
  addJobSkillRequirement: (jobId: string, data: JobSkillRequirementCreateDTO) => Promise<JobSkillRequirement | null>;
  updateJobSkillRequirement: (jobId: string, skillReqId: string, data: JobSkillRequirementUpdateDTO) => Promise<JobSkillRequirement | null>;
  removeJobSkillRequirement: (jobId: string, skillReqId: string) => Promise<boolean>;
  
  // Applications
  fetchJobApplicationStats: (jobId: string) => Promise<JobApplicationStats | null>;
  
  // Similar jobs
  fetchSimilarJobs: (jobId: string, limit?: number) => Promise<Job[] | null>;
  
  // Company specific
  fetchJobsByCompany: (companyId: string, page?: number, pageSize?: number) => Promise<PaginatedJobsResponse | null>;
  
  // Utility actions
  resetErrors: () => void;
  resetState: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

// Combined store type
type JobsStore = JobsState & JobsActions;

// Create the store
export const useJobsStore = create<JobsStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    jobs: [],
    jobDetails: {},
    similarJobs: {},
    
    jobSkillRequirements: {},
    jobApplicationStats: {},
    
    searchResults: null,
    
    isLoading: false,
    isLoadingDetails: false,
    isLoadingSearch: false,
    isLoadingSkillRequirements: false,
    isLoadingApplicationStats: false,
    isLoadingSimilarJobs: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    
    error: null,
    detailsError: null,
    searchError: null,
    skillRequirementsError: null,
    applicationStatsError: null,
    similarJobsError: null,
    createError: null,
    updateError: null,
    deleteError: null,
    
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    pageSize: 20,
    
    // Basic operations
    fetchJobs: async (params = {}) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await JobsService.getAll(params);
        
        set({
          jobs: response.jobs,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchJobById: async (id) => {
      set({ isLoadingDetails: true, detailsError: null });
      
      try {
        const job = await JobsService.getById(id);
        
        set(state => ({
          jobDetails: {
            ...state.jobDetails,
            [id]: job
          },
          isLoadingDetails: false
        }));
        
        return job;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch job details';
        set({ detailsError: errorMessage, isLoadingDetails: false });
        return null;
      }
    },
    
    createJob: async (data) => {
      set({ isCreating: true, createError: null });
      
      try {
        const newJob = await JobsService.create(data);
        
        set(state => ({
          jobs: [...state.jobs, newJob],
          isCreating: false
        }));
        
        return newJob;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
        set({ createError: errorMessage, isCreating: false });
        return null;
      }
    },
    
    updateJob: async (id, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const updatedJob = await JobsService.update(id, data);
        
        set(state => ({
          jobs: state.jobs.map(job => job.id === id ? updatedJob : job),
          jobDetails: {
            ...state.jobDetails,
            [id]: updatedJob
          },
          isUpdating: false
        }));
        
        return updatedJob;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update job';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    deleteJob: async (id) => {
      set({ isDeleting: true, deleteError: null });
      
      try {
        await JobsService.delete(id);
        
        set(state => ({
          jobs: state.jobs.filter(job => job.id !== id),
          jobDetails: {
            ...state.jobDetails,
            [id]: undefined
          },
          isDeleting: false
        }));
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete job';
        set({ deleteError: errorMessage, isDeleting: false });
        return false;
      }
    },
    
    // Job status operations
    closeJob: async (id) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const closedJob = await JobsService.closeJob(id);
        
        set(state => ({
          jobs: state.jobs.map(job => job.id === id ? closedJob : job),
          jobDetails: {
            ...state.jobDetails,
            [id]: closedJob
          },
          isUpdating: false
        }));
        
        return closedJob;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to close job';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    reopenJob: async (id) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const reopenedJob = await JobsService.reopenJob(id);
        
        set(state => ({
          jobs: state.jobs.map(job => job.id === id ? reopenedJob : job),
          jobDetails: {
            ...state.jobDetails,
            [id]: reopenedJob
          },
          isUpdating: false
        }));
        
        return reopenedJob;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to reopen job';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    // Search and filters
    searchJobs: async (params) => {
      set({ isLoadingSearch: true, searchError: null });
      
      try {
        const results = await JobsService.search(params);
        
        set({
          searchResults: results,
          isLoadingSearch: false
        });
        
        return results;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search jobs';
        set({ searchError: errorMessage, isLoadingSearch: false });
        return null;
      }
    },
    
    // Skill requirements
    fetchJobSkillRequirements: async (jobId) => {
      set({ isLoadingSkillRequirements: true, skillRequirementsError: null });
      
      try {
        const requirements = await JobsService.getJobSkillRequirements(jobId);
        
        set(state => ({
          jobSkillRequirements: {
            ...state.jobSkillRequirements,
            [jobId]: requirements
          },
          isLoadingSkillRequirements: false
        }));
        
        return requirements;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch job skill requirements';
        set({ skillRequirementsError: errorMessage, isLoadingSkillRequirements: false });
        return null;
      }
    },
    
    addJobSkillRequirement: async (jobId, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const newRequirement = await JobsService.addJobSkillRequirement(jobId, data);
        
        set(state => {
          const currentRequirements = state.jobSkillRequirements[jobId] || [];
          
          return {
            jobSkillRequirements: {
              ...state.jobSkillRequirements,
              [jobId]: [...currentRequirements, newRequirement]
            },
            isUpdating: false
          };
        });
        
        return newRequirement;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add job skill requirement';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    updateJobSkillRequirement: async (jobId, skillReqId, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const updatedRequirement = await JobsService.updateJobSkillRequirement(jobId, skillReqId, data);
        
        set(state => {
          const currentRequirements = state.jobSkillRequirements[jobId] || [];
          
          return {
            jobSkillRequirements: {
              ...state.jobSkillRequirements,
              [jobId]: currentRequirements.map(req => 
                req.id === skillReqId ? updatedRequirement : req
              )
            },
            isUpdating: false
          };
        });
        
        return updatedRequirement;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update job skill requirement';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    removeJobSkillRequirement: async (jobId, skillReqId) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        await JobsService.removeJobSkillRequirement(jobId, skillReqId);
        
        set(state => {
          const currentRequirements = state.jobSkillRequirements[jobId] || [];
          
          return {
            jobSkillRequirements: {
              ...state.jobSkillRequirements,
              [jobId]: currentRequirements.filter(req => req.id !== skillReqId)
            },
            isUpdating: false
          };
        });
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove job skill requirement';
        set({ updateError: errorMessage, isUpdating: false });
        return false;
      }
    },
    
    // Applications
    fetchJobApplicationStats: async (jobId) => {
      set({ isLoadingApplicationStats: true, applicationStatsError: null });
      
      try {
        const stats = await JobsService.getJobApplicationStats(jobId);
        
        set(state => ({
          jobApplicationStats: {
            ...state.jobApplicationStats,
            [jobId]: stats
          },
          isLoadingApplicationStats: false
        }));
        
        return stats;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch job application statistics';
        set({ applicationStatsError: errorMessage, isLoadingApplicationStats: false });
        return null;
      }
    },
    
    // Similar jobs
    fetchSimilarJobs: async (jobId, limit = 5) => {
      set({ isLoadingSimilarJobs: true, similarJobsError: null });
      
      try {
        const jobs = await JobsService.getSimilarJobs(jobId, limit);
        
        set(state => ({
          similarJobs: {
            ...state.similarJobs,
            [jobId]: jobs
          },
          isLoadingSimilarJobs: false
        }));
        
        return jobs;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch similar jobs';
        set({ similarJobsError: errorMessage, isLoadingSimilarJobs: false });
        return null;
      }
    },
    
    // Company specific
    fetchJobsByCompany: async (companyId, page = 1, pageSize = 20) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await JobsService.getJobsByCompany(companyId, page, pageSize);
        
        set({
          jobs: response.jobs,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Failed to fetch jobs for company ${companyId}`;
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    // Utility actions
    resetErrors: () => {
      set({
        error: null,
        detailsError: null,
        searchError: null,
        skillRequirementsError: null,
        applicationStatsError: null,
        similarJobsError: null,
        createError: null,
        updateError: null,
        deleteError: null
      });
    },
    
    resetState: () => {
      set({
        jobs: [],
        jobDetails: {},
        similarJobs: {},
        
        jobSkillRequirements: {},
        jobApplicationStats: {},
        
        searchResults: null,
        
        isLoading: false,
        isLoadingDetails: false,
        isLoadingSearch: false,
        isLoadingSkillRequirements: false,
        isLoadingApplicationStats: false,
        isLoadingSimilarJobs: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        
        error: null,
        detailsError: null,
        searchError: null,
        skillRequirementsError: null,
        applicationStatsError: null,
        similarJobsError: null,
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
export const selectJobs = (state: JobsStore) => state.jobs;
export const selectJobDetails = (state: JobsStore) => state.jobDetails;
export const selectSimilarJobs = (state: JobsStore) => state.similarJobs;
export const selectJobSkillRequirements = (state: JobsStore) => state.jobSkillRequirements;
export const selectJobApplicationStats = (state: JobsStore) => state.jobApplicationStats;
export const selectSearchResults = (state: JobsStore) => state.searchResults;

export const selectIsLoading = (state: JobsStore) => state.isLoading;
export const selectIsLoadingDetails = (state: JobsStore) => state.isLoadingDetails;
export const selectIsLoadingSearch = (state: JobsStore) => state.isLoadingSearch;
export const selectIsLoadingSkillRequirements = (state: JobsStore) => state.isLoadingSkillRequirements;
export const selectIsLoadingApplicationStats = (state: JobsStore) => state.isLoadingApplicationStats;
export const selectIsLoadingSimilarJobs = (state: JobsStore) => state.isLoadingSimilarJobs;
export const selectIsCreating = (state: JobsStore) => state.isCreating;
export const selectIsUpdating = (state: JobsStore) => state.isUpdating;
export const selectIsDeleting = (state: JobsStore) => state.isDeleting;

export const selectError = (state: JobsStore) => state.error;
export const selectDetailsError = (state: JobsStore) => state.detailsError;
export const selectSearchError = (state: JobsStore) => state.searchError;
export const selectSkillRequirementsError = (state: JobsStore) => state.skillRequirementsError;
export const selectApplicationStatsError = (state: JobsStore) => state.applicationStatsError;
export const selectSimilarJobsError = (state: JobsStore) => state.similarJobsError;
export const selectCreateError = (state: JobsStore) => state.createError;
export const selectUpdateError = (state: JobsStore) => state.updateError;
export const selectDeleteError = (state: JobsStore) => state.deleteError;

export const selectPagination = (state: JobsStore) => ({
  currentPage: state.currentPage,
  totalItems: state.totalItems,
  totalPages: state.totalPages,
  pageSize: state.pageSize
});