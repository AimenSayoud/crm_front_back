// src/services/api/users-service.ts
import { User } from '@/types';
import { fetcher } from './http-client';
import { PaginatedResponse } from './types';

export const usersService = {
  getAll: async (officeId?: string, role?: string, search?: string, active?: boolean, page = 1, limit = 50) => {
    try {
      let endpoint = '/api/v1/users?';
      
      if (officeId) endpoint += `office_id=${officeId}&`;
      if (role) endpoint += `role=${role}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      if (active !== undefined) endpoint += `active=${active}&`;
      
      endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
      
      const response = await fetcher<PaginatedResponse<User>>(endpoint);
      
      // Ensure all date fields are properly converted to Date objects
      const users = response.items.map(user => ({
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt),
        lastLogin: user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : undefined,
      }));
      
      return {
        items: users,
        totalCount: response.totalCount,
        page: response.page,
        pageSize: response.pageSize,
        pageCount: response.pageCount
      };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },
    
  getById: async (id: string) => {
    try {
      const user = await fetcher<User>(`/api/v1/users/${id}`);
      
      return {
        ...user,
        createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt),
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(user.updatedAt),
        lastLogin: user.lastLogin ? (user.lastLogin instanceof Date ? user.lastLogin : new Date(user.lastLogin)) : undefined,
      };
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  },
  
  login: async (email: string, password: string) => {
    try {
      const response = await fetcher<{
        user: User,
        token: string,
        tokenExpiry: number
      }>('/api/v1/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_expiry', response.tokenExpiry.toString());
      }
      
      return {
        user: {
          ...response.user,
          createdAt: response.user.createdAt instanceof Date ? response.user.createdAt : new Date(response.user.createdAt),
          updatedAt: response.user.updatedAt instanceof Date ? response.user.updatedAt : new Date(response.user.updatedAt),
          lastLogin: response.user.lastLogin ? (response.user.lastLogin instanceof Date ? response.user.lastLogin : new Date(response.user.lastLogin)) : undefined,
        },
        token: response.token,
        tokenExpiry: response.tokenExpiry
      };
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expiry');
    }
    return Promise.resolve(true);
  }
};

export default usersService;