import { Router } from 'express';
import { db } from '../db/store.js';
import { DescriptionTemplate } from '../types.js';
import { testGeminiConnection } from '../services/gemini.js';
import { resolveEffectiveRedirectUri, resolveAppUrl } from '../config/env.js';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
  const settings = db.getSettings();
  const credentials = db.getGoogleCredentials();
  const host = req.headers['x-forwarded-host'] || req.get('host') || '';
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const redirectUri = resolveEffectiveRedirectUri(String(host), String(proto));

  res.json({
    settings,
    credentialsConfigured: credentials.isConfigured,
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 12)}...` : '',
    hasGeminiKey: db.hasGeminiKey(),
    hasYouTubeApiKey: db.hasYouTubeApiKey(),
    redirectUri,
    appUrl: resolveAppUrl() || `${proto}://${host}`,
    diagnostics: {
      googleClientId: credentials.clientId ? `Configured (${credentials.clientId.substring(0, 10)}...)` : 'Missing',
      googleClientSecret: credentials.clientSecret ? 'Configured & Encrypted' : 'Missing',
      geminiApiKey: db.hasGeminiKey() ? 'Configured & Active' : 'Missing',
      youtubeApiKey: db.hasYouTubeApiKey() ? 'Configured' : 'Optional (Using OAuth)',
      redirectUri,
      appUrl: resolveAppUrl() || `${proto}://${host}`
    }
  });
});

// POST /api/settings/test-connections
router.post('/test-connections', async (req, res) => {
  try {
    const creds = db.getGoogleCredentials();
    const token = db.getStoredToken();
    const geminiTest = await testGeminiConnection();

    res.json({
      success: true,
      gemini: {
        status: geminiTest.success ? 'online' : 'offline',
        model: geminiTest.model || null,
        message: geminiTest.message
      },
      oauth: {
        status: creds.isConfigured ? 'configured' : 'missing',
        clientIdLoaded: !!creds.clientId,
        clientSecretLoaded: !!creds.clientSecret,
        channelConnected: !!token,
        tokenValid: token ? token.expiryDate > Date.now() : false
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/settings/keys
router.post('/keys', (req, res) => {
  try {
    const body = (typeof req.body === 'object' && req.body !== null) ? req.body : {};
    const { geminiApiKey, youtubeApiKey, clientId, clientSecret, encryptionSecret } = body;

    if (clientId || clientSecret) {
      db.setGoogleCredentials(clientId, clientSecret);
    }
    if (geminiApiKey !== undefined && geminiApiKey !== null) {
      db.setGeminiApiKey(String(geminiApiKey));
    }
    if (youtubeApiKey !== undefined && youtubeApiKey !== null) {
      db.setYouTubeApiKey(String(youtubeApiKey));
    }
    if (encryptionSecret) {
      db.setEncryptionSecret(String(encryptionSecret));
    }

    const creds = db.getGoogleCredentials();
    return res.json({
      success: true,
      message: 'Configuration and API keys updated successfully.',
      hasGeminiKey: db.hasGeminiKey(),
      credentialsConfigured: creds.isConfigured,
      clientIdLoaded: !!creds.clientId,
      clientSecretLoaded: !!creds.clientSecret
    });
  } catch (err: any) {
    console.error('Error in settings/keys:', err);
    return res.status(200).json({
      success: false,
      error: err.message || 'Failed saving keys',
      hasGeminiKey: db.hasGeminiKey(),
      credentialsConfigured: db.getGoogleCredentials().isConfigured
    });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// GET /api/settings/templates
router.get('/templates', (req, res) => {
  const templates = db.getDescriptionTemplates();
  res.json({ templates });
});

// POST /api/settings/templates
router.post('/templates', (req, res) => {
  const { name, category, template, isDefault } = req.body;
  if (!name || !template) {
    return res.status(400).json({ error: 'Name and template content are required' });
  }

  const newTpl: DescriptionTemplate = {
    id: `tpl-${Date.now()}`,
    name,
    category: category || 'Custom',
    template,
    isDefault: !!isDefault
  };

  db.addDescriptionTemplate(newTpl);
  res.json({ success: true, template: newTpl });
});

// PUT /api/settings/templates/:id
router.put('/templates/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateDescriptionTemplate(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ success: true, template: updated });
});

// DELETE /api/settings/templates/:id
router.delete('/templates/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteDescriptionTemplate(id);
  res.json({ success: deleted });
});

export default router;
