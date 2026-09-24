import 'dotenv/config';
import fs from 'fs';
import path from 'path';

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
  const vaultPath = path.resolve(process.cwd(), 'data', '.secret_vault');

  if (!secret && fs.existsSync(vaultPath)) {
    try {
      secret = fs.readFileSync(vaultPath, 'utf-8').trim();
      process.env.ENCRYPTION_SECRET = secret;
    } catch {
      // ignore
    }
  }

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      'CONFIGURATION_ERROR: ENCRYPTION_SECRET is required in the server environment (or .env file). ' +
      'It must be configured on the server with at least 32 cryptographically secure characters to encrypt OAuth refresh tokens at rest.'
    );
  }

  if (secret.trim().length < 32) {
    throw new Error(
      'CONFIGURATION_ERROR: ENCRYPTION_SECRET is too short. ' +
      'It must contain at least 32 characters (preferably 64 random bytes encoded as a 128-character hexadecimal string).'
    );
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
