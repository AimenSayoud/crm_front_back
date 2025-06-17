// src/services/api/index.ts
import aiToolsService from './ai-tools-service';
import { ApplicationsService } from './applications-service';
import candidatesService from './candidates-service';
import { CompaniesService } from './companies-service';
import { JobsService } from './jobs-service';
import messagesService from './messages-service';
import officesService from './offices-service';
import skillsService from './skills-service';
import usersService from './users-service';
import { fetcher, handleResponse, extractPaginatedItems } from './http-client';
import apiClient from './axios-client';
import * as config from './config';

// Main API service object
export const api = {
  // Core services
  applications: ApplicationsService,
  candidates: candidatesService,
  companies: CompaniesService,
  jobs: JobsService,
  users: usersService,
  messages: messagesService,
  skills: skillsService,
  offices: officesService,
  
  // AI tools
  ...aiToolsService,

  // Expose raw clients for advanced usage if needed
  client: {
    fetch: fetcher,
    axios: apiClient,
    config
  },
  
  // Helpers
  utils: {
    handleResponse,
    extractPaginatedItems
  }
};

export default api;