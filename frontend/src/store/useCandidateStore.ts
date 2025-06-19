// src/store/useCandidateStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import CandidatesService from '../services/api/candidates-service';
import {
  CandidateProfile,
  Education,
  WorkExperience,
  CandidateSkill,
  CandidateJobPreference,
  CandidateNotificationSettings,
  CreateProfileRequest,
  UpdateProfileRequest,
  CreateEducationRequest,
  UpdateEducationRequest,
  CreateExperienceRequest,
  UpdateExperienceRequest,
  UpdateSkillsRequest,
  UpdatePreferencesRequest,
  UpdateNotificationSettingsRequest,
  MatchingJobsResponse,
  SkillRecommendationsResponse,
  CareerProgression,
  ApplicationAnalytics
} from '../types/candidate';

interface CandidateState {
  // Profile data
  profile: CandidateProfile | null;
  education: Education[];
  experience: WorkExperience[];
  skills: CandidateSkill[];
  preferences: CandidateJobPreference | null;
  notificationSettings: CandidateNotificationSettings | null;
  completionPercentage: number;
  
  // Job matching data
  matchingJobs: MatchingJobsResponse | null;
  skillRecommendations: SkillRecommendationsResponse | null;
  careerProgression: CareerProgression | null;
  applicationAnalytics: ApplicationAnalytics | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingEducation: boolean;
  isLoadingExperience: boolean;
  isLoadingSkills: boolean;
  isLoadingPreferences: boolean;
  isLoadingNotifications: boolean;
  isLoadingMatches: boolean;
  isLoadingRecommendations: boolean;
  isLoadingProgression: boolean;
  isLoadingAnalytics: boolean;
  
  // Error states
  error: string | null;
  profileError: string | null;
  educationError: string | null;
  experienceError: string | null;
  skillsError: string | null;
  preferencesError: string | null;
  notificationsError: string | null;
  matchesError: string | null;
  recommendationsError: string | null;
  progressionError: string | null;
  analyticsError: string | null;
}

interface CandidateActions {
  // Profile actions
  fetchProfile: () => Promise<CandidateProfile | null>;
  createProfile: (data: CreateProfileRequest) => Promise<CandidateProfile | null>;
  updateProfile: (data: UpdateProfileRequest) => Promise<CandidateProfile | null>;
  fetchCompletionPercentage: () => Promise<number>;
  
  // Education actions
  fetchEducation: () => Promise<Education[]>;
  addEducation: (data: CreateEducationRequest) => Promise<Education | null>;
  updateEducation: (id: string, data: UpdateEducationRequest) => Promise<Education | null>;
  deleteEducation: (id: string) => Promise<boolean>;
  
  // Experience actions
  fetchExperience: () => Promise<WorkExperience[]>;
  addExperience: (data: CreateExperienceRequest) => Promise<WorkExperience | null>;
  updateExperience: (id: string, data: UpdateExperienceRequest) => Promise<WorkExperience | null>;
  deleteExperience: (id: string) => Promise<boolean>;
  
  // Skills actions
  fetchSkills: () => Promise<CandidateSkill[]>;
  updateSkills: (data: UpdateSkillsRequest) => Promise<CandidateSkill[] | null>;
  
  // Preferences actions
  fetchPreferences: () => Promise<CandidateJobPreference | null>;
  updatePreferences: (data: UpdatePreferencesRequest) => Promise<CandidateJobPreference | null>;
  
  // Notification settings actions
  fetchNotificationSettings: () => Promise<CandidateNotificationSettings | null>;
  updateNotificationSettings: (data: UpdateNotificationSettingsRequest) => Promise<CandidateNotificationSettings | null>;
  
  // Job matching actions
  fetchMatchingJobs: (limit?: number) => Promise<MatchingJobsResponse | null>;
  fetchSkillRecommendations: (limit?: number) => Promise<SkillRecommendationsResponse | null>;
  fetchCareerProgression: () => Promise<CareerProgression | null>;
  fetchApplicationAnalytics: () => Promise<ApplicationAnalytics | null>;
  
  // Utility actions
  resetErrors: () => void;
  resetState: () => void;
  completeProfile: (data: any) => Promise<CandidateProfile | null>;
}

type CandidateStore = CandidateState & CandidateActions;

