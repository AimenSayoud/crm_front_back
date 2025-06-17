// src/lib/openai-service.ts
import { api } from '@/lib/api-client';
import { Candidate, Company } from '@/types';

// Fallback OpenAI integration for frontend-only functionality
// when backend AI services are unavailable
let openaiKey: string | null = null;

// Check session storage for key on initial load
if (typeof window !== 'undefined') {
  openaiKey = sessionStorage.getItem('openai_api_key');
}

export const setOpenAIKey = (key: string) => {
  openaiKey = key;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openai_api_key', key);
  }
};

const getOpenAIKey = (): string => {
  if (!openaiKey) {
    throw new Error('OpenAI API key not set. Please set a key in settings.');
  }
  return openaiKey;
};

// Direct OpenAI call fallback if backend is unavailable
const callOpenAIDirectly = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const apiKey = getOpenAIKey();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // You can change the model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated.';
};

// Main frontend service methods that connect to backend API
// With direct OpenAI fallback if needed

export const analyzeCv = async (cvText: string) => {
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
};

export const analyzeCvWithJobMatch = async (cvText: string) => {
  try {
    return await api.analyzeCvWithJobMatch(cvText);
  } catch (error) {
    console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
    
    // First analyze the CV
    const cvAnalysis = await analyzeCv(cvText);
    
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
};

export const generateCandidateEmail = async (
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
    // Fallback logic (unchanged)
    const systemPrompt = `You are an expert recruitment consultant who writes clear, professional, and personalized emails.`;
    const userPrompt = `Draft a professional email to ${candidate.firstName} ${candidate.lastName} who is a ${candidate.position}.
      Purpose of email: ${purpose}
      Additional context: ${additionalContext || 'N/A'}
      
      The email should be warm yet professional, concise (under 250 words), and include a clear call to action.`;

    return await callOpenAIDirectly(systemPrompt, userPrompt);
  }
};
export const generateCompanyEmail = async (
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
};

export const generatePositionInterviewQuestions = async (
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
};

export const generateJobDescriptionService = async (
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
};

export const generateCandidateFeedback = async (candidate: Candidate) => {
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
};

export const processGeneralQuery = async (query: string, context?: string) : Promise<any> => {
  try {
    const result = await api.processGeneralQuery(query, context);
    return result;
  } catch (error) {
    console.warn('Backend API failed, attempting direct OpenAI fallback:', error);
    const systemPrompt = `You are an AI assistant specialized in recruitment and HR, providing helpful, accurate information to recruiters.`;
    const userPrompt = `${context ? `Context: ${context}\n\n` : ''}${query}`;

    return await callOpenAIDirectly(systemPrompt, userPrompt);
  }
};