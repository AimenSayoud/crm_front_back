// src/services/api/users-service.ts
import { User } from '@/types';
import { fetcher } from './http-client';
import { PaginatedResponse } from './types';

// Backend user format from MongoDB
interface BackendUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  officeId?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export const usersService = {
  getAll: async (officeId?: string, role?: string, search?: string, active?: boolean, page = 1, limit = 50) => {
    try {
      let endpoint = '/api/v1/users?';
      
      if (officeId) endpoint += `office_id=${officeId}&`;
      if (role) endpoint += `role=${role}&`;
      if (search) endpoint += `search=${encodeURIComponent(search)}&`;
      if (active !== undefined) endpoint += `active=${active}&`;
      
      endpoint += `skip=${(page - 1) * limit}&limit=${limit}`;
      
      const response = await fetcher<{data: BackendUser[], meta: {total: number, page: number, limit: number, pages: number}}>(endpoint);
      
      // Transform backend data to match frontend interface
      const users = response.data.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        officeId: user.officeId || '1', // Default office if not set
        createdAt: user.created_at instanceof Date ? user.created_at : new Date(user.created_at),
        updatedAt: user.updated_at instanceof Date ? user.updated_at : new Date(user.updated_at),
        lastLogin: user.last_login ? (user.last_login instanceof Date ? user.last_login : new Date(user.last_login)) : undefined,
      }));
      
      return {
        items: users,
        totalCount: response.meta.total,
        page: response.meta.page,
        pageSize: response.meta.limit,
        pageCount: response.meta.pages
      };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },
    
  getById: async (id: string) => {
    try {
      const response = await fetcher<{data: {user: BackendUser}}>(`/api/v1/users/${id}`);
      const user = response.data.user;
      
      return {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        officeId: user.officeId || '1',
        createdAt: user.created_at instanceof Date ? user.created_at : new Date(user.created_at),
        updatedAt: user.updated_at instanceof Date ? user.updated_at : new Date(user.updated_at),
        lastLogin: user.last_login ? (user.last_login instanceof Date ? user.last_login : new Date(user.last_login)) : undefined,
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