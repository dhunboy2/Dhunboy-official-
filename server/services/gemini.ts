import { GoogleGenAI } from '@google/genai';
import { db } from '../db/store.js';

let aiInstance: GoogleGenAI | null = null;
let currentKeyUsed: string = '';

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = db.getGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  if (!aiInstance || currentKeyUsed !== apiKey) {
    currentKeyUsed = apiKey;
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
    throw new Error('Gemini API client not configured. Please add GEMINI_API_KEY in Vercel environment or Settings.');
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

/**
 * Validates Gemini API connection with a lightweight prompt
 */
export async function testGeminiConnection(): Promise<{ success: boolean; model?: string; message: string }> {
  const client = getGeminiClient();
  if (!client) {
    return {
      success: false,
      message: 'Gemini API key is not configured. Set GEMINI_API_KEY in environment or Settings.'
    };
  }

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await client.models.generateContent({
        model,
        contents: 'Reply with the word "CONNECTED" only.'
      });
      if (res && res.text) {
        return {
          success: true,
          model,
          message: `Successfully connected to Gemini AI (${model})`
        };
      }
    } catch (err: any) {
      // try next
    }
  }

  return {
    success: false,
    message: 'Could not connect to Gemini API. Please check your API key validity.'
  };
}
