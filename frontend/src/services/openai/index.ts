// src/services/openai/index.ts
import { setOpenAIKey, getOpenAIKey } from './config';
import callOpenAIDirectly from './direct-client';
import resumeService from './resume-service';
import emailService from './email-service';
import interviewService from './interview-service';
import jobService from './job-service';
import candidateService from './candidate-service';
import chatService from './chat-service';

// Main OpenAI service object
export const openai = {
  // Key management
  setApiKey: setOpenAIKey,
  getApiKey: getOpenAIKey,
  
  // Core services
  resume: resumeService,
  email: emailService,
  interview: interviewService,
  job: jobService,
  candidate: candidateService,
  chat: chatService,
  
  // Direct API access
  callDirectly: callOpenAIDirectly
};

export default openai;