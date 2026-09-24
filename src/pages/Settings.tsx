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
  Sliders,
  Check
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

  // Credentials form
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsSaved, setCredsSaved] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // Connect YouTube state
  const [connecting, setConnecting] = useState(false);
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
      const [settingsRes, templatesRes, authUrlRes] = await Promise.all([
        api.getSettings(),
        api.getTemplates(),
        api.getOAuthUrl().catch(() => ({ url: '', redirectUri: window.location.origin + '/api/auth/youtube/callback' }))
      ]);

      setSettings(settingsRes.settings);
      setTemplates(templatesRes.templates);
      if (authUrlRes.redirectUri) {
        setRedirectUri(authUrlRes.redirectUri);
      } else {
        setRedirectUri(`${window.location.origin}/api/auth/youtube/callback`);
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

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !clientSecret) {
      alert('Both Client ID and Client Secret are required.');
      return;
    }

    try {
      setSavingCreds(true);
      await api.saveCredentials(clientId, clientSecret);
      setCredsSaved(true);
      setTimeout(() => setCredsSaved(false), 3000);
      await loadData();
    } catch (err: any) {
      alert(`Error saving credentials: ${err.message}`);
    } finally {
      setSavingCreds(false);
    }
  };

  const handleStartOAuth = async () => {
    try {
      setConnecting(true);
      setOauthError(null);
      const res = await api.getOAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setOauthError(err.message || 'Failed to start OAuth flow');
      setConnecting(false);
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
            <span>Channel & YouTube API Integration Settings</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Configure Google OAuth 2.0 authentication, YouTube Data API tokens, and production description templates.
          </p>
        </div>
      </div>

      {/* Section 1: YouTube Channel Connection Status */}
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
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Channel Owner: <strong className="text-slate-200">Lobish Sarma</strong> • Scope: Video Management, Uploads, Analytics, Live Stream
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
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all text-center"
              >
                <Youtube className="w-4 h-4 fill-current" />
                <span>Connect YouTube Channel</span>
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

        {/* OAuth Setup Guide */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Google Cloud Console OAuth 2.0 Configuration Guide</span>
          </h3>

          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-300 space-y-3 leading-relaxed">
            <p>
              To authenticate your channel <strong>Dhunboy Official</strong>, you need Google OAuth 2.0 Web Application credentials in your Google Cloud project:
            </p>

            <ol className="list-decimal pl-4 space-y-2 text-slate-400">
              <li>
                Visit the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-red-400 hover:underline font-semibold inline-flex items-center gap-1">Google Cloud Console Credentials <ExternalLink className="w-3 h-3" /></a>.
              </li>
              <li>
                Ensure <strong>YouTube Data API v3</strong> and <strong>YouTube Analytics API</strong> are enabled in API Library.
              </li>
              <li>
                Click <strong>Create Credentials &gt; OAuth client ID</strong> (Application type: <strong>Web application</strong>).
              </li>
              <li>
                In <strong>Authorized redirect URIs</strong>, add the exact callback URL below:
              </li>
            </ol>

            {/* Redirect URI Copy Box */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-3">
              <span className="font-mono text-xs text-emerald-400 truncate">
                {redirectUri || `${window.location.origin}/api/auth/youtube/callback`}
              </span>
              <button
                type="button"
                onClick={handleCopyRedirectUri}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0"
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

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-400" />
            <span>Configure Google OAuth Client Credentials</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Google OAuth Client ID</label>
              <input
                type="text"
                required
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Google OAuth Client Secret</label>
              <input
                type="password"
                required
                value={clientSecret}
                onChange={e => setClientSecret(e.target.value)}
                placeholder="GOCSPX-xxxx"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Secrets are stored encrypted on the server with AES-256 and never sent to the client browser.
            </span>
            <button
              type="submit"
              disabled={savingCreds}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            >
              {credsSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Saved to Server</span>
                </>
              ) : (
                <span>Save Credentials</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Description Templates Manager */}
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
