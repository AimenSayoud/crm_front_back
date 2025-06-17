// src/services/openai/resume-service.ts
import api from '../api';
import callOpenAIDirectly from './direct-client';

export const resumeService = {
  // CV File Analysis (New Method)
  analyzeCvFile: async (file: File, onUploadProgress?: (progressEvent: any) => void) => {
    try {
      return await api.analyzeCvFile(file, onUploadProgress);
    } catch (error) {
      console.warn('Backend file analysis failed:', error);
      throw error; // Don't fallback for file uploads, they need backend processing
    }
  },

  // CV Analysis
  analyzeCv: async (cvText: string) => {
    try {
      return await api.analyzeCv(cvText);
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      const systemPrompt = `You are an expert recruitment assistant specialized in analyzing CVs/resumes and extracting structured information.
        Focus on accurately identifying skills, education history, work experience, calculating total experience, and creating a professional summary.`;
      const userPrompt = `Please analyze the following CV/resume text and extract the key information:

        ${cvText}

        Provide your analysis in a structured format with these sections:
        - Skills (as a comma-separated list)
        - Education (list each with degree, institution, and years)
        - Experience (list each role with title, company, duration)
        - Total Experience (in years)
        - Summary (brief professional overview)`;

      const response = await callOpenAIDirectly(systemPrompt, userPrompt);

      // Basic parsing of the response text into a structured format
      // This is a simplified version - in a real app, you'd need more robust parsing
      const skills = response.includes('Skills:') 
        ? response.split('Skills:')[1].split('\n')[0].trim().split(',').map(s => s.trim()) 
        : [];
      const total_experience_years = parseInt(response.match(/total experience:?\s*(\d+)/i)?.[1] || '0');

      return {
        skills,
        education: [],
        experience: [],
        total_experience_years,
        summary: response.includes('Summary:') ? response.split('Summary:')[1].trim() : '',
      };
    }
  },

  // CV Analysis with Job Matching
  analyzeCvWithJobMatch: async (cvText: string) => {
    try {
      return await api.analyzeCvWithJobMatch(cvText);
    } catch (error) {
      console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
      
      // First analyze the CV
      const cvAnalysis = await resumeService.analyzeCv(cvText);
      
      // Then generate job matches using direct OpenAI call
      const systemPrompt = `You are an expert recruitment matching system specializing in matching candidates to job positions.`;
      const userPrompt = `Based on the following candidate skills and experience, suggest suitable job matches.
      
      Candidate skills: ${cvAnalysis.skills.join(', ')}
      Experience years: ${cvAnalysis.total_experience_years}
      Summary: ${cvAnalysis.summary}
      
      Provide your response as 3-5 potential job matches with these details for each:
      1. Job title
      2. Company name
      3. Match score (0-100)
      4. Matching skills
      5. Skills that might be missing
      6. A brief explanation of why this job is a good match
      7. One suggestion for improving fit for this role`;
      
      const response = await callOpenAIDirectly(systemPrompt, userPrompt);
      
      // Parse the response to create JobMatchResponseItems
      // This is simplified - in a real app, you'd need more robust parsing
      const jobMatches = [];
      try {
        const sections = response.split(/Job \d+:|Match \d+:/i).filter(Boolean);
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const titleMatch = section.match(/Title:?\s*([^\n]+)/i);
          const companyMatch = section.match(/Company:?\s*([^\n]+)/i);
          const scoreMatch = section.match(/Score:?\s*(\d+)/i);
          const matchingSkillsMatch = section.match(/Matching Skills:?\s*([^\n]+)/i);
          const missingSkillsMatch = section.match(/Missing Skills:?\s*([^\n]+)/i);
          const explanationMatch = section.match(/Explanation:?\s*([^\n]+)/i);
          const suggestionMatch = section.match(/Suggestion:?\s*([^\n]+)/i);
          
          if (titleMatch) {
            jobMatches.push({
              job_id: i + 1,
              job_title: titleMatch[1]?.trim() || `Job ${i+1}`,
              company_name: companyMatch?.[1]?.trim() || 'Unknown Company',
              match_score: parseInt(scoreMatch?.[1] || '0'),
              matching_skills: matchingSkillsMatch?.[1]?.split(',').map(s => s.trim()) || [],
              non_matching_skills: missingSkillsMatch?.[1]?.split(',').map(s => s.trim()) || [],
              match_explanation: explanationMatch?.[1]?.trim() || `This job matches ${scoreMatch?.[1] || 'some'} of your skills.`,
              improvement_suggestion: suggestionMatch?.[1]?.trim() || 'Continue to develop relevant skills.'
            });
          }
        }
      } catch (parseError) {
        console.error('Error parsing job matches from OpenAI response:', parseError);
        // If parsing fails, provide at least one generic job match
        jobMatches.push({
          job_id: 1,
          job_title: 'Relevant Position',
          company_name: 'Sample Company',
          match_score: 75,
          matching_skills: cvAnalysis.skills.slice(0, 3),
          non_matching_skills: ['Advanced certification'],
          match_explanation: 'Your skills align with this position.',
          improvement_suggestion: 'Consider obtaining relevant certifications.'
        });
      }
      
      return {
        cv_analysis: cvAnalysis,
        job_matches: jobMatches
      };
    }
  }
};

export default resumeService;