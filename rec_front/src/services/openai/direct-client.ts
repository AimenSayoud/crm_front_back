// src/services/openai/direct-client.ts
import { getOpenAIKey, OPENAI_API_URL, DEFAULT_MODEL } from './config';

// Direct OpenAI call fallback if backend is unavailable
export const callOpenAIDirectly = async (
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  const apiKey = getOpenAIKey();
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
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

export default callOpenAIDirectly;