// src/services/api/skills-service.ts
import apiClient from './axios-client';
import {
  Skill,
  SkillWithCategory,
  CreateSkillRequest,
  UpdateSkillRequest,
  SkillSearchFilters,
  SkillListResponse
} from '../../types/skill';

// Service for skill-related API endpoints
export const SkillsService = {
  // Basic skill operations
  async getAllSkills(
    page: number = 1, 
    limit: number = 20,
    query?: string,
    category_id?: string,
    sort_by: string = 'name',
    sort_order: string = 'asc'
  ): Promise<SkillListResponse> {
    let url = `/skills?page=${page}&page_size=${limit}&sort_by=${sort_by}&sort_order=${sort_order}`;
    
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (category_id) url += `&category_id=${category_id}`;
    
    return await apiClient.get(url);
  },
  
  async getSkillById(id: string): Promise<SkillWithCategory> {
    return await apiClient.get(`/skills/${id}`);
  },
  
  async createSkill(data: CreateSkillRequest): Promise<Skill> {
    return await apiClient.post('/skills', data);
  },
  
  async updateSkill(id: string, data: UpdateSkillRequest): Promise<Skill> {
    return await apiClient.put(`/skills/${id}`, data);
  },
  
  async deleteSkill(id: string): Promise<{ message: string }> {
    return await apiClient.delete(`/skills/${id}`);
  },
  
  async searchSkills(filters: SkillSearchFilters): Promise<SkillListResponse> {
    // Build query string
    let queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('q', filters.search);
    if (filters.category) queryParams.append('category_id', filters.category);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.page_size) queryParams.append('page_size', filters.page_size.toString());
    
    return await apiClient.get(`/skills?${queryParams.toString()}`);
  },
  
  // Categories
  async getSkillCategories(): Promise<any> {
    return await apiClient.get('/skills/categories');
  },
  
  async getCategoryById(id: string): Promise<any> {
    return await apiClient.get(`/skills/categories/${id}`);
  },
  
  // Advanced features
  async getTrendingSkills(
    time_period: string = 'month',
    limit: number = 10,
    category_id?: string
  ): Promise<any> {
    let url = `/skills/trending?time_period=${time_period}&limit=${limit}`;
    if (category_id) url += `&category_id=${category_id}`;
    
    return await apiClient.get(url);
  },
  
  async getSkillRecommendations(
    user_id?: string,
    job_id?: string,
    limit: number = 5
  ): Promise<any> {
    let url = `/skills/recommendations?limit=${limit}`;
    
    if (user_id) url += `&user_id=${user_id}`;
    if (job_id) url += `&job_id=${job_id}`;
    
    return await apiClient.get(url);
  },
  
  async performSkillGapAnalysis(
    candidate_id: string,
    job_id?: string
  ): Promise<any> {
    let url = `/skills/gap-analysis?candidate_id=${candidate_id}`;
    if (job_id) url += `&job_id=${job_id}`;
    
    return await apiClient.get(url);
  },
  
  async getSkillMarketInsights(
    skill_ids?: string[],
    location?: string,
    time_period: string = 'quarter'
  ): Promise<any> {
    let url = `/skills/market-insights?time_period=${time_period}`;
    
    if (location) url += `&location=${encodeURIComponent(location)}`;
    if (skill_ids && skill_ids.length > 0) {
      skill_ids.forEach(id => {
        url += `&skill_ids=${id}`;
      });
    }
    
    return await apiClient.get(url);
  },
  
  async getSkillAutocomplete(
    query: string,
    limit: number = 10,
    category_id?: string
  ): Promise<{ suggestions: Skill[] }> {
    let url = `/skills/search/autocomplete?q=${encodeURIComponent(query)}&limit=${limit}`;
    if (category_id) url += `&category_id=${category_id}`;
    
    return await apiClient.get(url);
  },
  
  // Bulk operations (admin only)
  async bulkImportSkills(skills: CreateSkillRequest[]): Promise<any> {
    return await apiClient.post('/skills/bulk-import', skills);
  }
};

export default SkillsService;