// src/services/openai/job-service.ts
import api from '../api';
import callOpenAIDirectly from './direct-client';

export const jobService = {
  // Generate job description
  generateJobDescriptionService: async (
    position: string,
    companyName: string,
    industry?: string
  ) => {
    try {
      const result = await api.generateJobDescription(position, companyName, industry);
      return result.full_text;
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      const systemPrompt = `You are an expert recruitment content writer specializing in job descriptions.`;
      const userPrompt = `Create a compelling, detailed, and well-structured job description for a ${position} role at ${companyName}${industry ? ` in the ${industry} industry` : ''}.
        
        Include these sections:
        1. Job Title
        2. Company Overview
        3. Role Summary
        4. Key Responsibilities
        5. Required Qualifications
        6. Preferred Qualifications
        7. Required Skills
        8. Benefits
        9. Location & Work Environment
        10. Application Process
        
        The tone should be professional but engaging, avoiding discriminatory language or unrealistic expectations.
        The job description should be 400-600 words.`;

      return await callOpenAIDirectly(systemPrompt, userPrompt);
    }
  }
};

export default jobService;