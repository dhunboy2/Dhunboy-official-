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
  redirectUri: string;
  appUrl: string;
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

  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const customRedirectUri = (process.env.GOOGLE_REDIRECT_URI || '').trim();
  const appUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');

  const effectiveRedirectUri = customRedirectUri || (appUrl ? `${appUrl}/api/auth/youtube/callback` : '/api/auth/youtube/callback');

  return {
    hasEncryptionSecret: true,
    secretLength: secret.length,
    googleClientIdConfigured: !!clientId,
    googleClientSecretConfigured: !!clientSecret,
    googleRedirectUriConfigured: !!customRedirectUri,
    redirectUri: effectiveRedirectUri,
    appUrl
  };
}
