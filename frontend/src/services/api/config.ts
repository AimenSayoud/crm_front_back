// src/services/api/config.ts
// Configuration for the API client

// API base URL from environment variables
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Request timeout in milliseconds
export const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Cache control headers
export const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};