export const useCandidateStore = create<CandidateStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    profile: null,
    education: [],
    experience: [],
    skills: [],
    preferences: null,
    notificationSettings: null,
    completionPercentage: 0,
    
    matchingJobs: null,
    skillRecommendations: null,
    careerProgression: null,
    applicationAnalytics: null,
    
    isLoading: false,
    isLoadingProfile: false,
    isLoadingEducation: false,
    isLoadingExperience: false,
    isLoadingSkills: false,
    isLoadingPreferences: false,
    isLoadingNotifications: false,
    isLoadingMatches: false,
    isLoadingRecommendations: false,
    isLoadingProgression: false,
    isLoadingAnalytics: false,
    
    error: null,
    profileError: null,
    educationError: null,
    experienceError: null,
    skillsError: null,
    preferencesError: null,
    notificationsError: null,
    matchesError: null,
    recommendationsError: null,
    progressionError: null,
    analyticsError: null,
    
    // Profile actions
    fetchProfile: async () => {
      set({ isLoadingProfile: true, profileError: null });
      
      try {
        const profile = await CandidatesService.getMyProfile();
        set({ profile, isLoadingProfile: false });
        return profile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
        set({ profileError: errorMessage, isLoadingProfile: false });
        return null;
      }
    },
    
    createProfile: async (data) => {
      set({ isLoadingProfile: true, profileError: null });
      
      try {
        const profile = await CandidatesService.createProfile(data);
        set({ profile, isLoadingProfile: false });
        return profile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create profile';
        set({ profileError: errorMessage, isLoadingProfile: false });
        return null;
      }
    },
    
    updateProfile: async (data) => {
      set({ isLoadingProfile: true, profileError: null });
      
      try {
        const profile = await CandidatesService.updateProfile(data);
        set({ profile, isLoadingProfile: false });
        return profile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
        set({ profileError: errorMessage, isLoadingProfile: false });
        return null;
      }
    },
    
    fetchCompletionPercentage: async () => {
      set({ isLoadingProfile: true, profileError: null });
      
      try {
        const response = await CandidatesService.getProfileCompletionPercentage();
        const percentage = response.completion_percentage;
        set({ completionPercentage: percentage, isLoadingProfile: false });
        return percentage;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch completion percentage';
        set({ profileError: errorMessage, isLoadingProfile: false });
        return 0;
      }
    },
    
    // Education actions
    fetchEducation: async () => {
      set({ isLoadingEducation: true, educationError: null });
      
      try {
        const education = await CandidatesService.getMyEducation();
        set({ education, isLoadingEducation: false });
        return education;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch education';
        set({ educationError: errorMessage, isLoadingEducation: false });
        return [];
      }
    },
    
    addEducation: async (data) => {
      set({ isLoadingEducation: true, educationError: null });
      
      try {
        const newEducation = await CandidatesService.addEducation(data);
        set(state => ({ 
          education: [...state.education, newEducation], 
          isLoadingEducation: false 
        }));
        return newEducation;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add education';
        set({ educationError: errorMessage, isLoadingEducation: false });
        return null;
      }
    },
    
    updateEducation: async (id, data) => {
      set({ isLoadingEducation: true, educationError: null });
      
      try {
        const updatedEducation = await CandidatesService.updateEducation(id, data);
        set(state => ({ 
          education: state.education.map(e => e.id === id ? updatedEducation : e), 
          isLoadingEducation: false 
        }));
        return updatedEducation;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update education';
        set({ educationError: errorMessage, isLoadingEducation: false });
        return null;
      }
    },
    
    deleteEducation: async (id) => {
      set({ isLoadingEducation: true, educationError: null });
      
      try {
        await CandidatesService.deleteEducation(id);
        set(state => ({ 
          education: state.education.filter(e => e.id !== id), 
          isLoadingEducation: false 
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete education';
        set({ educationError: errorMessage, isLoadingEducation: false });
        return false;
      }
    },
    
    // Experience actions
    fetchExperience: async () => {
      set({ isLoadingExperience: true, experienceError: null });
      
      try {
        const experience = await CandidatesService.getMyExperience();
        set({ experience, isLoadingExperience: false });
        return experience;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch experience';
        set({ experienceError: errorMessage, isLoadingExperience: false });
        return [];
      }
    },
    
    addExperience: async (data) => {
      set({ isLoadingExperience: true, experienceError: null });
      
      try {
        const newExperience = await CandidatesService.addExperience(data);
        set(state => ({ 
          experience: [...state.experience, newExperience], 
          isLoadingExperience: false 
        }));
        return newExperience;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add experience';
        set({ experienceError: errorMessage, isLoadingExperience: false });
        return null;
      }
    },
    
    updateExperience: async (id, data) => {
      set({ isLoadingExperience: true, experienceError: null });
      
      try {
        const updatedExperience = await CandidatesService.updateExperience(id, data);
        set(state => ({ 
          experience: state.experience.map(e => e.id === id ? updatedExperience : e), 
          isLoadingExperience: false 
        }));
        return updatedExperience;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update experience';
        set({ experienceError: errorMessage, isLoadingExperience: false });
        return null;
      }
    },
    
    deleteExperience: async (id) => {
      set({ isLoadingExperience: true, experienceError: null });
      
      try {
        await CandidatesService.deleteExperience(id);
        set(state => ({ 
          experience: state.experience.filter(e => e.id !== id), 
          isLoadingExperience: false 
        }));
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete experience';
        set({ experienceError: errorMessage, isLoadingExperience: false });
        return false;
      }
    },
    
    // Skills actions
    fetchSkills: async () => {
      set({ isLoadingSkills: true, skillsError: null });
      
      try {
        const skills = await CandidatesService.getMySkills();
        set({ skills, isLoadingSkills: false });
        return skills;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skills';
        set({ skillsError: errorMessage, isLoadingSkills: false });
        return [];
      }
    },
    
    updateSkills: async (data) => {
      set({ isLoadingSkills: true, skillsError: null });
      
      try {
        const updatedSkills = await CandidatesService.updateSkills(data);
        set({ skills: updatedSkills, isLoadingSkills: false });
        return updatedSkills;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update skills';
        set({ skillsError: errorMessage, isLoadingSkills: false });
        return null;
      }
    },
    
    // Preferences actions
    fetchPreferences: async () => {
      set({ isLoadingPreferences: true, preferencesError: null });
      
      try {
        const preferences = await CandidatesService.getMyPreferences();
        set({ preferences, isLoadingPreferences: false });
        return preferences;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch preferences';
        set({ preferencesError: errorMessage, isLoadingPreferences: false });
        return null;
      }
    },
    
    updatePreferences: async (data) => {
      set({ isLoadingPreferences: true, preferencesError: null });
      
      try {
        const updatedPreferences = await CandidatesService.updatePreferences(data);
        set({ preferences: updatedPreferences, isLoadingPreferences: false });
        return updatedPreferences;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update preferences';
        set({ preferencesError: errorMessage, isLoadingPreferences: false });
        return null;
      }
    },
    
    // Notification settings actions
    fetchNotificationSettings: async () => {
      set({ isLoadingNotifications: true, notificationsError: null });
      
      try {
        const settings = await CandidatesService.getMyNotificationSettings();
        set({ notificationSettings: settings, isLoadingNotifications: false });
        return settings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notification settings';
        set({ notificationsError: errorMessage, isLoadingNotifications: false });
        return null;
      }
    },
    
    updateNotificationSettings: async (data) => {
      set({ isLoadingNotifications: true, notificationsError: null });
      
      try {
        const updatedSettings = await CandidatesService.updateNotificationSettings(data);
        set({ notificationSettings: updatedSettings, isLoadingNotifications: false });
        return updatedSettings;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
        set({ notificationsError: errorMessage, isLoadingNotifications: false });
        return null;
      }
    },
    
    // Job matching actions
    fetchMatchingJobs: async (limit = 10) => {
      set({ isLoadingMatches: true, matchesError: null });
      
      try {
        const matches = await CandidatesService.getMatchingJobs(limit);
        set({ matchingJobs: matches, isLoadingMatches: false });
        return matches;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch matching jobs';
        set({ matchesError: errorMessage, isLoadingMatches: false });
        return null;
      }
    },
    
    fetchSkillRecommendations: async (limit = 10) => {
      set({ isLoadingRecommendations: true, recommendationsError: null });
      
      try {
        const recommendations = await CandidatesService.getSkillRecommendations(limit);
        set({ skillRecommendations: recommendations, isLoadingRecommendations: false });
        return recommendations;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skill recommendations';
        set({ recommendationsError: errorMessage, isLoadingRecommendations: false });
        return null;
      }
    },
    
    fetchCareerProgression: async () => {
      set({ isLoadingProgression: true, progressionError: null });
      
      try {
        const progression = await CandidatesService.getCareerProgression();
        set({ careerProgression: progression, isLoadingProgression: false });
        return progression;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch career progression';
        set({ progressionError: errorMessage, isLoadingProgression: false });
        return null;
      }
    },
    
    fetchApplicationAnalytics: async () => {
      set({ isLoadingAnalytics: true, analyticsError: null });
      
      try {
        const analytics = await CandidatesService.getApplicationAnalytics();
        set({ applicationAnalytics: analytics, isLoadingAnalytics: false });
        return analytics;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch application analytics';
        set({ analyticsError: errorMessage, isLoadingAnalytics: false });
        return null;
      }
    },
    
    // Complete profile in one go
    completeProfile: async (data) => {
      set({ isLoadingProfile: true, profileError: null });
      
      try {
        const profile = await CandidatesService.completeProfile(data);
        
        // Refresh all related data
        const education = await CandidatesService.getMyEducation();
        const experience = await CandidatesService.getMyExperience();
        const skills = await CandidatesService.getMySkills();
        const preferences = await CandidatesService.getMyPreferences().catch(() => null);
        const completion = await CandidatesService.getProfileCompletionPercentage();
        
        set({ 
          profile,
          education,
          experience,
          skills,
          preferences,
          completionPercentage: completion.completion_percentage,
          isLoadingProfile: false 
        });
        
        return profile;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to complete profile';
        set({ profileError: errorMessage, isLoadingProfile: false });
        return null;
      }
    },
    
    // Utility actions
    resetErrors: () => {
      set({
        error: null,
        profileError: null,
        educationError: null,
        experienceError: null,
        skillsError: null,
        preferencesError: null,
        notificationsError: null,
        matchesError: null,
        recommendationsError: null,
        progressionError: null,
        analyticsError: null,
      });
    },
    
    resetState: () => {
      set({
        profile: null,
        education: [],
        experience: [],
        skills: [],
        preferences: null,
        notificationSettings: null,
        completionPercentage: 0,
        
        matchingJobs: null,
        skillRecommendations: null,
        careerProgression: null,
        applicationAnalytics: null,
        
        isLoading: false,
        isLoadingProfile: false,
        isLoadingEducation: false,
        isLoadingExperience: false,
        isLoadingSkills: false,
        isLoadingPreferences: false,
        isLoadingNotifications: false,
        isLoadingMatches: false,
        isLoadingRecommendations: false,
        isLoadingProgression: false,
        isLoadingAnalytics: false,
        
        error: null,
        profileError: null,
        educationError: null,
        experienceError: null,
        skillsError: null,
        preferencesError: null,
        notificationsError: null,
        matchesError: null,
        recommendationsError: null,
        progressionError: null,
        analyticsError: null,
      });
    }
  }))
);

