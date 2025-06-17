// src/services/api/http-client.ts
// Core HTTP client functionality
import { API_BASE_URL, DEFAULT_TIMEOUT, CACHE_CONTROL_HEADERS } from './config';

// Helper function to handle API responses
export const handleResponse = async (response: Response) => {
  // Handle redirects (307, 301, 302, etc.)
  if (response.redirected) {
    console.warn(`API request redirected from ${response.url}`);
  }
  
  if (!response.ok) {
    // For redirects, provide a more specific error message
    if (response.status >= 300 && response.status < 400) {
      throw new Error(`Redirect error: ${response.status} ${response.statusText}`);
    }
    
    // For other errors, try to parse the response body
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// Generic fetcher function
export const fetcher = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add cache control headers to prevent caching of API responses
    const headers = {
      'Content-Type': 'application/json',
      ...CACHE_CONTROL_HEADERS,
      ...options.headers,
    };
    
    // Set maximum timeout for requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    
    const response = await fetch(url, {
      headers,
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return handleResponse(response);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('API request timed out');
      throw new Error('Request timed out. Please try again.');
    }
    console.error('API Error:', error);
    throw error;
  }
};

// Helper to extract items from paginated responses
export const extractPaginatedItems = <T>(response: { 
  items: T[], 
  totalCount: number, 
  page: number, 
  pageSize: number, 
  pageCount: number 
}): T[] => {
  return response.items;
};