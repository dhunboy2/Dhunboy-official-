import React, { useState, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  Calendar,
  Clock,
  Key,
  Copy,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Send
} from 'lucide-react';
import { api } from '../api';
import { LiveBroadcastRecord } from '../types';

export const LiveCenter: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<LiveBroadcastRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('Nepali DJ Remix Live Jam | Dhunboy Official');
  const [description, setDescription] = useState('Join Lobish Sarma live for non-stop high-energy Nepali beats, new remix premieres, and viewer requests! Like & subscribe to Dhunboy Official.');
  const [scheduledStartTime, setScheduledStartTime] = useState(
    new Date(Date.now() + 3600000 * 24).toISOString().slice(0, 16)
  );
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('unlisted');
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBroadcast, setSuccessBroadcast] = useState<LiveBroadcastRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await api.getLiveBroadcasts();
      setBroadcasts(res.broadcasts);
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const handleCreateBroadcast = async () => {
    if (!title) {
      alert('Please enter a broadcast title');
      return;
    }

    try {
      setCreating(true);
      setErrorMessage(null);
      setSuccessBroadcast(null);

      const res = await api.createLiveBroadcast({
        title,
        description,
        scheduledStartTime: new Date(scheduledStartTime).toISOString(),
        privacyStatus
      });

      setSuccessBroadcast(res.broadcast);
      await loadBroadcasts();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create live broadcast');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <span>YouTube Live Streaming Center</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Official YouTube Live Streaming API integration. Schedule broadcasts, obtain RTMP ingestion keys, and stream live.
          </p>
        </div>

        <button
          onClick={loadBroadcasts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error / Insufficient Permissions Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-200">YouTube Live API Notice</p>
            <p className="leading-relaxed">{errorMessage}</p>
            {errorMessage.includes('INSUFFICIENT_LIVE_PERMISSIONS') && (
              <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-amber-500/20 text-slate-300">
                <span className="font-semibold block text-amber-400 mb-1">
                  How to enable Live Streaming on Dhunboy Official:
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Visit YouTube Studio &gt; Settings &gt; Channel &gt; Feature Eligibility.</li>
                  <li>Verify phone number to enable Intermediate/Advanced Features.</li>
                  <li>Click "Go Live" in YouTube Studio to activate live capabilities (YouTube requires a 24-hour verification window).</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Ingestion Card */}
      {successBroadcast && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase">
            <CheckCircle2 className="w-4 h-4" />
            <span>Broadcast Bound to Ingestion Stream</span>
          </div>

          <h3 className="text-base font-bold text-white">{successBroadcast.title}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block mb-1">RTMP Server Ingestion URL:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-200 truncate">
                  {successBroadcast.rtmpIngestionAddress || 'rtmp://a.rtmp.youtube.com/live2'}
                </span>
                <button
                  onClick={() => copyToClipboard(successBroadcast.rtmpIngestionAddress || 'rtmp://a.rtmp.youtube.com/live2')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-slate-400 block mb-1">Stream Key (Keep Private):</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-emerald-400 truncate">
                  {successBroadcast.streamName || '●●●●●●●●●●●●'}
                </span>
                <button
                  onClick={() => copyToClipboard(successBroadcast.streamName || '')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form & Ingestion Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-400" />
            <span>Schedule New YouTube Live Broadcast</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Broadcast Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-red-500 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Stream Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  value={scheduledStartTime}
                  onChange={e => setScheduledStartTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Privacy Status</label>
                <select
                  value={privacyStatus}
                  onChange={e => setPrivacyStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="unlisted">Unlisted (Recommended for test)</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCreateBroadcast}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Communicating with YouTube Live API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Create & Bind Live Stream</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Broadcast Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Live Stream Protocol Checklist</span>
          </h2>

          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              <span><strong>Auto-Start & Auto-Stop:</strong> Configured for seamless streaming without manual studio intervention.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              <span><strong>DVR Enabled:</strong> Viewers can pause and rewind the live stream up to 12 hours.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              <span><strong>Record from Start:</strong> Automatically archives the live broadcast as a regular YouTube video once concluded.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">4.</span>
              <span><strong>OBS Setting:</strong> Paste RTMP Server & Key into OBS / Streamlabs settings to broadcast directly.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">Scheduled & Past Broadcasts</h2>

        <div className="space-y-3">
          {broadcasts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No broadcasts scheduled yet</p>
          ) : (
            broadcasts.map(b => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      b.status === 'ready'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : b.status === 'live'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {b.status}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(b.scheduledStartTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1">{b.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {b.streamName && (
                    <button
                      onClick={() => copyToClipboard(b.streamName || '')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                    >
                      <Key className="w-3 h-3 text-amber-400" />
                      <span>Copy Stream Key</span>
                    </button>
                  )}
                  {b.youtubeBroadcastId && (
                    <a
                      href={`https://studio.youtube.com/video/${b.youtubeBroadcastId}/livestreaming`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Open YouTube Studio Live Room"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