// Create stable selectors for SSR compatibility
export const selectProfile = (state: CandidateStore) => state.profile;
export const selectEducation = (state: CandidateStore) => state.education;
export const selectExperience = (state: CandidateStore) => state.experience;
export const selectSkills = (state: CandidateStore) => state.skills;
export const selectPreferences = (state: CandidateStore) => state.preferences;
export const selectNotificationSettings = (state: CandidateStore) => state.notificationSettings;
export const selectCompletionPercentage = (state: CandidateStore) => state.completionPercentage;
export const selectMatchingJobs = (state: CandidateStore) => state.matchingJobs;
export const selectSkillRecommendations = (state: CandidateStore) => state.skillRecommendations;
export const selectCareerProgression = (state: CandidateStore) => state.careerProgression;
export const selectApplicationAnalytics = (state: CandidateStore) => state.applicationAnalytics;

export const selectIsLoadingProfile = (state: CandidateStore) => state.isLoadingProfile;
export const selectIsLoadingEducation = (state: CandidateStore) => state.isLoadingEducation;
export const selectIsLoadingExperience = (state: CandidateStore) => state.isLoadingExperience;
export const selectIsLoadingSkills = (state: CandidateStore) => state.isLoadingSkills;
export const selectIsLoadingPreferences = (state: CandidateStore) => state.isLoadingPreferences;
export const selectIsLoadingNotifications = (state: CandidateStore) => state.isLoadingNotifications;
export const selectIsLoadingMatches = (state: CandidateStore) => state.isLoadingMatches;
export const selectIsLoadingRecommendations = (state: CandidateStore) => state.isLoadingRecommendations;
export const selectIsLoadingProgression = (state: CandidateStore) => state.isLoadingProgression;
export const selectIsLoadingAnalytics = (state: CandidateStore) => state.isLoadingAnalytics;

export const selectProfileError = (state: CandidateStore) => state.profileError;
export const selectEducationError = (state: CandidateStore) => state.educationError;
export const selectExperienceError = (state: CandidateStore) => state.experienceError;
export const selectSkillsError = (state: CandidateStore) => state.skillsError;
export const selectPreferencesError = (state: CandidateStore) => state.preferencesError;
export const selectNotificationsError = (state: CandidateStore) => state.notificationsError;
export const selectMatchesError = (state: CandidateStore) => state.matchesError;
export const selectRecommendationsError = (state: CandidateStore) => state.recommendationsError;
export const selectProgressionError = (state: CandidateStore) => state.progressionError;
export const selectAnalyticsError = (state: CandidateStore) => state.analyticsError;