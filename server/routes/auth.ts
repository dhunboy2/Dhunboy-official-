import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';
import { YouTubeService } from '../services/youtube.js';
import { resolveEffectiveRedirectUri, resolveAppUrl } from '../config/env.js';

const router = Router();

export function getEffectiveRedirectUri(req?: Request): string {
  const host = req ? (req.headers['x-forwarded-host'] || req.get('host') || '') : '';
  const proto = req ? (req.headers['x-forwarded-proto'] || req.protocol || 'https') : 'https';
  return resolveEffectiveRedirectUri(String(host), String(proto));
}

function handleStatusRequest(req: Request, res: Response) {
  const settings = db.getSettings();
  const creds = db.getGoogleCredentials();
  const token = db.getStoredToken();
  const channel = db.getChannel();

  const isConnected = !!(token && channel);
  const isExpired = token ? token.expiryDate < Date.now() : true;
  const redirectUri = getEffectiveRedirectUri(req);

  res.json({
    connected: isConnected,
    isExpired,
    channel,
    credentialsConfigured: creds.isConfigured,
    clientIdConfigured: !!creds.clientId,
    redirectUri,
    hasGeminiKey: db.hasGeminiKey(),
    hasYouTubeApiKey: db.hasYouTubeApiKey(),
    tokenExpiryDate: token?.expiryDate || null,
    scopes: token?.scope || [],
    diagnostics: {
      googleClientId: creds.clientId ? `Configured (${creds.clientId.substring(0, 10)}...)` : 'Missing',
      googleClientSecret: creds.clientSecret ? 'Configured & Ready' : 'Missing',
      geminiApiKey: db.hasGeminiKey() ? 'Configured & Online' : 'Missing',
      youtubeApiKey: db.hasYouTubeApiKey() ? 'Configured' : 'Optional (OAuth Active)',
      effectiveRedirectUri: redirectUri,
      appUrl: resolveAppUrl() || (req ? `${req.protocol}://${req.get('host')}` : 'Auto-detected')
    }
  });
}

// GET /api/auth/youtube/status & GET /api/auth/status
router.get('/youtube/status', handleStatusRequest);
router.get('/status', handleStatusRequest);

// POST /api/auth/credentials
router.post('/credentials', (req, res) => {
  const { clientId, clientSecret } = req.body;
  if (!clientId || !clientSecret) {
    return res.status(400).json({ error: 'Both Google Client ID and Client Secret are required.' });
  }

  db.setGoogleCredentials(clientId, clientSecret);
  res.json({ success: true, message: 'Google OAuth credentials saved securely on server.' });
});

// POST /api/auth/keys
router.post('/keys', (req, res) => {
  const { geminiApiKey, youtubeApiKey, clientId, clientSecret } = req.body;

  if (clientId && clientSecret) {
    db.setGoogleCredentials(clientId, clientSecret);
  }
  if (geminiApiKey !== undefined) {
    db.setGeminiApiKey(geminiApiKey);
  }
  if (youtubeApiKey !== undefined) {
    db.setYouTubeApiKey(youtubeApiKey);
  }

  res.json({
    success: true,
    message: 'API keys & OAuth credentials updated successfully.',
    hasGeminiKey: db.hasGeminiKey(),
    credentialsConfigured: db.getGoogleCredentials().isConfigured
  });
});

// Helper for initiating OAuth
function initiateOAuth(req: Request, res: Response) {
  try {
    const redirectUri = getEffectiveRedirectUri(req);
    const state = YouTubeService.generateState();
    const url = YouTubeService.getOAuthUrl(redirectUri, state);

    // If client requested JSON
    const acceptsJson = req.xhr ||
      req.query.format === 'json' ||
      (req.headers.accept && req.headers.accept.includes('application/json') && !req.headers.accept.includes('text/html'));

    if (acceptsJson) {
      return res.json({ url, redirectUri, state });
    }

    // Direct browser redirect
    return res.redirect(url);
  } catch (err: any) {
    return res.status(400).json({
      error: err.message,
      troubleshooting: 'Please verify that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured in the server environment.'
    });
  }
}

// GET /api/auth/youtube & GET /api/auth/youtube/url
router.get('/youtube', initiateOAuth);
router.get('/youtube/url', initiateOAuth);

