// src/lib/index.ts
// This file exports API services for use throughout the application

import { api as apiFromServices } from '@/services/api';

// Export the API service
export const apiService = apiFromServices;

// Re-export everything from api.ts for backward compatibility
export * from './api';

// Export everything from api-client.ts
export * from './api-client';

// Export everything from openai-service.ts
export * from './openai-service';