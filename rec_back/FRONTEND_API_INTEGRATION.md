# Frontend API Integration Guide

This document outlines how frontend developers should integrate with the RecrutementPlus CRM backend APIs. It explains the architectural patterns, code structure, and best practices for making API calls from the frontend to the backend.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Client Setup](#api-client-setup)
3. [Service Layer](#service-layer)
4. [State Management with Zustand](#state-management-with-zustand)
5. [UI Integration](#ui-integration)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Common API Integration Patterns](#common-api-integration-patterns)
9. [Examples](#examples)

## Architecture Overview

The frontend API integration follows a layered architecture:

```
UI Components → Zustand Stores → Service Layer → API Client → Backend
```

- **API Client**: Handles HTTP requests, authentication, and base URL configuration
- **Service Layer**: Provides domain-specific methods for interacting with different API endpoints
- **Zustand Stores**: Manages application state, including API data and loading/error states
- **UI Components**: Consumes state from stores and triggers API actions

This layered approach ensures separation of concerns and makes the codebase maintainable and testable.

## API Client Setup

The API client is configured in the following files:

- `src/services/api/config.ts`: API configuration (base URL, timeouts)
- `src/services/api/http-client.ts`: Generic HTTP client
- `src/services/api/axios-client.ts`: Axios-specific implementation

### Basic API Client Usage

```typescript
// src/services/api/axios-client.ts
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized or token expiration
    if (error.response && error.response.status === 401) {
      // Refresh token or redirect to login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Service Layer

The service layer provides domain-specific methods for interacting with different API endpoints. Each service corresponds to a specific domain of the application:

- `src/services/api/candidates-service.ts`
- `src/services/api/companies-service.ts`
- `src/services/api/jobs-service.ts`
- `src/services/api/messages-service.ts`
- `src/services/api/ai-tools-service.ts`

### Creating a Service

```typescript
// src/services/api/candidates-service.ts
import apiClient from './axios-client';
import { Candidate, CandidateCreateInput, CandidatePage } from '../../types';

export const CandidatesService = {
  async getAllCandidates(page: number = 1, limit: number = 10): Promise<CandidatePage> {
    const response = await apiClient.get('/api/v1/candidates', {
      params: { page, limit }
    });
    return response.data;
  },

  async getCandidateById(id: string): Promise<Candidate> {
    const response = await apiClient.get(`/api/v1/candidates/${id}`);
    return response.data;
  },

  async createCandidate(candidateData: CandidateCreateInput): Promise<Candidate> {
    const response = await apiClient.post('/api/v1/candidates', candidateData);
    return response.data;
  },

  async updateCandidate(id: string, candidateData: Partial<Candidate>): Promise<Candidate> {
    const response = await apiClient.put(`/api/v1/candidates/${id}`, candidateData);
    return response.data;
  },

  async deleteCandidate(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/candidates/${id}`);
  }
};
```

## State Management with Zustand

Zustand is used for state management. Each store typically contains:

- State data
- Loading flags
- Error states
- Actions that trigger API calls

### Creating a Store

```typescript
// src/store/useDataStore.ts
import create from 'zustand';
import { CandidatesService } from '../services/api/candidates-service';
import { Candidate, CandidatePage } from '../types';

interface CandidateState {
  candidates: Candidate[];
  totalCount: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCandidates: (page?: number, limit?: number) => Promise<void>;
  getCandidateById: (id: string) => Promise<Candidate | undefined>;
  createCandidate: (data: CandidateCreateInput) => Promise<Candidate | undefined>;
  updateCandidate: (id: string, data: Partial<Candidate>) => Promise<Candidate | undefined>;
  deleteCandidate: (id: string) => Promise<boolean>;
}

export const useCandidateStore = create<CandidateState>((set, get) => ({
  candidates: [],
  totalCount: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
  
  fetchCandidates: async (page = 1, limit = 10) => {
    try {
      set({ isLoading: true, error: null });
      const response = await CandidatesService.getAllCandidates(page, limit);
      set({ 
        candidates: response.items,
        totalCount: response.total,
        currentPage: page,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch candidates',
        isLoading: false
      });
    }
  },
  
  getCandidateById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const candidate = await CandidatesService.getCandidateById(id);
      set({ isLoading: false });
      return candidate;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch candidate',
        isLoading: false
      });
    }
  },
  
  // Additional actions for create, update, delete
}));
```

## UI Integration

UI components consume Zustand stores and trigger API actions:

```tsx
// src/components/candidates/CandidateList.tsx
import React, { useEffect } from 'react';
import { useCandidateStore } from '../../store/useDataStore';

export const CandidateList: React.FC = () => {
  const { candidates, isLoading, error, fetchCandidates } = useCandidateStore();
  
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Candidates</h2>
      <ul>
        {candidates.map(candidate => (
          <li key={candidate.id}>
            {candidate.first_name} {candidate.last_name}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

## Authentication

Authentication is managed by the `useAuthStore` and `AuthContext`:

```typescript
// src/store/useAuthStore.ts
import create from 'zustand';
import { AuthService } from '../services/api/auth-service';
import { User, LoginCredentials } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
      const { user, token } = await AuthService.login(credentials);
      
      localStorage.setItem('access_token', token.access_token);
      localStorage.setItem('refresh_token', token.refresh_token);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      return true;
    } catch (error) {
      set({
        error: error.message || 'Login failed',
        isLoading: false
      });
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      isAuthenticated: false
    });
  },
  
  checkAuthStatus: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isAuthenticated: false });
        return false;
      }
      
      set({ isLoading: true });
      const user = await AuthService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      return true;
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return false;
    }
  }
}));
```

## Error Handling

Error handling is centralized in the API client and propagated to the stores:

```typescript
// Standard error handling pattern
const fetchData = async () => {
  try {
    set({ isLoading: true, error: null });
    const data = await SomeService.getData();
    set({ data, isLoading: false });
  } catch (error) {
    set({
      error: error.response?.data?.message || error.message || 'Unknown error occurred',
      isLoading: false
    });
  }
};
```

## Common API Integration Patterns

### 1. CRUD Operations

```typescript
// Create
const createEntity = async (data) => {
  try {
    set({ isLoading: true, error: null });
    const newEntity = await EntityService.createEntity(data);
    set(state => ({ 
      entities: [...state.entities, newEntity],
      isLoading: false 
    }));
    return newEntity;
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
};

// Read
const fetchEntities = async () => {
  try {
    set({ isLoading: true, error: null });
    const result = await EntityService.getAllEntities();
    set({ 
      entities: result.items,
      totalCount: result.total,
      isLoading: false 
    });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
};

// Update
const updateEntity = async (id, data) => {
  try {
    set({ isLoading: true, error: null });
    const updatedEntity = await EntityService.updateEntity(id, data);
    set(state => ({ 
      entities: state.entities.map(e => e.id === id ? updatedEntity : e),
      isLoading: false 
    }));
    return updatedEntity;
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
};

// Delete
const deleteEntity = async (id) => {
  try {
    set({ isLoading: true, error: null });
    await EntityService.deleteEntity(id);
    set(state => ({ 
      entities: state.entities.filter(e => e.id !== id),
      isLoading: false 
    }));
    return true;
  } catch (error) {
    set({ error: error.message, isLoading: false });
    return false;
  }
};
```

### 2. Pagination

```typescript
const fetchPaginatedEntities = async (page = 1, limit = 10) => {
  try {
    set({ isLoading: true, error: null });
    const result = await EntityService.getAllEntities(page, limit);
    set({ 
      entities: result.items,
      totalCount: result.total,
      currentPage: page,
      isLoading: false 
    });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
};
```

### 3. AI Tool Integration

```typescript
// Analyze CV with AI
const analyzeCvWithAI = async (candidateId, cvText) => {
  try {
    set({ isAnalyzing: true, analyzeError: null });
    const result = await AIToolsService.analyzeCv({
      candidate_id: candidateId,
      cv_text: cvText
    });
    set({ 
      analysisResult: result,
      isAnalyzing: false 
    });
    return result;
  } catch (error) {
    set({ 
      analyzeError: error.message, 
      isAnalyzing: false 
    });
    return null;
  }
};
```

### 4. File Upload

```typescript
const uploadCandidateCV = async (candidateId, file) => {
  try {
    set({ isUploading: true, uploadError: null });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const result = await apiClient.post(
      `/api/v1/candidates/${candidateId}/upload-cv`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    set({ isUploading: false });
    return result.data;
  } catch (error) {
    set({ 
      uploadError: error.message, 
      isUploading: false 
    });
    return null;
  }
};
```

## Examples

### Basic Entity Fetching

```tsx
// Component
import React, { useEffect } from 'react';
import { useJobsStore } from '../../store/useDataStore';

export const JobsList: React.FC = () => {
  const { jobs, isLoading, error, fetchJobs } = useJobsStore();
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>Available Jobs</h2>
      <ul>
        {jobs.map(job => (
          <li key={job.id}>
            <h3>{job.title}</h3>
            <p>{job.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Form Submission

```tsx
// Component with form submission
import React, { useState } from 'react';
import { useCompanyStore } from '../../store/useDataStore';
import { CompanyCreateInput } from '../../types';

export const CompanyForm: React.FC = () => {
  const { createCompany, isLoading, error } = useCompanyStore();
  const [formData, setFormData] = useState<CompanyCreateInput>({
    name: '',
    industry: '',
    size: '',
    location: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createCompany(formData);
    if (result) {
      // Success - reset form or redirect
      setFormData({
        name: '',
        industry: '',
        size: '',
        location: '',
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Company</h2>
      {error && <div className="error">{error}</div>}
      
      <div>
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      {/* Other form fields */}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Company'}
      </button>
    </form>
  );
};
```

### Using AI Tools

```tsx
// Component using AI tools
import React, { useState } from 'react';
import { useAIToolsStore } from '../../store/useDataStore';

export const CVAnalyzer: React.FC = () => {
  const { analyzeCv, isAnalyzing, analysisResult, analyzeError } = useAIToolsStore();
  const [cvText, setCvText] = useState('');
  
  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    await analyzeCv(cvText);
  };
  
  return (
    <div>
      <h2>CV Analysis Tool</h2>
      <textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        placeholder="Paste CV text here..."
        rows={10}
      />
      
      <button onClick={handleAnalyze} disabled={isAnalyzing}>
        {isAnalyzing ? 'Analyzing...' : 'Analyze CV'}
      </button>
      
      {analyzeError && <div className="error">{analyzeError}</div>}
      
      {analysisResult && (
        <div className="analysis-result">
          <h3>Analysis Results</h3>
          <div>
            <h4>Skills</h4>
            <ul>
              {analysisResult.skills.map((skill, index) => (
                <li key={index}>{skill.name} - {skill.level}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Experience</h4>
            <p>{analysisResult.experience_summary}</p>
          </div>
          <div>
            <h4>Match Score</h4>
            <p>{analysisResult.match_score}%</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Authentication

```tsx
// Login component
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(credentials);
    if (success) {
      router.push('/dashboard');
    }
  };
  
  return (
    <div className="login-container">
      <h1>Login</h1>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};
```

## Best Practices

1. **Type Everything**: Use TypeScript interfaces for all API requests and responses
2. **Centralize Configuration**: Keep API URLs and other configuration in one place
3. **Handle Loading States**: Show appropriate loading indicators during API calls
4. **Error Handling**: Implement consistent error handling across all API interactions
5. **Authentication**: Always include authentication tokens for protected routes
6. **State Updates**: Update the UI state immediately after successful API operations
7. **Optimize**: Implement request debouncing for search inputs and throttling for frequent updates
8. **Refresh Tokens**: Implement proper refresh token handling to maintain sessions
9. **Pagination**: Use proper pagination for lists that could have many items

Remember that following these patterns ensures consistency across the application and makes it easier for new developers to understand and extend the codebase.