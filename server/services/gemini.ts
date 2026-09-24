import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Stable models waterfall in order of current availability
export const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

export const GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Resilient generation function with model waterfall and graceful error handling.
 * Avoids exhausting retries and throws clean errors so calling services
 * can immediately provide high-speed fallback metadata and ideas.
 */
export async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}): Promise<{ text: string }> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('Gemini API client not configured');
  }

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await client.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });

      if (response && response.text) {
        return { text: response.text };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || String(err)).toLowerCase();
      const isQuotaOrTransient =
        errMsg.includes('503') ||
        errMsg.includes('high demand') ||
        errMsg.includes('unavailable') ||
        errMsg.includes('429') ||
        errMsg.includes('resource_exhausted') ||
        errMsg.includes('quota') ||
        errMsg.includes('overloaded');

      if (isQuotaOrTransient) {
        // Skip quickly to next candidate model without long blocking delays
        console.warn(`[Gemini Resilient] Model ${model} returned transient/quota limitation, trying fallback...`);
        continue;
      } else {
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models currently unavailable');
}
