// src/services/openai/email-service.ts
import { Candidate, Company } from '@/types';
import api from '../api';
import callOpenAIDirectly from './direct-client';

export const emailService = {
  // Generate email for candidates
  generateCandidateEmail: async (
    candidate: Candidate,
    purpose: string,
    additionalContext?: string
  ) => {
    try {
      const context = {
        candidate_name: `${candidate.firstName} ${candidate.lastName}`,
        candidate_email: candidate.email,
        candidate_position: candidate.position,
        company_name: "Your Company", // Add this or get from context
        purpose: purpose,
        additional_context: additionalContext || ''
      };
      
      // Choose appropriate template ID based on purpose
      let templateId = "cv_acknowledgment"; // Default template
      if (purpose.toLowerCase().includes("interview")) {
        templateId = "interview_invitation";
      }
      
      const result = await api.generateEmail(templateId, context);
      return result.body;
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      // Fallback logic
      const systemPrompt = `You are an expert recruitment consultant who writes clear, professional, and personalized emails.`;
      const userPrompt = `Draft a professional email to ${candidate.firstName} ${candidate.lastName} who is a ${candidate.position}.
        Purpose of email: ${purpose}
        Additional context: ${additionalContext || 'N/A'}
        
        The email should be warm yet professional, concise (under 250 words), and include a clear call to action.`;

      return await callOpenAIDirectly(systemPrompt, userPrompt);
    }
  },

  // Generate email for companies
  generateCompanyEmail: async (
    company: Company,
    purpose: string,
    additionalContext?: string
  ) => {
    try {
      const context = {
        company_name: company.name,
        contact_person: company.contactPerson,
        industry: company.industry,
        purpose: purpose,
        additional_context: additionalContext || ''
      };
      
      const result = await api.generateEmail('company_email', context);
      return result.body;
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      const systemPrompt = `You are an expert recruitment consultant who writes clear, professional, and personalized emails.`;
      const userPrompt = `Draft a professional email to ${company.contactPerson || 'the hiring manager'} at ${company.name} in the ${company.industry} industry.
        Purpose of email: ${purpose}
        Additional context: ${additionalContext || 'N/A'}
        
        The email should be professional, concise (under 250 words), and include a clear call to action.`;

      return await callOpenAIDirectly(systemPrompt, userPrompt);
    }
  }
};

export default emailService;