// src/services/api/auth-service.ts
import apiClient from './axios-client';
import axios, { AxiosResponse } from 'axios';

// Custom auth error class for better error handling
export class AuthenticationError extends Error {
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, code: string = 'auth_error', details?: Record<string, any>) {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.details = details;
  }
}

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: 'candidate' | 'employer' | 'admin' | 'superadmin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenData {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface AuthStatusResponse {
  is_authenticated: boolean;
  user?: User;
}

// Service
export const AuthService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Input validation
      if (!credentials.email) {
        throw new AuthenticationError('Email is required', 'missing_email');
      }
      if (!credentials.password) {
        throw new AuthenticationError('Password is required', 'missing_password');
      }
      
      // Send JSON data to our backend
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      return response;
    } catch (error) {
      // Transform errors into more user-friendly forms
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data;
        
        if (status === 401) {
          const message = responseData?.message || responseData?.detail || 'Invalid email or password';
          throw new AuthenticationError(
            message, 
            'invalid_credentials'
          );
        } else if (status === 403) {
          throw new AuthenticationError(
            'Your account has been disabled', 
            'account_disabled'
          );
        } else if (status === 400) {
          // Bad Request - validation errors
          const message = responseData?.message || responseData?.detail || 'Invalid request';
          throw new AuthenticationError(
            message, 
            'validation_error'
          );
        } else if (status === 429) {
          throw new AuthenticationError(
            'Too many login attempts. Please try again later.', 
            'rate_limited'
          );
        } else {
          // Generic error with message from backend if available
          const message = responseData?.detail || responseData?.message || 'Authentication failed';
          throw new AuthenticationError(message, 'server_error');
        }
      }
      
      // Re-throw original error if it's not an axios error
      throw error;
    }
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response;
  },

  async refreshToken(refreshData: RefreshTokenData): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', refreshData);
    return response;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response;
  }
};

export default AuthService;