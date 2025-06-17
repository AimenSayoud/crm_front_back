// src/services/openai/chat-service.ts
import api from '../api';
import callOpenAIDirectly from './direct-client';

export const chatService = {
  // Process general query
  processGeneralQuery: async (query: string, context?: string) : Promise<any> => {
    try {
      const result = await api.processGeneralQuery(query, context);
      return result;
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      const systemPrompt = `You are an AI assistant specialized in recruitment and HR, providing helpful, accurate information to recruiters.`;
      const userPrompt = `${context ? `Context: ${context}\n\n` : ''}${query}`;

      return await callOpenAIDirectly(systemPrompt, userPrompt);
    }
  }
};

export default chatService;