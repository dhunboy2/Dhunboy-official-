import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Key,
  Copy,
  CheckCircle2,
  ExternalLink,
  Youtube,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  FileText,
  Plus,
  Trash2,
  Check,
  Zap,
  Globe,
  HelpCircle,
  Cpu
} from 'lucide-react';
import { api } from '../api';
import { AppSettings, DescriptionTemplate, YouTubeChannel } from '../types';

interface SettingsProps {
  channel: YouTubeChannel | null;
  isConnected: boolean;
  onRefreshAuth: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  channel,
  isConnected,
  onRefreshAuth
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [templates, setTemplates] = useState<DescriptionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Unified Credentials & Keys
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSaved, setKeysSaved] = useState(false);

  // Status & Diagnostics
  const [redirectUri, setRedirectUri] = useState('');
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [hasGoogleCreds, setHasGoogleCreds] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Testing Connections
  const [testingConnections, setTestingConnections] = useState(false);
  const [testResult, setTestResult] = useState<{
    gemini?: { status: string; model?: string | null; message: string };
    oauth?: { status: string; clientIdLoaded: boolean; clientSecretLoaded: boolean; channelConnected: boolean };
  } | null>(null);

  // Connect YouTube state
  const [oauthError, setOauthError] = useState<string | null>(null);

  // Template edit modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState('Nepali Music');
  const [tplContent, setTplContent] = useState('');
  const [savingTpl, setSavingTpl] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, templatesRes, authStatusRes] = await Promise.all([
        api.getSettings(),
        api.getTemplates(),
        api.getAuthStatus().catch(() => null)
      ]);

      setSettings(settingsRes.settings);
      setTemplates(templatesRes.templates);
      setHasGeminiKey(settingsRes.hasGeminiKey || authStatusRes?.hasGeminiKey || false);
      setHasGoogleCreds(settingsRes.credentialsConfigured || authStatusRes?.credentialsConfigured || false);

      const effectiveUri = authStatusRes?.redirectUri || settingsRes.redirectUri || `${window.location.origin}/api/auth/youtube/callback`;
      setRedirectUri(effectiveUri);

      if (settingsRes.diagnostics || authStatusRes?.diagnostics) {
        setDiagnostics(settingsRes.diagnostics || authStatusRes?.diagnostics);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveAllKeys = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingKeys(true);
      const payload: { clientId?: string; clientSecret?: string; geminiApiKey?: string; youtubeApiKey?: string } = {};

      if (clientId.trim()) payload.clientId = clientId.trim();
      if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();
      if (geminiApiKey.trim()) payload.geminiApiKey = geminiApiKey.trim();
      if (youtubeApiKey.trim()) payload.youtubeApiKey = youtubeApiKey.trim();

      const res = await api.saveAllKeys(payload);
      setKeysSaved(true);
      setTimeout(() => setKeysSaved(false), 4000);

      // Auto run connection test to confirm
      await handleTestConnections();
      await loadData();
      onRefreshAuth();
    } catch (err: any) {
      alert(`Error saving credentials: ${err.message}`);
    } finally {
      setSavingKeys(false);
    }
  };

  const handleTestConnections = async () => {
    try {
      setTestingConnections(true);
      setTestResult(null);
      const res = await api.testConnections();
      setTestResult({
        gemini: res.gemini,
        oauth: res.oauth
      });
      if (res.gemini?.status === 'online') {
        setHasGeminiKey(true);
      }
    } catch (err: any) {
      setTestResult({
        gemini: { status: 'offline', message: `Test failed: ${err.message}` },
        oauth: { status: 'error', clientIdLoaded: false, clientSecretLoaded: false, channelConnected: false }
      });
    } finally {
      setTestingConnections(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Dhunboy Official from YouTube?')) return;
    try {
      await api.disconnect();
      onRefreshAuth();
      await loadData();
    } catch (err: any) {
      alert(`Disconnect failed: ${err.message}`);
    }
  };

  const handleCopyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName || !tplContent) {
      alert('Name and content are required');
      return;
    }

    try {
      setSavingTpl(true);
      await api.createTemplate({
        name: tplName,
        category: tplCategory,
        template: tplContent,
        isDefault: false
      });
      setShowTemplateModal(false);
      setTplName('');
      setTplContent('');
      await loadData();
    } catch (err: any) {
      alert(`Failed to save template: ${err.message}`);
    } finally {
      setSavingTpl(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-red-500" />
            <span>Channel & API Cloud Integration Settings</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Google Cloud OAuth 2.0, Gemini AI Models, and YouTube Data API v3 configuration for Dhunboy Official.
          </p>
        </div>

        <button
          onClick={handleTestConnections}
          disabled={testingConnections}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-md transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testingConnections ? 'animate-spin text-red-400' : 'text-emerald-400'}`} />
          <span>{testingConnections ? 'Testing Connections...' : 'Test All Connections'}</span>
        </button>
      </div>

      {/* Diagnostics Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gemini AI Status */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gemini AI Engine</span>
            </span>
            {hasGeminiKey ? (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Online
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Key Missing
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white">
            {hasGeminiKey ? 'Gemini 2.5 Flash Ready' : 'AI Assistant Offline'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {hasGeminiKey
              ? 'Multi-lingual Co-Producer (Hindi/Nepali/English) active.'
              : 'Add GEMINI_API_KEY below or in Vercel settings.'}
          </p>
        </div>

        {/* Google OAuth Credentials */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Google OAuth</span>
            </span>
            {hasGoogleCreds ? (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Configured
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Missing
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white">
            {hasGoogleCreds ? 'Client ID & Secret Loaded' : 'Credentials Required'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {hasGoogleCreds ? 'OAuth 2.0 Web Client active on server.' : 'Required for YouTube channel connection.'}
          </p>
        </div>

        {/* YouTube Channel Link */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube Channel</span>
            </span>
            {isConnected ? (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Not Linked
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-white">
            {channel?.title || 'Dhunboy Official'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isConnected ? 'Tokens encrypted & auto-refreshed.' : 'Click "Connect YouTube" below to authenticate.'}
          </p>
        </div>

        {/* Redirect URI Status */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Redirect URI</span>
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Auto-Matched
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-200 truncate">
            {redirectUri}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Must match Google Cloud Console Authorized URI.
          </p>
        </div>
      </div>

      {/* Test Results Banner (if executed) */}
      {testResult && (
        <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
          testResult.gemini?.status === 'online'
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            {testResult.gemini?.status === 'online' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <span>Connection Diagnostic Report</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <strong>Gemini AI Engine:</strong>{' '}
              {testResult.gemini?.status === 'online'
                ? `✅ ${testResult.gemini.message}`
                : `⚠️ ${testResult.gemini?.message || 'Offline'}`}
            </div>
            <div>
              <strong>Google OAuth:</strong>{' '}
              {testResult.oauth?.clientIdLoaded && testResult.oauth?.clientSecretLoaded
                ? '✅ Client ID & Secret configured on server.'
                : '⚠️ Google OAuth credentials missing.'}
            </div>
          </div>
        </div>
      )}

      {/* Section 1: YouTube Channel Connection Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Youtube className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  YouTube Channel: <span className="text-red-400">Dhunboy Official</span>
                </h2>
                {isConnected ? (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Connected & Verified
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Awaiting Connection
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Channel Owner: <strong className="text-slate-200">Lobish Sarma</strong> • Scope: Full Video Management, Shorts, Analytics, Live Stream
              </p>
            </div>
          </div>

          <div>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Disconnect Channel
              </button>
            ) : (
              <a
                href="/api/auth/youtube"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all text-center"
              >
                <Youtube className="w-4 h-4 fill-current" />
                <span>Connect YouTube Channel via OAuth 2.0</span>
              </a>
            )}
          </div>
        </div>

        {oauthError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">OAuth Connection Error</p>
              <p className="mt-0.5">{oauthError}</p>
            </div>
          </div>
        )}

        {/* Redirect URI Box for Google Cloud */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Authorized Redirect URI (Google Cloud Console Requirement)</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Google OAuth requires this exact URL in your Google Cloud Console project. Copy and paste it under 
            <strong className="text-slate-200"> APIs & Services &gt; Credentials &gt; OAuth 2.0 Client IDs &gt; Authorized redirect URIs</strong>:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-emerald-400 truncate select-all">
              {redirectUri}
            </span>
            <button
              type="button"
              onClick={handleCopyRedirectUri}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors"
            >
              {copiedRedirect ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Universal API Keys & Credentials Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>Configure All API Keys & Credentials</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            You can enter your credentials directly here (saved securely with AES-256 encryption on server) or configure them in your Vercel Dashboard Environment Variables.
          </p>
        </div>

        <form onSubmit={handleSaveAllKeys} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Google Client ID */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Google OAuth Client ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder={hasGoogleCreds ? 'Configured on server (type to replace)' : 'xxxx.apps.googleusercontent.com'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-red-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Found in Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Web Client.
              </span>
            </div>

            {/* Google Client Secret */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Google OAuth Client Secret <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder={hasGoogleCreds ? '•••••••••••••••••••• (Encrypted on server)' : 'GOCSPX-xxxx'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-red-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Stored encrypted on server with AES-256. Never exposed to browser.
              </span>
            </div>

            {/* Gemini API Key */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center justify-between">
                <span>Gemini AI API Key (Aura Engine)</span>
                {hasGeminiKey && (
                  <span className="text-emerald-400 text-[10px] font-bold">✅ Key Loaded</span>
                )}
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                placeholder={hasGeminiKey ? '•••••••••••••••••••• (Active & Online)' : 'AIzaSy... (Paste Gemini Key here)'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Used by Aura virtual assistant for voice, 24/7 autonomous decisions, and viral tags.
              </span>
            </div>

            {/* YouTube Data API Key */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                YouTube Data API v3 Key <span className="text-slate-500">(Optional if OAuth active)</span>
              </label>
              <input
                type="password"
                value={youtubeApiKey}
                onChange={e => setYoutubeApiKey(e.target.value)}
                placeholder="AIzaSy... (Optional public data key)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-red-500 transition-colors"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Optional standalone key for public searches and quota fallback.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              💡 <strong>Tip:</strong> Entering keys here saves them instantly without needing to redeploy on Vercel!
            </span>

            <button
              type="submit"
              disabled={savingKeys}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
            >
              {keysSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved & Verified!</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>{savingKeys ? 'Saving & Testing...' : 'Save & Activate Credentials'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Vercel Environment Guide */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2.5 leading-relaxed">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <HelpCircle className="w-4 h-4" />
            <span>Vercel Dashboard Environment Variable Names Supported:</span>
          </div>
          <p className="text-slate-400">
            The server automatically recognizes all standard alias variable names in Vercel:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold">Google Client ID:</span> <br />
              <code className="text-slate-400">GOOGLE_CLIENT_ID</code> or <code className="text-slate-400">CLIENT_ID</code>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-amber-400 font-bold">Google Client Secret:</span> <br />
              <code className="text-slate-400">GOOGLE_CLIENT_SECRET</code> or <code className="text-slate-400">CLIENT_SECRET</code>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-indigo-400 font-bold">Gemini AI Key:</span> <br />
              <code className="text-slate-400">GEMINI_API_KEY</code> or <code className="text-slate-400">GOOGLE_GENAI_API_KEY</code>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-cyan-400 font-bold">App URL / Redirect:</span> <br />
              <code className="text-slate-400">APP_URL</code> or <code className="text-slate-400">VERCEL_URL</code>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Description Templates Manager */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Description Templates & Placeholders</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized formatting for Nepali DJ Remixes, Lok Dohori releases, festival specials, and AI disclosures.
            </p>
          </div>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </button>
        </div>

        {/* Placeholders Guide */}
        <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-2 items-center">
          <span className="font-semibold text-slate-300">Supported Template Variables:</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{TITLE}}"}</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{ARTIST}}"}</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{CHANNEL}}"}</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{SONG_TYPE}}"}</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{CREDITS}}"}</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{AI_DISCLOSURE}}"}</span>
          <span className="font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded">{"{{SOCIAL_LINKS}}"}</span>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl bg-slate-850 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{tpl.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                    {tpl.category}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-slate-400 mt-2 line-clamp-3 whitespace-pre-wrap bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  {tpl.template}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-[10px] text-slate-500">
                  {tpl.isDefault ? 'Default template' : 'Custom template'}
                </span>
                {!tpl.isDefault && (
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="p-1 text-slate-500 hover:text-red-400"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Create Description Template</h2>

            <form onSubmit={handleCreateTemplate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={tplName}
                  onChange={e => setTplName(e.target.value)}
                  placeholder="e.g. Teej Festival Special Description"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category</label>
                <input
                  type="text"
                  value={tplCategory}
                  onChange={e => setTplCategory(e.target.value)}
                  placeholder="e.g. Nepali DJ Remix"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Template Body</label>
                <textarea
                  rows={6}
                  required
                  value={tplContent}
                  onChange={e => setTplContent(e.target.value)}
                  placeholder="Presenting {{TITLE}} by {{ARTIST}}..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTpl}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
