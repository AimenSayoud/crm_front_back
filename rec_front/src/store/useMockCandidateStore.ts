// Example: Mock-enabled candidate store for frontend development
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { mockServices, USE_MOCK_DATA, logMockUsage } from './mockHelpers';
import CandidatesService from '../services/api/candidates-service';
import {
  CandidateProfile,
  Education,
  WorkExperience,
  CandidateSkill,
  CandidateJobPreference,
} from '../types/candidate';

interface MockCandidateState {
  // Profile data
  candidates: CandidateProfile[];
  selectedCandidate: CandidateProfile | null;
  candidateEducation: Record<string, Education[]>;
  candidateExperience: Record<string, WorkExperience[]>;
  candidateSkills: Record<string, CandidateSkill[]>;
  candidatePreferences: Record<string, CandidateJobPreference>;
  
  // Loading states
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingEducation: boolean;
  isLoadingExperience: boolean;
  isLoadingSkills: boolean;
  
  // Error states
  error: string | null;
  profileError: string | null;
  educationError: string | null;
  experienceError: string | null;
  skillsError: string | null;
}

interface MockCandidateActions {
  // Fetch actions
  fetchCandidates: (params?: any) => Promise<CandidateProfile[]>;
  fetchCandidateById: (id: string) => Promise<CandidateProfile | null>;
  fetchCandidateEducation: (candidateId: string) => Promise<Education[]>;
  fetchCandidateExperience: (candidateId: string) => Promise<WorkExperience[]>;
  fetchCandidateSkills: (candidateId: string) => Promise<CandidateSkill[]>;
  
  // Utility actions
  resetErrors: () => void;
  resetState: () => void;
  setSelectedCandidate: (candidate: CandidateProfile | null) => void;
}

type MockCandidateStore = MockCandidateState & MockCandidateActions;

export const useMockCandidateStore = create<MockCandidateStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    candidates: [],
    selectedCandidate: null,
    candidateEducation: {},
    candidateExperience: {},
    candidateSkills: {},
    candidatePreferences: {},
    
    isLoading: false,
    isLoadingProfile: false,
    isLoadingEducation: false,
    isLoadingExperience: false,
    isLoadingSkills: false,
    
    error: null,
    profileError: null,
    educationError: null,
    experienceError: null,
    skillsError: null,
    
    // Actions
    fetchCandidates: async (params = {}) => {
      set({ isLoading: true, error: null });
      logMockUsage('candidates', 'fetchCandidates');
      
      try {
        const candidates = USE_MOCK_DATA 
          ? await mockServices.candidates.getAll(params)
          : await CandidatesService.getAll(params);
        
        set({ candidates, isLoading: false });
        return candidates;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch candidates';
        set({ error: errorMessage, isLoading: false });
        return [];
      }
    },
    
    fetchCandidateById: async (id: string) => {
      set({ isLoadingProfile: true, profileError: null });
      logMockUsage('candidates', 'fetchCandidateById');
      
      try {
        const candidate = USE_MOCK_DATA 
          ? await mockServices.candidates.getById(id)
          : await CandidatesService.getById(id);
        
        set({ selectedCandidate: candidate, isLoadingProfile: false });
        return candidate;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch candidate';
        set({ profileError: errorMessage, isLoadingProfile: false });
        return null;
      }
    },
    
    fetchCandidateEducation: async (candidateId: string) => {
      set({ isLoadingEducation: true, educationError: null });
      logMockUsage('candidates', 'fetchCandidateEducation');
      
      try {
        const education = USE_MOCK_DATA 
          ? await mockServices.candidates.getEducation(candidateId)
          : await CandidatesService.getEducation(candidateId);
        
        set(state => ({
          candidateEducation: {
            ...state.candidateEducation,
            [candidateId]: education
          },
          isLoadingEducation: false
        }));
        
        return education;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch education';
        set({ educationError: errorMessage, isLoadingEducation: false });
        return [];
      }
    },
    
    fetchCandidateExperience: async (candidateId: string) => {
      set({ isLoadingExperience: true, experienceError: null });
      logMockUsage('candidates', 'fetchCandidateExperience');
      
      try {
        const experience = USE_MOCK_DATA 
          ? await mockServices.candidates.getExperience(candidateId)
          : await CandidatesService.getExperience(candidateId);
        
        set(state => ({
          candidateExperience: {
            ...state.candidateExperience,
            [candidateId]: experience
          },
          isLoadingExperience: false
        }));
        
        return experience;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch experience';
        set({ experienceError: errorMessage, isLoadingExperience: false });
        return [];
      }
    },
    
    fetchCandidateSkills: async (candidateId: string) => {
      set({ isLoadingSkills: true, skillsError: null });
      logMockUsage('candidates', 'fetchCandidateSkills');
      
      try {
        const skills = USE_MOCK_DATA 
          ? await mockServices.candidates.getSkills(candidateId)
          : await CandidatesService.getSkills(candidateId);
        
        set(state => ({
          candidateSkills: {
            ...state.candidateSkills,
            [candidateId]: skills
          },
          isLoadingSkills: false
        }));
        
        return skills;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skills';
        set({ skillsError: errorMessage, isLoadingSkills: false });
        return [];
      }
    },
    
    // Utility actions
    resetErrors: () => {
      set({
        error: null,
        profileError: null,
        educationError: null,
        experienceError: null,
        skillsError: null
      });
    },
    
    resetState: () => {
      set({
        candidates: [],
        selectedCandidate: null,
        candidateEducation: {},
        candidateExperience: {},
        candidateSkills: {},
        candidatePreferences: {},
        isLoading: false,
        isLoadingProfile: false,
        isLoadingEducation: false,
        isLoadingExperience: false,
        isLoadingSkills: false,
        error: null,
        profileError: null,
        educationError: null,
        experienceError: null,
        skillsError: null
      });
    },
    
    setSelectedCandidate: (candidate: CandidateProfile | null) => {
      set({ selectedCandidate: candidate });
    }
  }))
);

// Selectors
export const selectMockCandidates = (state: MockCandidateStore) => state.candidates;
export const selectMockSelectedCandidate = (state: MockCandidateStore) => state.selectedCandidate;
export const selectMockCandidateEducation = (state: MockCandidateStore) => state.candidateEducation;
export const selectMockCandidateExperience = (state: MockCandidateStore) => state.candidateExperience;
export const selectMockCandidateSkills = (state: MockCandidateStore) => state.candidateSkills;
export const selectMockIsLoading = (state: MockCandidateStore) => state.isLoading;
export const selectMockIsLoadingProfile = (state: MockCandidateStore) => state.isLoadingProfile;
export const selectMockError = (state: MockCandidateStore) => state.error; 