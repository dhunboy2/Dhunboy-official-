import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface EnvValidationResult {
  hasEncryptionSecret: boolean;
  secretLength: number;
  googleClientIdConfigured: boolean;
  googleClientSecretConfigured: boolean;
  googleRedirectUriConfigured: boolean;
  geminiApiKeyConfigured: boolean;
  youtubeApiKeyConfigured: boolean;
  redirectUri: string;
  appUrl: string;
}

/**
 * Universal resolver for Google OAuth Client ID across common alias names
 */
export function resolveGoogleClientId(): string {
  const val = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    process.env.YOUTUBE_CLIENT_ID ||
    process.env.GOOGLE_ID ||
    process.env.GOOGLE_CLIENTID ||
    ''
  ).trim();
  // Strip accidental quotes or http prefixes if pasted by mistake
  return val.replace(/^https?:\/\//i, '').replace(/["']/g, '').trim();
}

/**
 * Universal resolver for Google OAuth Client Secret across common alias names
 */
export function resolveGoogleClientSecret(): string {
  const val = (
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.CLIENT_SECRET ||
    process.env.VITE_GOOGLE_CLIENT_SECRET ||
    process.env.YOUTUBE_CLIENT_SECRET ||
    process.env.GOOGLE_SECRET ||
    process.env.GOOGLE_CLIENTSECRET ||
    ''
  ).trim();
  return val.replace(/["']/g, '').trim();
}

/**
 * Universal resolver for Gemini AI API Key across common alias names
 */
export function resolveGeminiApiKey(): string {
  const val = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GEMINI_API ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GEMINI ||
    ''
  ).trim();
  return val.replace(/["']/g, '').trim();
}

/**
 * Universal resolver for YouTube Data API Key across common alias names
 */
export function resolveYouTubeApiKey(): string {
  const val = (
    process.env.YOUTUBE_API_KEY ||
    process.env.YT_API_KEY ||
    process.env.YOUTUBE_API ||
    process.env.YT_API ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();
  return val.replace(/["']/g, '').trim();
}

/**
 * Universal resolver for App URL across Vercel and custom domains
 */
export function resolveAppUrl(): string {
  let url = (
    process.env.APP_URL ||
    process.env.URL ||
    process.env.PUBLIC_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    process.env.VITE_APP_URL ||
    ''
  ).trim().replace(/\/+$/, '');

  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Computes the exact redirect URI for YouTube OAuth callback
 */
export function resolveEffectiveRedirectUri(reqHost?: string, reqProto?: string): string {
  const custom = (
    process.env.GOOGLE_REDIRECT_URI ||
    process.env.REDIRECT_URI ||
    process.env.VITE_GOOGLE_REDIRECT_URI ||
    ''
  ).trim();

  if (custom) {
    return custom;
  }

  const appUrl = resolveAppUrl();
  if (appUrl) {
    return `${appUrl}/api/auth/youtube/callback`;
  }

  if (reqHost) {
    const proto = reqProto || 'https';
    return `${proto}://${reqHost}/api/auth/youtube/callback`;
  }

  return '/api/auth/youtube/callback';
}

/**
 * Validates required server-side environment variables at startup.
 * Never prints, logs, or returns sensitive secret values.
 */
export function validateEnvironment(): EnvValidationResult {
  let secret = process.env.ENCRYPTION_SECRET;
  const isVercel = !!process.env.VERCEL;
  const dataDir = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
  const vaultPath = path.resolve(dataDir, '.secret_vault');

  if (!secret && fs.existsSync(vaultPath)) {
    try {
      secret = fs.readFileSync(vaultPath, 'utf-8').trim();
      process.env.ENCRYPTION_SECRET = secret;
    } catch {
      // ignore
    }
  }

  // Graceful fallback for Vercel / serverless deployments if not configured yet
  if (!secret || secret.trim().length < 32) {
    const fallbackSeed = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_URL || 'dhunboy_official_lobish_sarma_nepali_music_production_vault_2026';
    secret = crypto.createHash('sha256').update(fallbackSeed).digest('hex');
    process.env.ENCRYPTION_SECRET = secret;
  }

  const clientId = resolveGoogleClientId();
  const clientSecret = resolveGoogleClientSecret();
  const geminiApiKey = resolveGeminiApiKey();
  const ytApiKey = resolveYouTubeApiKey();
  const redirectUri = resolveEffectiveRedirectUri();
  const appUrl = resolveAppUrl();

  return {
    hasEncryptionSecret: true,
    secretLength: secret.length,
    googleClientIdConfigured: !!clientId,
    googleClientSecretConfigured: !!clientSecret,
    googleRedirectUriConfigured: !!(process.env.GOOGLE_REDIRECT_URI || process.env.REDIRECT_URI),
    geminiApiKeyConfigured: !!geminiApiKey,
    youtubeApiKeyConfigured: !!ytApiKey,
    redirectUri,
    appUrl
  };
}
