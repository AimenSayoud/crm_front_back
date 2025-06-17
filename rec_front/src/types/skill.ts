// src/types/skill.ts

export interface Skill {
  id: string;
  name: string;
  category?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillWithCategory extends Skill {
  category_details?: SkillCategory;
}

export interface CreateSkillRequest {
  name: string;
  category?: string;
  description?: string;
}

export interface UpdateSkillRequest {
  name?: string;
  category?: string;
  description?: string;
}

export interface SkillSearchFilters {
  search?: string;
  category?: string;
  page?: number;
  page_size?: number;
}

export interface SkillListResponse {
  skills: Skill[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}