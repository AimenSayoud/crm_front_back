// src/services/api/axios-client.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL, DEFAULT_TIMEOUT } from './config';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors - token expired
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh_token: refreshToken },
            { baseURL: API_BASE_URL }
          );
          
          const { access_token } = response.data;
          
          if (access_token) {
            // Update localStorage
            localStorage.setItem('access_token', access_token);
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    // Check for network errors (no response from server)
    if (error.message === 'Network Error') {
      console.error('Network connection error:', error);
      
      // Create a more descriptive error with troubleshooting info
      const errorObj = new Error(
        'Unable to connect to the API server. Please verify that:\n' +
        '1. The backend server is running\n' +
        '2. You are connected to the internet\n' +
        '3. The API_BASE_URL is correctly configured'
      );
      errorObj.name = 'NetworkConnectionError';
      
      return Promise.reject(errorObj);
    }
    
    // Standard error handling for other errors
    const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message || 
                         'An unknown error occurred';
    
    // Only log as error if it's not an authentication error (reduces noise in console)
    if (error.response?.status === 401) {
      // Authentication errors are expected during login attempts with wrong credentials
      console.warn('Authentication failed:', errorMessage);
      // For login endpoint, don't transform the error so auth-service.ts can handle it properly
      if (error.config?.url?.includes('/auth/login')) {
        console.log('Preserving original error for auth-service.ts to handle');
        return Promise.reject(error);
      }
    } else {
      console.error('API Error:', errorMessage);
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;