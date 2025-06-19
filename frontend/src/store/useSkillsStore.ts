// src/store/useSkillsStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import SkillsService from '../services/api/skills-service';
import {
  Skill,
  SkillWithCategory,
  CreateSkillRequest,
  UpdateSkillRequest,
  SkillSearchFilters,
  SkillListResponse
} from '../types/skill';

// Types for skill insights and analytics
interface SkillStats {
  skill_id: string;
  name: string;
  count: number;
  change_percentage: number;
  avg_salary: number;
  demand_level: string;
}

interface SkillGapAnalysis {
  matching_skills: Array<{skill_id: string; name: string; level: number}>;
  missing_skills: Array<{skill_id: string; name: string; required_level: number}>;
  gap_score: number;
  recommendations: string[];
}

interface SkillMarketInsight {
  skill_id: string;
  name: string;
  demand_trend: string;
  salary_range: {min: number; max: number; avg: number};
  top_companies: string[];
  top_locations: string[];
  growth_rate: number;
}

// State interface
interface SkillsState {
  // Basic skill data
  skills: Skill[];
  skillDetails: Record<string, SkillWithCategory>;
  categories: any[];
  categoryDetails: Record<string, any>;
  
  // Search results
  searchResults: SkillListResponse | null;
  autocompleteSuggestions: Skill[];
  
  // Advanced features data
  trendingSkills: SkillStats[];
  skillRecommendations: any;
  skillGapAnalysis: SkillGapAnalysis | null;
  marketInsights: Record<string, SkillMarketInsight>;
  
  // Loading states
  isLoading: boolean;
  isLoadingDetails: boolean;
  isLoadingCategories: boolean;
  isLoadingSearch: boolean;
  isLoadingAutocomplete: boolean;
  isLoadingTrending: boolean;
  isLoadingRecommendations: boolean;
  isLoadingGapAnalysis: boolean;
  isLoadingMarketInsights: boolean;
  
  // Error states
  error: string | null;
  detailsError: string | null;
  categoriesError: string | null;
  searchError: string | null;
  autocompleteError: string | null;
  trendingError: string | null;
  recommendationsError: string | null;
  gapAnalysisError: string | null;
  marketInsightsError: string | null;
  
  // Pagination
  currentPage: number;
  totalItems: number;
  totalPages: number;
  pageSize: number;
}

// Actions interface
interface SkillsActions {
  // Basic operations
  fetchSkills: (page?: number, limit?: number, query?: string, categoryId?: string) => Promise<SkillListResponse | null>;
  fetchSkillById: (id: string) => Promise<SkillWithCategory | null>;
  createSkill: (data: CreateSkillRequest) => Promise<Skill | null>;
  updateSkill: (id: string, data: UpdateSkillRequest) => Promise<Skill | null>;
  deleteSkill: (id: string) => Promise<boolean>;
  
  // Search and filters
  searchSkills: (filters: SkillSearchFilters) => Promise<SkillListResponse | null>;
  fetchAutocomplete: (query: string, limit?: number, categoryId?: string) => Promise<Skill[]>;
  
  // Categories
  fetchCategories: () => Promise<any[]>;
  fetchCategoryById: (id: string) => Promise<any | null>;
  
  // Advanced features
  fetchTrendingSkills: (timePeriod?: string, limit?: number, categoryId?: string) => Promise<SkillStats[]>;
  fetchSkillRecommendations: (userId?: string, jobId?: string, limit?: number) => Promise<any>;
  fetchSkillGapAnalysis: (candidateId: string, jobId?: string) => Promise<SkillGapAnalysis | null>;
  fetchSkillMarketInsights: (skillIds?: string[], location?: string, timePeriod?: string) => Promise<Record<string, SkillMarketInsight>>;
  
  // Admin operations
  bulkImportSkills: (skills: CreateSkillRequest[]) => Promise<any>;
  
  // Utility actions
  resetErrors: () => void;
  resetState: () => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

// Combined store type
type SkillsStore = SkillsState & SkillsActions;

// Create the store
export const useSkillsStore = create<SkillsStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    skills: [],
    skillDetails: {},
    categories: [],
    categoryDetails: {},
    
    searchResults: null,
    autocompleteSuggestions: [],
    
    trendingSkills: [],
    skillRecommendations: null,
    skillGapAnalysis: null,
    marketInsights: {},
    
    isLoading: false,
    isLoadingDetails: false,
    isLoadingCategories: false,
    isLoadingSearch: false,
    isLoadingAutocomplete: false,
    isLoadingTrending: false,
    isLoadingRecommendations: false,
    isLoadingGapAnalysis: false,
    isLoadingMarketInsights: false,
    
    error: null,
    detailsError: null,
    categoriesError: null,
    searchError: null,
    autocompleteError: null,
    trendingError: null,
    recommendationsError: null,
    gapAnalysisError: null,
    marketInsightsError: null,
    
    currentPage: 1,
    totalItems: 0,
    totalPages: 0,
    pageSize: 20,
    
