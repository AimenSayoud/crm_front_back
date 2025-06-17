// src/services/openai/interview-service.ts
import api from '../api';
import callOpenAIDirectly from './direct-client';

export const interviewService = {
  // Generate position interview questions
  generatePositionInterviewQuestions: async (
    position: string,
    companyName?: string,
    candidateContext?: string
  ) => {
    try {
      const jobDetails = {
        title: position,
        company_name: companyName || undefined,
        description: `A role for a ${position}${companyName ? ` at ${companyName}` : ''}`,
      };
      
      const candidateInfo = candidateContext ? {
        name: candidateContext
      } : undefined;
      
      const questions = await api.generateInterviewQuestions(jobDetails, candidateInfo);
      
      // Format the response nicely
      return questions.map((q, i) => 
        `## Question ${i+1}: ${q.question}\n\n**Purpose:** ${q.purpose}\n\n**Evaluation guidance:** ${q.evaluation_guidance}`
      ).join('\n\n');
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      const systemPrompt = `You are an expert recruitment interview specialist.`;
      const userPrompt = `Generate 7-10 high-quality interview questions for a ${position} position${companyName ? ` at ${companyName}` : ''}.
        ${candidateContext ? `Candidate context: ${candidateContext}` : ''}
        
        For each question, include:
        1. The question itself
        2. The purpose of the question (what it aims to assess)
        3. Evaluation guidance (what to look for in the candidate's answer)
        
        Create a mix of technical, behavioral, and situational questions that assess both hard and soft skills.`;

      return await callOpenAIDirectly(systemPrompt, userPrompt);
    }
  }
};

export default interviewService;