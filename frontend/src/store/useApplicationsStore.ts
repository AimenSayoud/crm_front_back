// src/store/useApplicationsStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ApplicationsService } from '../services/api/applications-service';
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
  ApplicationPipelineView,
  ApplicationStatus
} from '../types/application';

// State interface
interface ApplicationsState {
  // Basic application data
  applications: ApplicationWithDetails[];
  applicationDetails: Record<string, ApplicationWithDetails>;
  
  // Related data
  applicationNotes: Record<string, ApplicationNote[]>;
  applicationStatusHistory: Record<string, ApplicationStatusHistory[]>;
  
  // Pipeline view
  pipelineView: ApplicationPipelineView | null;
  
  // Search results
  searchResults: PaginatedApplicationsResponse | null;
  
  // Filters
  activeFilters: Partial<ApplicationSearchParams>;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingNotes: boolean;
  isLoadingStatusHistory: boolean;
  isLoadingPipeline: boolean;
  isLoadingSearch: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isChangingStatus: boolean;
  isSchedulingInterview: boolean;
  isMakingOffer: boolean;
  isAddingNote: boolean;
  isUpdatingNote: boolean;
  isDeletingNote: boolean;
  isBulkUpdating: boolean;
  
  // Error states
  error: string | null;
  detailsError: string | null;
  notesError: string | null;
  statusHistoryError: string | null;
  pipelineError: string | null;
  searchError: string | null;
  createError: string | null;
  updateError: string | null;
  statusChangeError: string | null;
  interviewScheduleError: string | null;
  offerError: string | null;
  noteError: string | null;
  bulkUpdateError: string | null;
  
  // Pagination
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

// Actions interface
interface ApplicationsActions {
  // Basic operations
  fetchApplications: (params?: Partial<ApplicationSearchParams>) => Promise<PaginatedApplicationsResponse | null>;
  fetchApplicationById: (id: string) => Promise<ApplicationWithDetails | null>;
  createApplication: (data: ApplicationCreate) => Promise<Application | null>;
  updateApplication: (id: string, data: ApplicationUpdate) => Promise<Application | null>;
  
  // Status operations
  changeApplicationStatus: (id: string, statusData: ApplicationStatusChange) => Promise<Application | null>;
  scheduleInterview: (id: string, interviewData: ScheduleInterview) => Promise<Application | null>;
  makeOffer: (id: string, offerData: MakeOffer) => Promise<Application | null>;
  
  // Notes operations
  fetchApplicationNotes: (applicationId: string) => Promise<ApplicationNote[] | null>;
  addApplicationNote: (applicationId: string, noteData: ApplicationNoteCreate) => Promise<ApplicationNote | null>;
  updateApplicationNote: (applicationId: string, noteId: string, noteData: ApplicationNoteUpdate) => Promise<ApplicationNote | null>;
  deleteApplicationNote: (applicationId: string, noteId: string) => Promise<boolean>;
  
  // Status history
  fetchStatusHistory: (applicationId: string) => Promise<ApplicationStatusHistory[] | null>;
  
  // Bulk operations
  bulkChangeStatus: (bulkData: BulkApplicationUpdate) => Promise<boolean>;
  bulkUpdateApplications: (bulkData: BulkApplicationUpdate) => Promise<boolean>;
  
  // Pipeline view
  fetchPipelineView: (companyId?: string, consultantId?: string) => Promise<ApplicationPipelineView | null>;
  
  // Filter related operations
  setFilters: (filters: Partial<ApplicationSearchParams>) => void;
  clearFilters: () => void;
  
  // By relations
  fetchApplicationsByCandidate: (candidateId: string, page?: number, pageSize?: number) => Promise<PaginatedApplicationsResponse | null>;
  fetchApplicationsByJob: (jobId: string, page?: number, pageSize?: number) => Promise<PaginatedApplicationsResponse | null>;
  fetchApplicationsByCompany: (companyId: string, page?: number, pageSize?: number) => Promise<PaginatedApplicationsResponse | null>;
  fetchApplicationsByConsultant: (consultantId: string, page?: number, pageSize?: number) => Promise<PaginatedApplicationsResponse | null>;
  