    // Basic operations
    fetchSkills: async (page = 1, limit = 20, query, categoryId) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await SkillsService.getAllSkills(
          page,
          limit,
          query,
          categoryId
        );
        
        set({
          skills: response.skills,
          currentPage: response.page,
          totalItems: response.total,
          totalPages: response.total_pages,
          pageSize: response.page_size,
          isLoading: false
        });
        
        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skills';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    fetchSkillById: async (id) => {
      set({ isLoadingDetails: true, detailsError: null });
      
      try {
        const skill = await SkillsService.getSkillById(id);
        
        set(state => ({
          skillDetails: {
            ...state.skillDetails,
            [id]: skill
          },
          isLoadingDetails: false
        }));
        
        return skill;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skill details';
        set({ detailsError: errorMessage, isLoadingDetails: false });
        return null;
      }
    },
    
    createSkill: async (data) => {
      set({ isLoading: true, error: null });
      
      try {
        const newSkill = await SkillsService.createSkill(data);
        
        set(state => ({
          skills: [...state.skills, newSkill],
          isLoading: false
        }));
        
        return newSkill;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create skill';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    updateSkill: async (id, data) => {
      set({ isLoading: true, error: null });
      
      try {
        const updatedSkill = await SkillsService.updateSkill(id, data);
        
        set(state => ({
          skills: state.skills.map(skill => skill.id === id ? updatedSkill : skill),
          skillDetails: {
            ...state.skillDetails,
            [id]: {
              ...state.skillDetails[id],
              ...updatedSkill
            }
          },
          isLoading: false
        }));
        
        return updatedSkill;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update skill';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    deleteSkill: async (id) => {
      set({ isLoading: true, error: null });
      
      try {
        await SkillsService.deleteSkill(id);
        
        set(state => ({
          skills: state.skills.filter(skill => skill.id !== id),
          skillDetails: {
            ...state.skillDetails,
            [id]: undefined
          },
          isLoading: false
        }));
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete skill';
        set({ error: errorMessage, isLoading: false });
        return false;
      }
    },
    
    // Search and filters
    searchSkills: async (filters) => {
      set({ isLoadingSearch: true, searchError: null });
      
      try {
        const results = await SkillsService.searchSkills(filters);
        
        set({
          searchResults: results,
          isLoadingSearch: false
        });
        
        return results;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to search skills';
        set({ searchError: errorMessage, isLoadingSearch: false });
        return null;
      }
    },
    
    fetchAutocomplete: async (query, limit = 10, categoryId) => {
      set({ isLoadingAutocomplete: true, autocompleteError: null });
      
      try {
        const results = await SkillsService.getSkillAutocomplete(query, limit, categoryId);
        
        set({
          autocompleteSuggestions: results.suggestions,
          isLoadingAutocomplete: false
        });
        
        return results.suggestions;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch autocomplete suggestions';
        set({ autocompleteError: errorMessage, isLoadingAutocomplete: false });
        return [];
      }
    },
    
    // Categories
    fetchCategories: async () => {
      set({ isLoadingCategories: true, categoriesError: null });
      
      try {
        const response = await SkillsService.getSkillCategories();
        
        set({
          categories: response.categories || response.items,
          isLoadingCategories: false
        });
        
        return response.categories || response.items;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skill categories';
        set({ categoriesError: errorMessage, isLoadingCategories: false });
        return [];
      }
    },
    
    fetchCategoryById: async (id) => {
      set({ isLoadingCategories: true, categoriesError: null });
      
      try {
        const category = await SkillsService.getCategoryById(id);
        
        set(state => ({
          categoryDetails: {
            ...state.categoryDetails,
            [id]: category
          },
          isLoadingCategories: false
        }));
        
        return category;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch category details';
        set({ categoriesError: errorMessage, isLoadingCategories: false });
        return null;
      }
    },
    
    // Advanced features
    fetchTrendingSkills: async (timePeriod = 'month', limit = 10, categoryId) => {
      set({ isLoadingTrending: true, trendingError: null });
      
      try {
        const trends = await SkillsService.getTrendingSkills(timePeriod, limit, categoryId);
        
        set({
          trendingSkills: trends,
          isLoadingTrending: false
        });
        
        return trends;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch trending skills';
        set({ trendingError: errorMessage, isLoadingTrending: false });
        return [];
      }
    },
    
    fetchSkillRecommendations: async (userId, jobId, limit = 5) => {
      set({ isLoadingRecommendations: true, recommendationsError: null });
      
      try {
        const recommendations = await SkillsService.getSkillRecommendations(userId, jobId, limit);
        
        set({
          skillRecommendations: recommendations,
          isLoadingRecommendations: false
        });
        
        return recommendations;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skill recommendations';
        set({ recommendationsError: errorMessage, isLoadingRecommendations: false });
        return null;
      }
    },
    
    fetchSkillGapAnalysis: async (candidateId, jobId) => {
      set({ isLoadingGapAnalysis: true, gapAnalysisError: null });
      
      try {
        const analysis = await SkillsService.performSkillGapAnalysis(candidateId, jobId);
        
        set({
          skillGapAnalysis: analysis,
          isLoadingGapAnalysis: false
        });
        
        return analysis;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to perform skill gap analysis';
        set({ gapAnalysisError: errorMessage, isLoadingGapAnalysis: false });
        return null;
      }
    },
    
    fetchSkillMarketInsights: async (skillIds, location, timePeriod = 'quarter') => {
      set({ isLoadingMarketInsights: true, marketInsightsError: null });
      
      try {
        const insights = await SkillsService.getSkillMarketInsights(skillIds, location, timePeriod);
        
        set({
          marketInsights: insights,
          isLoadingMarketInsights: false
        });
        
        return insights;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch skill market insights';
        set({ marketInsightsError: errorMessage, isLoadingMarketInsights: false });
        return {};
      }
    },
    
    // Admin operations
    bulkImportSkills: async (skills) => {
      set({ isLoading: true, error: null });
      
      try {
        const result = await SkillsService.bulkImportSkills(skills);
        
        // Refresh skills list after bulk import
        await get().fetchSkills();
        
        set({ isLoading: false });
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to bulk import skills';
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },
    
    // Utility actions
    resetErrors: () => {
      set({
        error: null,
        detailsError: null,
        categoriesError: null,
        searchError: null,
        autocompleteError: null,
        trendingError: null,
        recommendationsError: null,
        gapAnalysisError: null,
        marketInsightsError: null
      });
    },
    
    resetState: () => {
      set({
        skills: [],
        skillDetails: {},
        categories: [],
        categoryDetails: {},
        
        searchResults: null,
        autocompleteSuggestions: [],
        
        trendingSkills: [],
        skillRecommendations: null,
        skillGapAnalysis: null,
        marketInsights: {},
        
        isLoading: false,
        isLoadingDetails: false,
        isLoadingCategories: false,
        isLoadingSearch: false,
        isLoadingAutocomplete: false,
        isLoadingTrending: false,
        isLoadingRecommendations: false,
        isLoadingGapAnalysis: false,
        isLoadingMarketInsights: false,
        
        error: null,
        detailsError: null,
        categoriesError: null,
        searchError: null,
        autocompleteError: null,
        trendingError: null,
        recommendationsError: null,
        gapAnalysisError: null,
        marketInsightsError: null,
        
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
export const selectSkills = (state: SkillsStore) => state.skills;
export const selectSkillDetails = (state: SkillsStore) => state.skillDetails;
export const selectCategories = (state: SkillsStore) => state.categories;
export const selectCategoryDetails = (state: SkillsStore) => state.categoryDetails;
export const selectSearchResults = (state: SkillsStore) => state.searchResults;
export const selectAutocompleteSuggestions = (state: SkillsStore) => state.autocompleteSuggestions;
export const selectTrendingSkills = (state: SkillsStore) => state.trendingSkills;
export const selectSkillRecommendations = (state: SkillsStore) => state.skillRecommendations;
export const selectSkillGapAnalysis = (state: SkillsStore) => state.skillGapAnalysis;
export const selectMarketInsights = (state: SkillsStore) => state.marketInsights;

export const selectIsLoading = (state: SkillsStore) => state.isLoading;
export const selectIsLoadingDetails = (state: SkillsStore) => state.isLoadingDetails;
export const selectIsLoadingCategories = (state: SkillsStore) => state.isLoadingCategories;
export const selectIsLoadingSearch = (state: SkillsStore) => state.isLoadingSearch;
export const selectIsLoadingAutocomplete = (state: SkillsStore) => state.isLoadingAutocomplete;
export const selectIsLoadingTrending = (state: SkillsStore) => state.isLoadingTrending;
export const selectIsLoadingRecommendations = (state: SkillsStore) => state.isLoadingRecommendations;
export const selectIsLoadingGapAnalysis = (state: SkillsStore) => state.isLoadingGapAnalysis;
export const selectIsLoadingMarketInsights = (state: SkillsStore) => state.isLoadingMarketInsights;

export const selectError = (state: SkillsStore) => state.error;
export const selectDetailsError = (state: SkillsStore) => state.detailsError;
export const selectCategoriesError = (state: SkillsStore) => state.categoriesError;
export const selectSearchError = (state: SkillsStore) => state.searchError;
export const selectAutocompleteError = (state: SkillsStore) => state.autocompleteError;
export const selectTrendingError = (state: SkillsStore) => state.trendingError;
export const selectRecommendationsError = (state: SkillsStore) => state.recommendationsError;
export const selectGapAnalysisError = (state: SkillsStore) => state.gapAnalysisError;
export const selectMarketInsightsError = (state: SkillsStore) => state.marketInsightsError;

export const selectPagination = (state: SkillsStore) => ({
  currentPage: state.currentPage,
  totalItems: state.totalItems,
  totalPages: state.totalPages,
  pageSize: state.pageSize
});