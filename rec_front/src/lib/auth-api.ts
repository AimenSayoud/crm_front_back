// API client with authentication handling
const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ApiError {
  detail: string;
  status_code: number;
}

class AuthenticatedApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // If refresh fails, clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return false;
  }

  async apiCall(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requireAuth && token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      let response = await fetch(url, requestOptions);

      // If unauthorized and we have auth, try to refresh token
      if (response.status === 401 && requireAuth && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry with new token
          const newToken = this.getAuthToken();
          if (newToken) {
            requestOptions.headers = {
              ...requestOptions.headers,
              'Authorization': `Bearer ${newToken}`,
            };
            response = await fetch(url, requestOptions);
          }
        }
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.detail || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint: string, requireAuth: boolean = true) {
    return this.apiCall(endpoint, { method: 'GET' }, requireAuth);
  }

  async post(endpoint: string, data?: any, requireAuth: boolean = true) {
    return this.apiCall(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      requireAuth
    );
  }

  async put(endpoint: string, data?: any, requireAuth: boolean = true) {
    return this.apiCall(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      requireAuth
    );
  }

  async delete(endpoint: string, requireAuth: boolean = true) {
    return this.apiCall(endpoint, { method: 'DELETE' }, requireAuth);
  }
}

export const authApiClient = new AuthenticatedApiClient();

// Export convenience functions
export const authGet = (endpoint: string) => authApiClient.get(endpoint);
export const authPost = (endpoint: string, data?: any) => authApiClient.post(endpoint, data);
export const authPut = (endpoint: string, data?: any) => authApiClient.put(endpoint, data);
export const authDelete = (endpoint: string) => authApiClient.delete(endpoint);