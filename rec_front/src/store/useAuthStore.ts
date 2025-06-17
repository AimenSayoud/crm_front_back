// src/store/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import AuthService, { 
  User as ApiUser, 
  AuthenticationError 
} from '../services/api/auth-service';

export type UserRole = 'super_admin' | 'admin' | 'employee' | 'candidate' | 'consultant' | 'employer';
export type OfficeId = string;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  officeId?: string;
}

interface AuthError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  canAccessOffice: (officeId: OfficeId) => boolean;
  canAccess: (requiredRole: UserRole) => boolean;
  initializeAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
      // State
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await AuthService.login({ email, password });
          const { user, tokens } = response;
          
          // Store tokens in localStorage
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
          
          // Store token expiry time for better handling
          const expiresInMs = tokens.expires_in * 1000;
          const expiryTime = Date.now() + expiresInMs;
          localStorage.setItem('token_expiry', expiryTime.toString());
          
          set({ 
            user: {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`,
              email: user.email,
              role: user.role as UserRole,
              officeId: user.office_id,
            }, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          // Handle custom AuthenticationError
          if (error instanceof AuthenticationError) {
            set({
              isLoading: false,
              error: {
                message: error.message,
                code: error.code,
                details: error.details
              }
            });
            throw error; // Re-throw the error as is
          } 
          
          // Handle other errors
          let errorMessage = 'Login failed';
          let errorCode = 'unknown_error';
          
          if (error instanceof Error) {
            errorMessage = error.message;
            
            // Check for known error messages and convert them to appropriate error codes
            if (errorMessage.includes('Incorrect email or password')) {
              errorCode = 'invalid_credentials';
            } else if (errorMessage.toLowerCase().includes('network')) {
              errorCode = 'server_error';
            }
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract API error message if available
            const errorObj = error as any;
            if (errorObj.response?.data?.detail) {
              errorMessage = errorObj.response.data.detail;
            } else if (errorObj.response?.data?.message) {
              errorMessage = errorObj.response.data.message;
            }
          }
          
          console.log('Creating AuthenticationError with:', errorMessage, errorCode);
          
          set({ 
            isLoading: false, 
            error: {
              message: errorMessage,
              code: errorCode
            }
          });
          throw new AuthenticationError(errorMessage, errorCode);
        }
      },

      logout: async () => {
        try {
          await AuthService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear all auth-related items from localStorage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expiry');
          
          // Clear state
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          });
          
          // If we're in a browser environment, we could also clear auth cookies if using them
          // This would require backend changes to use HttpOnly cookies
          // document.cookie = 'refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      canAccessOffice: (officeId: OfficeId) => {
        const { user } = get();
        if (!user) return false;
        
        // Super admin can access all offices
        if (user.role === 'super_admin') return true;
        
        // Other roles can only access their assigned office
        return user.officeId === officeId;
      },

      canAccess: (requiredRole: UserRole) => {
        const { user } = get();
        if (!user) return false;
        
        // Access levels hierarchy
        const roleHierarchy: Record<UserRole, number> = {
          'super_admin': 5,
          'admin': 4,
          'consultant': 3,
          'employer': 2,
          'employee': 1,
          'candidate': 0
        };
        
        // If the user's role is not in the hierarchy, deny access
        if (!(user.role in roleHierarchy) || !(requiredRole in roleHierarchy)) {
          return false;
        }
        
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
      },

      initializeAuth: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            set({ isLoading: false });
            return;
          }

          // Check if token is expired based on stored expiry time
          const expiryTimeStr = localStorage.getItem('token_expiry');
          if (expiryTimeStr) {
            const expiryTime = parseInt(expiryTimeStr, 10);
            // If token is expired or will expire in the next minute
            if (Date.now() > expiryTime - 60000) {
              // Try to refresh the token
              const refreshToken = localStorage.getItem('refresh_token');
              if (refreshToken) {
                try {
                  const refreshResponse = await AuthService.refreshToken({ refresh_token: refreshToken });
                  
                  // Update tokens in localStorage
                  localStorage.setItem('access_token', refreshResponse.access_token);
                  localStorage.setItem('refresh_token', refreshResponse.refresh_token);
                  
                  // Update expiry time
                  const expiresInMs = refreshResponse.expires_in * 1000;
                  const newExpiryTime = Date.now() + expiresInMs;
                  localStorage.setItem('token_expiry', newExpiryTime.toString());
                } catch (refreshError) {
                  // If refresh fails, clear auth and return
                  console.error('Token refresh failed:', refreshError);
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  localStorage.removeItem('token_expiry');
                  set({ 
                    user: null, 
                    isAuthenticated: false, 
                    isLoading: false,
                    error: null
                  });
                  return;
                }
              }
            }
          }

          // Verify token with backend by getting current user
          const userData = await AuthService.getCurrentUser();
          
          set({ 
            user: {
              id: userData.id,
              name: `${userData.first_name} ${userData.last_name}`,
              email: userData.email,
              role: userData.role as UserRole,
              officeId: userData.office_id,
            }, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear all auth data
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('token_expiry');
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          });
        }
      },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          // Set loading to false after rehydration
          if (state) {
            state.setLoading(false);
          }
        },
      }
    )
  )
);

// Create stable selectors for SSR compatibility
export const selectUser = (state: AuthStore) => state.user;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectCanAccess = (state: AuthStore) => state.canAccess;
export const selectCanAccessOffice = (state: AuthStore) => state.canAccessOffice;
export const selectLogin = (state: AuthStore) => state.login;
export const selectLogout = (state: AuthStore) => state.logout;