  // Utility actions
  resetErrors: () => void;
  resetState: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

// Combined store type
type ApplicationsStore = ApplicationsState & ApplicationsActions;

// Create the store
export const useApplicationsStore = create<ApplicationsStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    applications: [],
    applicationDetails: {},
    
    applicationNotes: {},
    applicationStatusHistory: {},
    
    pipelineView: null,
    
    searchResults: null,
    
    activeFilters: {},
    
    isLoading: false,
    isLoadingDetails: false,
    isLoadingNotes: false,
    isLoadingStatusHistory: false,
    isLoadingPipeline: false,
    isLoadingSearch: false,
    isCreating: false,
    isUpdating: false,
    isChangingStatus: false,
    isSchedulingInterview: false,
    isMakingOffer: false,
    isAddingNote: false,
    isUpdatingNote: false,
    isDeletingNote: false,
    isBulkUpdating: false,
    
    error: null,
    detailsError: null,
    notesError: null,
    statusHistoryError: null,
    pipelineError: null,
    searchError: null,
    createError: null,
    updateError: null,
    statusChangeError: null,
    interviewScheduleError: null,
    offerError: null,
    noteError: null,
    bulkUpdateError: null,
    
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    pageSize: 20,
    
    // Basic operations
    fetchApplications: async (params = {}) => {
      set({ isLoading: true, error: null });
      
      try {
        const mergedParams = { ...get().activeFilters, ...params };
        const response = await ApplicationsService.getAll(mergedParams);
        
        set({
          applications: response.applications,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch applications';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchApplicationById: async (id) => {
      set({ isLoadingDetails: true, detailsError: null });
      
      try {
        const application = await ApplicationsService.getById(id);
        
        set(state => ({
          applicationDetails: {
            ...state.applicationDetails,
            [id]: application
          },
          isLoadingDetails: false
        }));
        
        return application;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application details';
        set({ detailsError: errorMessage, isLoadingDetails: false });
        return null;
      }
    },
    
    createApplication: async (data) => {
      set({ isCreating: true, createError: null });
      
      try {
        const newApplication = await ApplicationsService.create(data);
        
        set(state => ({
          isCreating: false
        }));
        
        // Refresh applications list after creation
        await get().fetchApplications();
        
        return newApplication;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create application';
        set({ createError: errorMessage, isCreating: false });
        return null;
      }
    },
    
    updateApplication: async (id, data) => {
      set({ isUpdating: true, updateError: null });
      
      try {
        const updatedApplication = await ApplicationsService.update(id, data);
        
        // Update application in state
        set(state => {
          const updatedApplications = state.applications.map(app => 
            app.id === id ? { ...app, ...updatedApplication } : app
          );
          
          return {
            applications: updatedApplications,
            applicationDetails: {
              ...state.applicationDetails,
              [id]: { ...state.applicationDetails[id], ...updatedApplication }
            },
            isUpdating: false
          };
        });
        
        return updatedApplication;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update application';
        set({ updateError: errorMessage, isUpdating: false });
        return null;
      }
    },
    
    // Status operations
    changeApplicationStatus: async (id, statusData) => {
      set({ isChangingStatus: true, statusChangeError: null });
      
      try {
        const updatedApplication = await ApplicationsService.changeStatus(id, statusData);
        
        // Update application in state
        set(state => {
          const updatedApplications = state.applications.map(app => 
            app.id === id ? { ...app, ...updatedApplication } : app
          );
          
          return {
            applications: updatedApplications,
            applicationDetails: {
              ...state.applicationDetails,
              [id]: { ...state.applicationDetails[id], ...updatedApplication }
            },
            isChangingStatus: false
          };
        });
        
        // Refresh status history if already loaded
        if (get().applicationStatusHistory[id]) {
          await get().fetchStatusHistory(id);
        }
        
        return updatedApplication;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to change application status';
        set({ statusChangeError: errorMessage, isChangingStatus: false });
        return null;
      }
    },
    
    scheduleInterview: async (id, interviewData) => {
      set({ isSchedulingInterview: true, interviewScheduleError: null });
      
      try {
        const updatedApplication = await ApplicationsService.scheduleInterview(id, interviewData);
        
        // Update application in state
        set(state => {
          const updatedApplications = state.applications.map(app => 
            app.id === id ? { ...app, ...updatedApplication } : app
          );
          
          return {
            applications: updatedApplications,
            applicationDetails: {
              ...state.applicationDetails,
              [id]: { ...state.applicationDetails[id], ...updatedApplication }
            },
            isSchedulingInterview: false
          };
        });
        
        // Refresh status history if already loaded
        if (get().applicationStatusHistory[id]) {
          await get().fetchStatusHistory(id);
        }
        
        return updatedApplication;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to schedule interview';
        set({ interviewScheduleError: errorMessage, isSchedulingInterview: false });
        return null;
      }
    },
    
    makeOffer: async (id, offerData) => {
      set({ isMakingOffer: true, offerError: null });
      
      try {
        const updatedApplication = await ApplicationsService.makeOffer(id, offerData);
        
        // Update application in state
        set(state => {
          const updatedApplications = state.applications.map(app => 
            app.id === id ? { ...app, ...updatedApplication } : app
          );
          
          return {
            applications: updatedApplications,
            applicationDetails: {
              ...state.applicationDetails,
              [id]: { ...state.applicationDetails[id], ...updatedApplication }
            },
            isMakingOffer: false
          };
        });
        
        // Refresh status history if already loaded
        if (get().applicationStatusHistory[id]) {
          await get().fetchStatusHistory(id);
        }
        
        return updatedApplication;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to make offer';
        set({ offerError: errorMessage, isMakingOffer: false });
        return null;
      }
    },
    
    // Notes operations
    fetchApplicationNotes: async (applicationId) => {
      set({ isLoadingNotes: true, notesError: null });
      
      try {
        const notes = await ApplicationsService.getNotes(applicationId);
        
        set(state => ({
          applicationNotes: {
            ...state.applicationNotes,
            [applicationId]: notes
          },
          isLoadingNotes: false
        }));
        
        return notes;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application notes';
        set({ notesError: errorMessage, isLoadingNotes: false });
        return null;
      }
    },
    
    addApplicationNote: async (applicationId, noteData) => {
      set({ isAddingNote: true, noteError: null });
      
      try {
        const newNote = await ApplicationsService.addNote(applicationId, noteData);
        
        set(state => {
          const currentNotes = state.applicationNotes[applicationId] || [];
          
          return {
            applicationNotes: {
              ...state.applicationNotes,
              [applicationId]: [...currentNotes, newNote]
            },
            isAddingNote: false
          };
        });
        
        return newNote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add application note';
        set({ noteError: errorMessage, isAddingNote: false });
        return null;
      }
    },
    
    updateApplicationNote: async (applicationId, noteId, noteData) => {
      set({ isUpdatingNote: true, noteError: null });
      
      try {
        const updatedNote = await ApplicationsService.updateNote(applicationId, noteId, noteData);
        
        set(state => {
          const currentNotes = state.applicationNotes[applicationId] || [];
          
          return {
            applicationNotes: {
              ...state.applicationNotes,
              [applicationId]: currentNotes.map(note => 
                note.id === noteId ? updatedNote : note
              )
            },
            isUpdatingNote: false
          };
        });
        
        return updatedNote;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update application note';
        set({ noteError: errorMessage, isUpdatingNote: false });
        return null;
      }
    },
    
    deleteApplicationNote: async (applicationId, noteId) => {
      set({ isDeletingNote: true, noteError: null });
      
      try {
        await ApplicationsService.deleteNote(applicationId, noteId);
        
        set(state => {
          const currentNotes = state.applicationNotes[applicationId] || [];
          
          return {
            applicationNotes: {
              ...state.applicationNotes,
              [applicationId]: currentNotes.filter(note => note.id !== noteId)
            },
            isDeletingNote: false
          };
        });
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete application note';
        set({ noteError: errorMessage, isDeletingNote: false });
        return false;
      }
    },
    
    // Status history
    fetchStatusHistory: async (applicationId) => {
      set({ isLoadingStatusHistory: true, statusHistoryError: null });
      
      try {
        const history = await ApplicationsService.getStatusHistory(applicationId);
        
        set(state => ({
          applicationStatusHistory: {
            ...state.applicationStatusHistory,
            [applicationId]: history
          },
          isLoadingStatusHistory: false
        }));
        
        return history;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch status history';
        set({ statusHistoryError: errorMessage, isLoadingStatusHistory: false });
        return null;
      }
    },
    
    // Bulk operations
    bulkChangeStatus: async (bulkData) => {
      set({ isBulkUpdating: true, bulkUpdateError: null });
      
      try {
        await ApplicationsService.bulkChangeStatus(bulkData);
        
        // Refresh applications list after bulk update
        await get().fetchApplications();
        
        set({ isBulkUpdating: false });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to bulk change status';
        set({ bulkUpdateError: errorMessage, isBulkUpdating: false });
        return false;
      }
    },
    
    bulkUpdateApplications: async (bulkData) => {
      set({ isBulkUpdating: true, bulkUpdateError: null });
      
      try {
        await ApplicationsService.bulkUpdate(bulkData);
        
        // Refresh applications list after bulk update
        await get().fetchApplications();
        
        set({ isBulkUpdating: false });
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update applications';
        set({ bulkUpdateError: errorMessage, isBulkUpdating: false });
        return false;
      }
    },
    
    // Pipeline view
    fetchPipelineView: async (companyId, consultantId) => {
      set({ isLoadingPipeline: true, pipelineError: null });
      
      try {
        const pipeline = await ApplicationsService.getPipelineView(companyId, consultantId);
        
        set({
          pipelineView: pipeline,
          isLoadingPipeline: false
        });
        
        return pipeline;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch pipeline view';
        set({ pipelineError: errorMessage, isLoadingPipeline: false });
        return null;
      }
    },
    
    // Filter related operations
    setFilters: (filters) => {
      set({ activeFilters: filters });
    },
    
    clearFilters: () => {
      set({ activeFilters: {} });
    },
    
    // By relations
    fetchApplicationsByCandidate: async (candidateId, page = 1, pageSize = 20) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await ApplicationsService.getByCandidate(candidateId, page, pageSize);
        
        set({
          applications: response.applications,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Failed to fetch applications for candidate ${candidateId}`;
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchApplicationsByJob: async (jobId, page = 1, pageSize = 20) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await ApplicationsService.getByJob(jobId, page, pageSize);
        
        set({
          applications: response.applications,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Failed to fetch applications for job ${jobId}`;
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchApplicationsByCompany: async (companyId, page = 1, pageSize = 20) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await ApplicationsService.getByCompany(companyId, page, pageSize);
        
        set({
          applications: response.applications,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Failed to fetch applications for company ${companyId}`;
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchApplicationsByConsultant: async (consultantId, page = 1, pageSize = 20) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await ApplicationsService.getByConsultant(consultantId, page, pageSize);
        
        set({
          applications: response.applications,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Failed to fetch applications for consultant ${consultantId}`;
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    // Utility actions
    resetErrors: () => {
      set({
        error: null,
        detailsError: null,
        notesError: null,
        statusHistoryError: null,
        pipelineError: null,
        searchError: null,
        createError: null,
        updateError: null,
        statusChangeError: null,
        interviewScheduleError: null,
        offerError: null,
        noteError: null,
        bulkUpdateError: null
      });
    },
    
    resetState: () => {
      set({
        applications: [],
        applicationDetails: {},
        
        applicationNotes: {},
        applicationStatusHistory: {},
        
        pipelineView: null,
        
        searchResults: null,
        
        activeFilters: {},
        
        isLoading: false,
        isLoadingDetails: false,
        isLoadingNotes: false,
        isLoadingStatusHistory: false,
        isLoadingPipeline: false,
        isLoadingSearch: false,
        isCreating: false,
        isUpdating: false,
        isChangingStatus: false,
        isSchedulingInterview: false,
        isMakingOffer: false,
        isAddingNote: false,
        isUpdatingNote: false,
        isDeletingNote: false,
        isBulkUpdating: false,
        
        error: null,
        detailsError: null,
        notesError: null,
        statusHistoryError: null,
        pipelineError: null,
        searchError: null,
        createError: null,
        updateError: null,
        statusChangeError: null,
        interviewScheduleError: null,
        offerError: null,
        noteError: null,
        bulkUpdateError: null,
        
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
export const selectApplications = (state: ApplicationsStore) => state.applications;
export const selectApplicationDetails = (state: ApplicationsStore) => state.applicationDetails;
export const selectApplicationNotes = (state: ApplicationsStore) => state.applicationNotes;
export const selectApplicationStatusHistory = (state: ApplicationsStore) => state.applicationStatusHistory;
export const selectPipelineView = (state: ApplicationsStore) => state.pipelineView;
export const selectSearchResults = (state: ApplicationsStore) => state.searchResults;
export const selectActiveFilters = (state: ApplicationsStore) => state.activeFilters;

export const selectApplicationsByStatus = (state: ApplicationsStore, status: ApplicationStatus) => 
  state.applications.filter(app => app.status === status);

export const selectIsLoading = (state: ApplicationsStore) => state.isLoading;
export const selectIsLoadingDetails = (state: ApplicationsStore) => state.isLoadingDetails;
export const selectIsLoadingNotes = (state: ApplicationsStore) => state.isLoadingNotes;
export const selectIsLoadingStatusHistory = (state: ApplicationsStore) => state.isLoadingStatusHistory;
export const selectIsLoadingPipeline = (state: ApplicationsStore) => state.isLoadingPipeline;
export const selectIsLoadingSearch = (state: ApplicationsStore) => state.isLoadingSearch;
export const selectIsCreating = (state: ApplicationsStore) => state.isCreating;
export const selectIsUpdating = (state: ApplicationsStore) => state.isUpdating;
export const selectIsChangingStatus = (state: ApplicationsStore) => state.isChangingStatus;
export const selectIsSchedulingInterview = (state: ApplicationsStore) => state.isSchedulingInterview;
export const selectIsMakingOffer = (state: ApplicationsStore) => state.isMakingOffer;
export const selectIsAddingNote = (state: ApplicationsStore) => state.isAddingNote;
export const selectIsUpdatingNote = (state: ApplicationsStore) => state.isUpdatingNote;
export const selectIsDeletingNote = (state: ApplicationsStore) => state.isDeletingNote;
export const selectIsBulkUpdating = (state: ApplicationsStore) => state.isBulkUpdating;

export const selectError = (state: ApplicationsStore) => state.error;
export const selectDetailsError = (state: ApplicationsStore) => state.detailsError;
export const selectNotesError = (state: ApplicationsStore) => state.notesError;
export const selectStatusHistoryError = (state: ApplicationsStore) => state.statusHistoryError;
export const selectPipelineError = (state: ApplicationsStore) => state.pipelineError;
export const selectSearchError = (state: ApplicationsStore) => state.searchError;
export const selectCreateError = (state: ApplicationsStore) => state.createError;
export const selectUpdateError = (state: ApplicationsStore) => state.updateError;
export const selectStatusChangeError = (state: ApplicationsStore) => state.statusChangeError;
export const selectInterviewScheduleError = (state: ApplicationsStore) => state.interviewScheduleError;
export const selectOfferError = (state: ApplicationsStore) => state.offerError;
export const selectNoteError = (state: ApplicationsStore) => state.noteError;
export const selectBulkUpdateError = (state: ApplicationsStore) => state.bulkUpdateError;

export const selectPagination = (state: ApplicationsStore) => ({
  currentPage: state.currentPage,
  totalItems: state.totalItems,
  totalPages: state.totalPages,
  pageSize: state.pageSize
});