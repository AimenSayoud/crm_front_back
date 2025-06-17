// src/services/openai/config.ts
// Configuration for OpenAI service

// Check session storage for key on initial load
let openaiKey: string | null = null;

if (typeof window !== 'undefined') {
  openaiKey = sessionStorage.getItem('openai_api_key');
}

export const setOpenAIKey = (key: string) => {
  openaiKey = key;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('openai_api_key', key);
  }
};

export const getOpenAIKey = (): string => {
  if (!openaiKey) {
    throw new Error('OpenAI API key not set. Please set a key in settings.');
  }
  return openaiKey;
};

// Default model to use
export const DEFAULT_MODEL = 'gpt-4o-mini';

// OpenAI API endpoint
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';