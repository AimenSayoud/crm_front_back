// src/services/api/candidates-service.ts
import apiClient from './axios-client';
import {
  CandidateProfile,
  CandidateFullProfile,
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
  CandidateSearchFilters,
  CandidateListResponse,
  MatchingJobsResponse,
  SkillRecommendationsResponse,
  CareerProgression,
  ApplicationAnalytics
} from '../../types/candidate';

// Service for candidate-related API endpoints
export const CandidatesService = {
  // Profile endpoints
  async getMyProfile(): Promise<CandidateProfile> {
    return await apiClient.get('/candidates/me');
  },

  async createProfile(data: CreateProfileRequest): Promise<CandidateProfile> {
    return await apiClient.post('/candidates/me', data);
  },

  async updateProfile(data: UpdateProfileRequest): Promise<CandidateProfile> {
    return await apiClient.put('/candidates/me', data);
  },

  async getProfileCompletionPercentage(): Promise<{ completion_percentage: number }> {
    return await apiClient.get('/candidates/me/completion-percentage');
  },

  async completeProfile(data: any): Promise<CandidateProfile> {
    return await apiClient.post('/candidates/me/complete-profile', data);
  },

  // Education endpoints
  async getMyEducation(): Promise<Education[]> {
    return await apiClient.get('/candidates/me/education');
  },

  async addEducation(data: CreateEducationRequest): Promise<Education> {
    return await apiClient.post('/candidates/me/education', data);
  },

  async updateEducation(id: string, data: UpdateEducationRequest): Promise<Education> {
    return await apiClient.put(`/candidates/me/education/${id}`, data);
  },

  async deleteEducation(id: string): Promise<{ message: string }> {
    return await apiClient.delete(`/candidates/me/education/${id}`);
  },

  // Work Experience endpoints
  async getMyExperience(): Promise<WorkExperience[]> {
    return await apiClient.get('/candidates/me/experience');
  },

  async addExperience(data: CreateExperienceRequest): Promise<WorkExperience> {
    return await apiClient.post('/candidates/me/experience', data);
  },

  async updateExperience(id: string, data: UpdateExperienceRequest): Promise<WorkExperience> {
    return await apiClient.put(`/candidates/me/experience/${id}`, data);
  },

  async deleteExperience(id: string): Promise<{ message: string }> {
    return await apiClient.delete(`/candidates/me/experience/${id}`);
  },

  // Skills endpoints
  async getMySkills(): Promise<CandidateSkill[]> {
    return await apiClient.get('/candidates/me/skills');
  },

  async updateSkills(data: UpdateSkillsRequest): Promise<CandidateSkill[]> {
    return await apiClient.put('/candidates/me/skills', data.skills);
  },

  // Job Preferences endpoints
  async getMyPreferences(): Promise<CandidateJobPreference> {
    return await apiClient.get('/candidates/me/preferences');
  },

  async updatePreferences(data: UpdatePreferencesRequest): Promise<CandidateJobPreference> {
    return await apiClient.put('/candidates/me/preferences', data);
  },

  // Notification Settings endpoints
  async getMyNotificationSettings(): Promise<CandidateNotificationSettings> {
    return await apiClient.get('/candidates/me/notification-settings');
  },

  async updateNotificationSettings(data: UpdateNotificationSettingsRequest): Promise<CandidateNotificationSettings> {
    return await apiClient.put('/candidates/me/notification-settings', data);
  },

  // Job Matching endpoints
  async getMatchingJobs(limit: number = 10): Promise<MatchingJobsResponse> {
    return await apiClient.get(`/candidates/me/matching-jobs?limit=${limit}`);
  },

  async getSkillRecommendations(limit: number = 10): Promise<SkillRecommendationsResponse> {
    return await apiClient.get(`/candidates/me/skill-recommendations?limit=${limit}`);
  },

  async getCareerProgression(): Promise<CareerProgression> {
    return await apiClient.get('/candidates/me/career-progression');
  },

  async getApplicationAnalytics(): Promise<ApplicationAnalytics> {
    return await apiClient.get('/candidates/me/application-analytics');
  },

  // Search endpoints (for admin/consultant users)
  async searchCandidates(filters: CandidateSearchFilters): Promise<CandidateListResponse> {
    return await apiClient.post('/candidates/search', filters);
  },

  async getCandidateById(id: string): Promise<CandidateFullProfile> {
    return await apiClient.get(`/candidates/${id}`);
  }
};

export default CandidatesService;