// GET /api/auth/youtube/callback
router.get('/youtube/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const expectedRedirectUri = getEffectiveRedirectUri(req);

  // 1. Check for OAuth errors returned directly by Google
  if (error) {
    let errorCategory = 'GOOGLE_OAUTH_ERROR';
    let troubleshooting = 'Authentication was not completed by Google.';

    if (error === 'access_denied') {
      errorCategory = 'ACCESS_DENIED';
      troubleshooting = 'You cancelled the OAuth consent screen or denied permission. Please try again and approve the requested YouTube permissions to connect Dhunboy Official.';
    } else if (error === 'redirect_uri_mismatch') {
      errorCategory = 'REDIRECT_URI_MISMATCH';
      troubleshooting = `The redirect URI does not match Google Cloud Console. Add "${expectedRedirectUri}" to "Authorized redirect URIs" in your OAuth 2.0 Web Client.`;
    }

    return renderOAuthErrorPage(res, {
      category: errorCategory,
      code: String(error),
      message: String(error_description || error),
      troubleshooting,
      expectedRedirectUri
    });
  }

  // 2. Validate state parameter
  if (!state || !YouTubeService.validateState(String(state))) {
    return renderOAuthErrorPage(res, {
      category: 'INVALID_OAUTH_STATE',
      code: 'state_mismatch',
      message: 'The OAuth state parameter is invalid or the authentication session has expired.',
      troubleshooting: 'For security against CSRF attacks, states expire after 15 minutes. Please restart the connection flow from Settings.',
      expectedRedirectUri
    });
  }

  // 3. Validate authorization code
  if (!code || typeof code !== 'string') {
    return renderOAuthErrorPage(res, {
      category: 'MISSING_AUTHORIZATION_CODE',
      code: 'no_code',
      message: 'Google OAuth did not provide an authorization code.',
      troubleshooting: 'Please return to Settings and click "Connect YouTube Channel" again.',
      expectedRedirectUri
    });
  }

  // 4. Exchange code for tokens and fetch verified YouTube channel
  try {
    const verifiedChannel = await YouTubeService.exchangeCodeForTokens(code, expectedRedirectUri);

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>YouTube Connected - Dhunboy AI Manager</title>
          <meta http-equiv="refresh" content="2;url=/dashboard?auth=success&channel=${encodeURIComponent(verifiedChannel.title)}&channelId=${encodeURIComponent(verifiedChannel.id)}" />
          <style>
            body {
              background: #090d16;
              color: #f8fafc;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 24px;
              box-sizing: border-box;
            }
            .card {
              background: #0f172a;
              border: 1px solid #1e293b;
              border-radius: 16px;
              padding: 40px;
              max-width: 520px;
              width: 100%;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            }
            .icon {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              background: rgba(16, 185, 129, 0.15);
              border: 2px solid #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              color: #10b981;
              font-size: 32px;
            }
            h1 { font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #ffffff; }
            .channel-name { font-size: 18px; color: #10b981; font-weight: 700; margin: 12px 0 6px; }
            .channel-id { font-family: monospace; font-size: 13px; color: #94a3b8; background: #1e293b; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 20px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
            .btn {
              display: inline-block;
              background: #ef4444;
              color: #ffffff;
              font-weight: 600;
              font-size: 14px;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              transition: background 0.2s;
            }
            .btn:hover { background: #dc2626; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>YouTube Channel Connected!</h1>
            <div class="channel-name">${escapeHtml(verifiedChannel.title)}</div>
            <div class="channel-id">Channel ID: ${escapeHtml(verifiedChannel.id)}</div>
            <p>Your OAuth 2.0 refresh tokens have been encrypted with AES-256 and stored safely on the server. Dhunboy AI YouTube Manager is now ready.</p>
            <a class="btn" href="/dashboard?auth=success&channel=${encodeURIComponent(verifiedChannel.title)}&channelId=${encodeURIComponent(verifiedChannel.id)}">Open Manager Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[OAuth Callback Error]:', err.message);

    let category = 'TOKEN_EXCHANGE_ERROR';
    let troubleshooting = 'Failed to complete OAuth token exchange or channel verification.';
    const msg = err.message || '';

    if (msg.includes('invalid_grant')) {
      category = 'INVALID_GRANT';
      troubleshooting = 'The authorization code was expired, invalid, or already redeemed. Please restart the OAuth flow.';
    } else if (msg.includes('invalid_client')) {
      category = 'INVALID_CLIENT';
      troubleshooting = 'Google OAuth Client ID or Client Secret is rejected by Google. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your server environment match your Google Cloud Console OAuth 2.0 Web Client.';
    } else if (msg.includes('redirect_uri_mismatch')) {
      category = 'REDIRECT_URI_MISMATCH';
      troubleshooting = `Google rejected the redirect URI. Ensure "${expectedRedirectUri}" is listed under Authorized redirect URIs in Google Cloud Console.`;
    } else if (msg.includes('NO_CHANNEL_FOUND') || msg.includes('No YouTube channel found')) {
      category = 'NO_YOUTUBE_CHANNEL_FOUND';
      troubleshooting = 'The authenticated Google account does not own a YouTube channel. Please log in with the Google account associated with "Dhunboy Official".';
    } else if (msg.includes('YouTube API Error') || msg.includes('accessNotConfigured') || msg.includes('SERVICE_DISABLED')) {
      category = 'YOUTUBE_API_DISABLED';
      troubleshooting = 'The YouTube Data API v3 may not be enabled in your Google Cloud Project. Visit Google Cloud Console -> APIs & Services -> Library -> YouTube Data API v3, and enable it.';
    }

    renderOAuthErrorPage(res, {
      category,
      code: 'exchange_failure',
      message: msg,
      troubleshooting,
      expectedRedirectUri
    });
  }
});

// Helper for rendering clear, actionable OAuth error page
function renderOAuthErrorPage(res: Response, info: {
  category: string;
  code: string;
  message: string;
  troubleshooting: string;
  expectedRedirectUri: string;
}) {
  res.status(400).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>YouTube OAuth Error - Dhunboy AI Manager</title>
        <style>
          body {
            background: #090d16;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
          }
          .card {
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 36px;
            max-width: 580px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .badge {
            display: inline-block;
            background: rgba(239, 68, 68, 0.15);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.3);
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            padding: 4px 10px;
            border-radius: 9999px;
            margin-bottom: 12px;
          }
          h1 { font-size: 20px; font-weight: 800; margin: 0 0 12px; color: #ffffff; }
          .error-box {
            background: #181c2b;
            border-left: 4px solid #ef4444;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
            font-size: 13px;
            color: #fca5a5;
            word-break: break-word;
          }
          .section-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 8px;
            letter-spacing: 0.04em;
          }
          .guide {
            background: #141b2d;
            border: 1px solid #23304a;
            border-radius: 8px;
            padding: 14px 16px;
            font-size: 13px;
            color: #cbd5e1;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .uri-code {
            display: block;
            background: #090d16;
            border: 1px solid #26334d;
            border-radius: 6px;
            padding: 8px 12px;
            font-family: monospace;
            font-size: 12px;
            color: #38bdf8;
            margin-top: 8px;
            word-break: break-all;
          }
          .checklist {
            margin: 0 0 24px;
            padding-left: 20px;
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
          }
          .actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          }
          .btn {
            display: inline-block;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 18px;
            border-radius: 8px;
            text-decoration: none;
            transition: all 0.2s;
          }
          .btn-secondary { background: #1e293b; color: #cbd5e1; }
          .btn-secondary:hover { background: #334155; }
          .btn-primary { background: #ef4444; color: #ffffff; }
          .btn-primary:hover { background: #dc2626; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">Error Category: ${escapeHtml(info.category)}</span>
          <h1>YouTube Authentication Failed</h1>
          <div class="error-box">${escapeHtml(info.message)}</div>
          
          <div class="section-title">Troubleshooting Information</div>
          <div class="guide">
            ${escapeHtml(info.troubleshooting)}
            ${info.expectedRedirectUri ? `<br/><span style="color:#94a3b8; font-size:11px; margin-top:6px; display:inline-block;">Expected Authorized Redirect URI:</span><code class="uri-code">${escapeHtml(info.expectedRedirectUri)}</code>` : ''}
          </div>

          <div class="section-title">Configuration Checklist</div>
          <ul class="checklist">
            <li>Google Cloud Console project has <strong>YouTube Data API v3</strong> enabled.</li>
            <li>OAuth Consent Screen is configured (User type External/Internal) with scopes requested.</li>
            <li>OAuth Client ID type is <strong>Web application</strong>.</li>
            <li>Authorized redirect URI in Google Cloud matches the expected URI above.</li>
            <li>Google account used to log in owns the <strong>Dhunboy Official</strong> YouTube channel.</li>
          </ul>

          <div class="actions">
            <a class="btn btn-secondary" href="/settings">Go to Settings</a>
            <a class="btn btn-primary" href="/api/auth/youtube">Retry Connection</a>
          </div>
        </div>
      </body>
    </html>
  `);
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// POST /api/auth/youtube/disconnect & POST /api/auth/disconnect
function handleDisconnect(req: Request, res: Response) {
  db.clearOAuthToken();
  db.logActivity({
    action: 'Disconnected YouTube Channel',
    endpoint: '/api/auth/youtube/disconnect',
    status: 'success',
    initiatedBy: 'user'
  });
  res.json({ success: true, message: 'YouTube channel disconnected.' });
}

router.post('/youtube/disconnect', handleDisconnect);
router.post('/disconnect', handleDisconnect);

export default router;
