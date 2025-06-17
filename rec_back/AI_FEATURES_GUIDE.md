# AI Features Integration Guide

This document provides detailed information about the AI features available in the RecrutementPlus CRM system and how frontend developers can integrate with these capabilities.

## Table of Contents

1. [Available AI Features](#available-ai-features)
2. [Technical Implementation](#technical-implementation)
3. [Frontend Integration](#frontend-integration)
4. [Example Integration Scenarios](#example-integration-scenarios)
5. [Best Practices](#best-practices)

## Available AI Features

### CV Analysis

Analyzes resume/CV text to extract structured information:

- Skills with proficiency levels
- Work experience with company names, positions, and durations
- Education history with institutions, degrees, and graduation dates
- Total years of experience calculation
- Professional summary generation
- Career level determination
- Skill gap analysis (when job context is provided)

**Endpoint**: `POST /api/v1/ai/analyze-cv`

```json
// Request
{
  "cv_text": "string",
  "job_id": "string"  // Optional, for skill gap analysis
}

// Response
{
  "skills": [
    {"name": "Python", "level": 4, "years": 3, "skill_id": "uuid-if-found-in-db"},
    {"name": "React", "level": 3, "years": 2, "skill_id": "uuid-if-found-in-db"}
  ],
  "work_experience": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "duration": "2 years",
      "start_date": "2020-01",
      "end_date": "2022-01",
      "description": "Led development of..."
    }
  ],
  "education": [
    {
      "institution": "University of Technology",
      "degree": "Bachelor of Computer Science",
      "graduation_date": "2018-05"
    }
  ],
  "total_experience": "5 years",
  "summary": "Senior Developer with 5 years of experience...",
  "career_level": "Mid-Senior",
  "skill_gaps": [  // Only if job_id was provided
    {"name": "AWS", "level": 3},
    {"name": "Docker", "level": 2}
  ]
}
```

### Job Matching

Evaluates how well a candidate matches a job and provides a quantitative score:

- Overall match score (0-100%)
- Matching skills
- Missing skills
- Experience match assessment
- Education match assessment
- Improvement suggestions

**Endpoint**: `POST /api/v1/ai/match-jobs`

```json
// Request
{
  "candidate_id": "string",
  "limit": 5  // Optional, number of job matches to return
}

// Response
{
  "matches": [
    {
      "job_id": "uuid",
      "job_title": "Senior Software Engineer",
      "company_name": "Tech Corp",
      "match_score": 85,
      "matching_skills": [
        {"name": "Python", "level": "Expert"},
        {"name": "React", "level": "Intermediate"}
      ],
      "missing_skills": [
        {"name": "AWS", "level": "Intermediate"}
      ],
      "experience_match": "Strong match - 5 years of relevant experience",
      "education_match": "Meets requirements - Bachelor's degree in Computer Science",
      "improvement_areas": "Consider gaining AWS certification to increase match score"
    }
  ]
}
```

### Email Generation

Creates personalized professional emails based on templates and context:

- Multiple template types (interview invitations, job offers, rejections, etc.)
- Context-aware personalization
- Professional tone and formatting

**Endpoint**: `POST /api/v1/ai/generate-email`

```json
// Request
{
  "template_id": "string",  // Can be UUID or template_type string like "interview_invitation"
  "context": {
    "candidate_name": "John Doe",
    "job_title": "Senior Developer",
    "company_name": "Tech Corp",
    "interview_date": "2023-05-15",
    "interview_time": "14:00",
    "interviewer_name": "Jane Smith",
    // Any other context variables needed for the template
  }
}

// Response
{
  "subject": "Interview Invitation: Senior Developer at Tech Corp",
  "body": "Dear John Doe,\n\nWe were impressed by your application for the Senior Developer position at Tech Corp..."
}
```

### Interview Question Generation

Generates tailored interview questions based on job requirements and candidate profile:

- Technical questions specific to required skills
- Behavioral questions
- Experience verification questions
- Scenario-based questions

**Endpoint**: `POST /api/v1/ai/generate-questions`

```json
// Request
{
  "job_id": "string",
  "candidate_id": "string",  // Optional, for candidate-tailored questions
  "count": 10  // Optional, number of questions to generate
}

// Response
{
  "questions": [
    {
      "question": "Can you explain how you would implement a caching mechanism in a distributed system?",
      "category": "technical",
      "skill": "System Design",
      "difficulty": "advanced"
    },
    {
      "question": "Describe a situation where you had to make a difficult technical decision with limited information.",
      "category": "behavioral",
      "skill": "Decision Making",
      "difficulty": "intermediate"
    }
    // More questions...
  ]
}
```

### Job Description Generation

Creates comprehensive job descriptions with all necessary sections:

- Responsibilities
- Requirements
- Qualifications
- Company overview
- Benefits
- Skills with required proficiency levels

**Endpoint**: `POST /api/v1/ai/generate-job-description`

```json
// Request
{
  "title": "Senior Software Engineer",
  "department": "Engineering",
  "level": "Senior",
  "required_skills": ["Python", "React", "System Design"],
  "location": "New York",
  "employment_type": "Full-time"
}

// Response
{
  "title": "Senior Software Engineer",
  "description": "We are seeking an experienced Senior Software Engineer...",
  "sections": {
    "responsibilities": ["Design and develop high-quality software...", "..."],
    "requirements": ["5+ years of software development experience...", "..."],
    "qualifications": ["Bachelor's degree in Computer Science or related field...", "..."],
    "skills": [
      {"name": "Python", "level": "Advanced"},
      {"name": "React", "level": "Intermediate"},
      {"name": "System Design", "level": "Advanced"}
    ],
    "benefits": ["Competitive salary...", "..."]
  }
}
```

### Candidate Feedback

Generates constructive professional feedback for candidates:

- Strength assessment
- Improvement areas
- Skill development recommendations
- Career guidance

**Endpoint**: `POST /api/v1/ai/generate-candidate-feedback`

```json
// Request
{
  "candidate_id": "string",
  "job_id": "string",  // Optional, for job-specific feedback
  "feedback_type": "interview" // Options: "interview", "application", "general"
}

// Response
{
  "strengths": ["Strong technical skills in Python and React", "..."],
  "improvement_areas": ["Could improve communication skills", "..."],
  "skill_recommendations": ["Consider developing cloud platform experience", "..."],
  "career_guidance": "Based on your profile, focusing on backend development roles would leverage your strengths..."
}
```

### General Chat Completion

Generic AI assistant capabilities focused on recruitment tasks:

- Answering recruitment-related questions
- Providing insights on industry trends
- Assistance with writing job posts, emails, etc.

**Endpoint**: `POST /api/v1/ai/chat-completion`

```json
// Request
{
  "messages": [
    {"role": "user", "content": "What are the key skills for a full stack developer in 2023?"}
  ],
  "context": {
    "entity_type": "job",  // Optional context type
    "entity_id": "uuid"    // Optional context entity
  }
}

// Response
{
  "response": "The key skills for a full stack developer in 2023 include..."
}
```

## Technical Implementation

### Architecture

The AI features are implemented using a dual architecture:

1. **File-based Implementation** (`ai_service.py`):
   - Used primarily during development and testing
   - Stores templates and data in JSON files
   - Faster startup, no database dependency

2. **Database-driven Implementation** (`ai_service_db.py`):
   - Used in production environments
   - Integrates with application data models
   - Persists analysis results and templates in database
   - Provides richer context through database relationships

### OpenAI Integration

- Primary model: `gpt-4o-mini` (balanced quality/cost)
- System prompts define AI assistant roles
- Structured user prompts with placeholders
- Response format specification ensures consistent output
- Configurable temperature settings per task type
- Fallback mechanisms when OpenAI service is unavailable

### Prompt Engineering

Specialized system prompts for each feature:

- CV Analyzer: "You are an expert recruitment assistant specializing in resume analysis..."
- Job Matcher: "You are an expert recruitment consultant specializing in matching candidates to jobs..."
- Email Generator: "You are a professional email writing assistant with expertise in recruitment communications..."

User prompts include formatted contextual data:

```python
prompt = f"""
Analyze the following resume for the candidate applying to the {job_title} position:

RESUME:
{cv_text}

JOB REQUIREMENTS:
{job_requirements}

Please provide a detailed analysis including skills, experience, education, and how well they match the job requirements.
"""
```

## Frontend Integration

### Service Layer

The frontend integrates with AI features through the `ai-tools-service.ts` service:

```typescript
// src/services/api/ai-tools-service.ts
import apiClient from './axios-client';
import { 
  CVAnalysisRequest, 
  CVAnalysisResponse,
  JobMatchRequest,
  JobMatchResponse,
  EmailGenerationRequest,
  EmailGenerationResponse,
  // Other types...
} from '../../types';

export const AIToolsService = {
  async analyzeCv(request: CVAnalysisRequest): Promise<CVAnalysisResponse> {
    const response = await apiClient.post('/api/v1/ai/analyze-cv', request);
    return response.data;
  },

  async matchJobs(request: JobMatchRequest): Promise<JobMatchResponse> {
    const response = await apiClient.post('/api/v1/ai/match-jobs', request);
    return response.data;
  },

  async generateEmail(request: EmailGenerationRequest): Promise<EmailGenerationResponse> {
    const response = await apiClient.post('/api/v1/ai/generate-email', request);
    return response.data;
  },

  // Additional methods for other AI features...
};
```

### State Management

AI-related state is managed in Zustand stores:

```typescript
// src/store/useAIToolsStore.ts
import create from 'zustand';
import { AIToolsService } from '../services/api/ai-tools-service';
import { 
  CVAnalysisResponse,
  JobMatchResponse,
  // Other types...
} from '../types';

interface AIToolsState {
  // CV Analysis
  cvAnalysisResult: CVAnalysisResponse | null;
  isAnalyzingCv: boolean;
  cvAnalysisError: string | null;
  
  // Job Matching
  jobMatches: JobMatchResponse | null;
  isMatchingJobs: boolean;
  jobMatchError: string | null;
  
  // Email Generation
  generatedEmail: { subject: string; body: string } | null;
  isGeneratingEmail: boolean;
  emailGenerationError: string | null;
  
  // Actions
  analyzeCv: (cvText: string, jobId?: string) => Promise<CVAnalysisResponse | null>;
  matchJobs: (candidateId: string, limit?: number) => Promise<JobMatchResponse | null>;
  generateEmail: (templateId: string, context: Record<string, any>) => Promise<{ subject: string; body: string } | null>;
  
  // Other state and actions...
}

export const useAIToolsStore = create<AIToolsState>((set, get) => ({
  // Initial state
  cvAnalysisResult: null,
  isAnalyzingCv: false,
  cvAnalysisError: null,
  
  jobMatches: null,
  isMatchingJobs: false,
  jobMatchError: null,
  
  generatedEmail: null,
  isGeneratingEmail: false,
  emailGenerationError: null,
  
  // Actions
  analyzeCv: async (cvText, jobId) => {
    try {
      set({ isAnalyzingCv: true, cvAnalysisError: null });
      const result = await AIToolsService.analyzeCv({ 
        cv_text: cvText, 
        job_id: jobId 
      });
      set({ cvAnalysisResult: result, isAnalyzingCv: false });
      return result;
    } catch (error) {
      set({ 
        cvAnalysisError: error.message || 'Failed to analyze CV',
        isAnalyzingCv: false
      });
      return null;
    }
  },
  
  matchJobs: async (candidateId, limit = 5) => {
    try {
      set({ isMatchingJobs: true, jobMatchError: null });
      const result = await AIToolsService.matchJobs({ 
        candidate_id: candidateId,
        limit
      });
      set({ jobMatches: result, isMatchingJobs: false });
      return result;
    } catch (error) {
      set({ 
        jobMatchError: error.message || 'Failed to match jobs',
        isMatchingJobs: false
      });
      return null;
    }
  },
  
  generateEmail: async (templateId, context) => {
    try {
      set({ isGeneratingEmail: true, emailGenerationError: null });
      const result = await AIToolsService.generateEmail({
        template_id: templateId,
        context
      });
      set({ generatedEmail: result, isGeneratingEmail: false });
      return result;
    } catch (error) {
      set({
        emailGenerationError: error.message || 'Failed to generate email',
        isGeneratingEmail: false
      });
      return null;
    }
  },
  
  // Additional actions...
}));
```

### UI Components

Example of a CV analyzer component:

```tsx
// src/components/CVAnalyzer/CVAnalyzer.tsx
import React, { useState } from 'react';
import { useAIToolsStore } from '../../store/useAIToolsStore';
import { CVResult } from './CVResult';

export const CVAnalyzer: React.FC = () => {
  const { analyzeCv, isAnalyzingCv, cvAnalysisResult, cvAnalysisError } = useAIToolsStore();
  const [cvText, setCvText] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  const handleAnalyze = async () => {
    if (!cvText.trim()) return;
    await analyzeCv(cvText, selectedJobId || undefined);
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setCvText(e.target.result);
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="cv-analyzer">
      <h2>CV Analyzer</h2>
      
      <div className="file-upload">
        <input type="file" onChange={handleFileUpload} accept=".txt,.pdf,.docx" />
        <p>or paste CV text below</p>
      </div>
      
      <textarea
        value={cvText}
        onChange={(e) => setCvText(e.target.value)}
        placeholder="Paste CV text here..."
        rows={10}
      />
      
      <div className="job-selector">
        <label>Optional: Select job for skill gap analysis</label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          <option value="">None</option>
          {/* Job options would be populated here */}
        </select>
      </div>
      
      <button 
        onClick={handleAnalyze} 
        disabled={isAnalyzingCv || !cvText.trim()}
      >
        {isAnalyzingCv ? 'Analyzing...' : 'Analyze CV'}
      </button>
      
      {cvAnalysisError && (
        <div className="error-message">
          Error: {cvAnalysisError}
        </div>
      )}
      
      {cvAnalysisResult && <CVResult result={cvAnalysisResult} />}
    </div>
  );
};
```

## Example Integration Scenarios

### Scenario 1: CV Upload and Analysis in Candidate Registration

```tsx
// In a candidate registration form component
import { useAIToolsStore } from '../../store/useAIToolsStore';
import { useCandidateStore } from '../../store/useDataStore';

const CandidateRegistration = () => {
  const { analyzeCv, cvAnalysisResult, isAnalyzingCv } = useAIToolsStore();
  const { createCandidate, isLoading } = useCandidateStore();
  const [formData, setFormData] = useState({
    // Basic form fields
  });
  const [cvText, setCvText] = useState('');
  const [analysisComplete, setAnalysisComplete] = useState(false);
  
  // Handle CV text input or file upload
  
  const handleAnalyzeCv = async () => {
    const result = await analyzeCv(cvText);
    if (result) {
      // Pre-fill form fields with extracted information
      setFormData(prev => ({
        ...prev,
        skills: result.skills,
        experience: result.total_experience,
        // Other fields from analysis
      }));
      setAnalysisComplete(true);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Combine form data with CV analysis results
    const candidateData = {
      ...formData,
      cv_analysis_result: cvAnalysisResult,
      cv_text: cvText
    };
    
    await createCandidate(candidateData);
    // Handle success, redirect, etc.
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Basic form fields */}
      
      <div className="cv-section">
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Paste CV text here..."
        />
        <button
          type="button"
          onClick={handleAnalyzeCv}
          disabled={isAnalyzingCv || !cvText}
        >
          {isAnalyzingCv ? 'Analyzing...' : 'Analyze CV'}
        </button>
      </div>
      
      {analysisComplete && (
        <div className="analysis-summary">
          <h3>CV Analysis Complete</h3>
          <p>We've extracted the following information:</p>
          <ul>
            <li>Skills: {cvAnalysisResult.skills.length} skills detected</li>
            <li>Experience: {cvAnalysisResult.total_experience}</li>
            <li>Education: {cvAnalysisResult.education.length} entries</li>
          </ul>
          <p>Please review and complete the registration form.</p>
        </div>
      )}
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Scenario 2: Job Matching for Candidates

```tsx
// In a candidate profile page component
import { useAIToolsStore } from '../../store/useAIToolsStore';

const CandidateJobMatches = ({ candidateId }) => {
  const { matchJobs, jobMatches, isMatchingJobs } = useAIToolsStore();
  
  useEffect(() => {
    matchJobs(candidateId, 10);
  }, [candidateId, matchJobs]);
  
  return (
    <div className="job-matches">
      <h2>Recommended Jobs</h2>
      
      {isMatchingJobs ? (
        <div className="loading">Analyzing job matches...</div>
      ) : jobMatches ? (
        <div className="matches-list">
          {jobMatches.matches.map(match => (
            <div key={match.job_id} className="job-match-card">
              <div className="match-header">
                <h3>{match.job_title}</h3>
                <span className="match-score">{match.match_score}%</span>
              </div>
              <p className="company">{match.company_name}</p>
              
              <div className="match-details">
                <div className="matching-skills">
                  <h4>Matching Skills</h4>
                  <ul>
                    {match.matching_skills.map((skill, index) => (
                      <li key={index}>{skill.name} - {skill.level}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="missing-skills">
                  <h4>Skills to Develop</h4>
                  <ul>
                    {match.missing_skills.map((skill, index) => (
                      <li key={index}>{skill.name} - {skill.level}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="match-analysis">
                <p><strong>Experience:</strong> {match.experience_match}</p>
                <p><strong>Education:</strong> {match.education_match}</p>
                <p><strong>Improvement Areas:</strong> {match.improvement_areas}</p>
              </div>
              
              <button className="apply-button">Apply Now</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-matches">
          <p>No job matches available. Try updating your profile with more skills and experience.</p>
        </div>
      )}
    </div>
  );
};
```

### Scenario 3: Email Generation for Candidate Communication

```tsx
// In a messaging or candidate communication component
import { useAIToolsStore } from '../../store/useAIToolsStore';
import { useMessagingStore } from '../../store/useMessagingStore';

const CandidateEmailComposer = ({ candidateId, jobId }) => {
  const { generateEmail, generatedEmail, isGeneratingEmail } = useAIToolsStore();
  const { sendEmail } = useMessagingStore();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [emailContext, setEmailContext] = useState({
    candidate_name: '',
    job_title: '',
    company_name: '',
    interview_date: '',
    interview_time: '',
    interviewer_name: '',
    // Other context variables
  });
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Load candidate and job details to pre-fill context
  useEffect(() => {
    // Fetch candidate and job details
    // Update emailContext with fetched data
  }, [candidateId, jobId]);
  
  const handleGenerateEmail = async () => {
    await generateEmail(selectedTemplate, emailContext);
  };
  
  useEffect(() => {
    if (generatedEmail) {
      setEmailSubject(generatedEmail.subject);
      setEmailBody(generatedEmail.body);
    }
  }, [generatedEmail]);
  
  const handleSendEmail = async () => {
    await sendEmail({
      recipient_id: candidateId,
      subject: emailSubject,
      body: emailBody,
      related_job_id: jobId,
      // Other email fields
    });
    // Handle success, show confirmation, etc.
  };
  
  return (
    <div className="email-composer">
      <h2>Compose Email</h2>
      
      <div className="template-selector">
        <label>Email Template:</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          <option value="">Select a template</option>
          <option value="interview_invitation">Interview Invitation</option>
          <option value="job_offer">Job Offer</option>
          <option value="rejection">Application Rejection</option>
          <option value="follow_up">Interview Follow-up</option>
          {/* Other templates */}
        </select>
        
        <button
          onClick={handleGenerateEmail}
          disabled={isGeneratingEmail || !selectedTemplate}
        >
          {isGeneratingEmail ? 'Generating...' : 'Generate Email'}
        </button>
      </div>
      
      <div className="context-fields">
        <h3>Email Context</h3>
        {/* Form inputs for context variables */}
      </div>
      
      <div className="email-preview">
        <div className="subject-field">
          <label>Subject:</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
        </div>
        
        <div className="body-field">
          <label>Body:</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={10}
          />
        </div>
      </div>
      
      <div className="email-actions">
        <button
          onClick={handleSendEmail}
          disabled={!emailSubject || !emailBody}
        >
          Send Email
        </button>
        <button type="button" className="secondary">
          Save as Draft
        </button>
      </div>
    </div>
  );
};
```

## Best Practices

### 1. Error Handling

Always implement proper error handling for AI features, as they depend on external services that may have rate limits, downtime, or other issues:

```typescript
try {
  set({ isAnalyzingCv: true, cvAnalysisError: null });
  const result = await AIToolsService.analyzeCv(data);
  set({ cvAnalysisResult: result, isAnalyzingCv: false });
  return result;
} catch (error) {
  // Provide meaningful error messages to users
  const errorMessage = error.response?.data?.errors?.message || 
    error.message || 
    'Failed to analyze CV. Please try again later.';
    
  set({ 
    cvAnalysisError: errorMessage,
    isAnalyzingCv: false
  });
  
  // Log error for debugging
  console.error('CV analysis error:', error);
  return null;
}
```

### 2. Loading States

Always show appropriate loading indicators for AI operations, which may take longer than regular API calls:

```tsx
{isAnalyzingCv ? (
  <div className="loading-indicator">
    <Spinner />
    <div className="loading-text">
      <p>Analyzing CV...</p>
      <p className="loading-subtext">Our AI is extracting skills and experience from the CV</p>
    </div>
  </div>
) : (
  // Results or input form
)}
```

### 3. Progressive Enhancement

Implement features that degrade gracefully when AI services are unavailable:

```typescript
// In the UI component
if (cvAnalysisError) {
  return (
    <div className="fallback-form">
      <p>Automatic CV analysis is currently unavailable. Please fill in the details manually:</p>
      {/* Manual input form */}
    </div>
  );
}
```

### 4. User Feedback and Confirmation

For AI-generated content, always give users the opportunity to review and modify before taking action:

```tsx
<div className="ai-generated-content">
  <div className="generated-header">
    <h3>AI-Generated Content</h3>
    <button onClick={handleRegenerateContent}>Regenerate</button>
  </div>
  
  <textarea
    value={generatedContent}
    onChange={(e) => setGeneratedContent(e.target.value)}
  />
  
  <div className="content-actions">
    <button onClick={handleAcceptContent}>Accept & Continue</button>
    <button onClick={handleEditManually}>Edit Manually</button>
  </div>
</div>
```

### 5. Contextual Prompting

Provide as much context as possible to the AI services for better results:

```typescript
// Bad
const result = await AIToolsService.generateQuestions({ job_id: jobId });

// Good
const result = await AIToolsService.generateQuestions({
  job_id: jobId,
  candidate_id: candidateId,  // Provides candidate context
  focus_areas: ["technical", "communication"],  // Specifies types of questions
  difficulty: "advanced",  // Specifies difficulty level
  count: 8  // Specifies number of questions
});
```

### 6. Caching Results

For operations that may be expensive or time-consuming, consider caching results:

```typescript
// In the store
const analyzeCv = async (cvText, jobId) => {
  // Check if we already have results for this CV text
  const cacheKey = `${cvText.substring(0, 100)}${jobId || ''}`;
  const cachedResult = localStorage.getItem(`cv_analysis_${cacheKey}`);
  
  if (cachedResult) {
    try {
      const parsed = JSON.parse(cachedResult);
      set({ cvAnalysisResult: parsed, isAnalyzingCv: false });
      return parsed;
    } catch (e) {
      // Cache parsing failed, continue with API call
    }
  }
  
  try {
    set({ isAnalyzingCv: true, cvAnalysisError: null });
    const result = await AIToolsService.analyzeCv({ cv_text: cvText, job_id: jobId });
    
    // Cache the result (with expiration)
    localStorage.setItem(`cv_analysis_${cacheKey}`, JSON.stringify(result));
    localStorage.setItem(`cv_analysis_${cacheKey}_timestamp`, Date.now().toString());
    
    set({ cvAnalysisResult: result, isAnalyzingCv: false });
    return result;
  } catch (error) {
    // Error handling
  }
};
```

### 7. Data Privacy Considerations

Be mindful of data privacy when using AI services:

```typescript
// Allow users to opt out of AI analysis
const [optOutOfAIAnalysis, setOptOutOfAIAnalysis] = useState(false);

// In the UI
<div className="privacy-options">
  <input
    type="checkbox"
    id="opt-out-ai"
    checked={optOutOfAIAnalysis}
    onChange={(e) => setOptOutOfAIAnalysis(e.target.checked)}
  />
  <label htmlFor="opt-out-ai">
    Skip AI analysis and enter information manually
  </label>
</div>
```