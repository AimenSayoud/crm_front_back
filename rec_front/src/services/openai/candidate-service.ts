// src/services/openai/candidate-service.ts
import { Candidate } from '@/types';
import api from '../api';
import callOpenAIDirectly from './direct-client';

export const candidateService = {
  // Generate candidate feedback
  generateCandidateFeedback: async (candidate: Candidate) => {
    try {
      // Use the custom endpoint for candidate feedback
      const result = await api.generateCandidateFeedback(candidate);
      return result;
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      const systemPrompt = `You are an expert recruitment consultant providing constructive feedback to candidates.`;
      const userPrompt = `Generate constructive feedback for ${candidate.firstName} ${candidate.lastName}, who is a ${candidate.position}.
        
        The feedback should include:
        1. Strengths based on their position and profile
        2. Areas for potential improvement
        3. Suggestions for career development
        4. Overall assessment
        
        Make the feedback professional, constructive, and actionable without being overly critical.`;

      return await callOpenAIDirectly(systemPrompt, userPrompt);
    }
  }
};

export default candidateService;