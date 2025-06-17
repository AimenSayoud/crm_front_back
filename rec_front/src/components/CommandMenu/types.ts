// src/components/ai-assistant/CommandMenu/types.ts
import { ReactNode } from 'react';
import { Candidate, Company } from '@/types';

export interface Command {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  action: () => void;
  requiresEntity?: 'candidate' | 'company' | 'either' | null;
}

export interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (candidate: Candidate) => void;
  onSelectCompany: (company: Company) => void;
  onInitiateEntitySelection: (commandRequires: 'candidate' | 'company' | 'either' | null, commandId: string) => void;
  selectedEntity?: Candidate | Company | null;
}

export type CommandStep = 'initial' | 'search_candidate' | 'search_company';

// Command IDs
export const CMD_SEARCH_CANDIDATE = 'search_candidate';
export const CMD_SEARCH_COMPANY = 'search_company';
export const CMD_GENERATE_EMAIL = 'generate_email';
export const CMD_GENERATE_SUGGESTIONS = 'generate_suggestions';
export const CMD_GENERATE_INTERVIEW_QUESTIONS = 'generate_interview_questions';
export const CMD_GENERATE_JOB_DESCRIPTION = 'generate_job_description';
export const CMD_GENERATE_CANDIDATE_FEEDBACK = 'generate_candidate_feedback';
export const CMD_ANALYZE_CV = 'analyze_cv';
export const CMD_OPEN_CHAT = 'open_chat';
