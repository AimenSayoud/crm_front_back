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
  first_name: string;
  last_name: string;
  role?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  office_id?: string;
}

export interface LoginResponse {
  user: User;
  tokens: TokenResponse;
}

export interface RefreshTokenData {
  refresh_token: string;
}

export interface AuthStatusResponse {
  is_authenticated: boolean;
  user?: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  new_password: string;
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
      
      // Convert to FormData for OAuth2 compatibility
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const response = await apiClient.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response;
    } catch (error) {
      // Transform errors into more user-friendly forms
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseData = error.response?.data;
        
        if (status === 401) {
          console.log('401 error detected, throwing AuthenticationError');
          throw new AuthenticationError(
            'The email or password you entered is incorrect', 
            'invalid_credentials'
          );
        } else if (status === 403) {
          throw new AuthenticationError(
            'Your account has been disabled', 
            'account_disabled'
          );
        } else if (status === 404) {
          throw new AuthenticationError(
            'The email you entered is not registered in our system', 
            'user_not_found'
          );
        } else if (status === 422) {
          // Validation errors from backend
          if (responseData?.detail) {
            if (Array.isArray(responseData.detail)) {
              const errors = responseData.detail;
              const fieldsWithErrors: Record<string, string[]> = {};
              
              errors.forEach((err: any) => {
                const field = err.loc[err.loc.length - 1];
                if (!fieldsWithErrors[field]) {
                  fieldsWithErrors[field] = [];
                }
                fieldsWithErrors[field].push(err.msg);
              });
              
              throw new AuthenticationError(
                'Please check your login information', 
                'validation_error',
                fieldsWithErrors
              );
            } else {
              throw new AuthenticationError(
                responseData.detail, 
                'validation_error'
              );
            }
          }
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

  async refreshToken(refreshData: RefreshTokenData): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', refreshData);
    return response;
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response;
  },

  async checkAuthStatus(): Promise<AuthStatusResponse> {
    const response = await apiClient.get<AuthStatusResponse>('/auth/status');
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return response;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response;
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/auth/verify-email/${token}`);
    return response;
  }
};

export default AuthService;