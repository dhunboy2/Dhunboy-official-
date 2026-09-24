import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Radio,
  Zap,
  TrendingDown,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../api';
import { QuotaTracker as QuotaData } from '../types';

export const QuotaTracker: React.FC = () => {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQuota = async () => {
    try {
      setLoading(true);
      const res = await api.getQuota();
      setQuota(res.quota);
    } catch (err) {
      console.error('Failed to load quota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuota();
  }, []);

  const used = quota?.usedToday || 0;
  const limit = quota?.limit || 10000;
  const percentage = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Gauge className="w-6 h-6 text-red-500" />
            <span>YouTube Data API v3 Quota Engine</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Real-time quota monitoring and intelligent rate-limiting to prevent channel API suspension.
          </p>
        </div>

        <button
          onClick={loadQuota}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Quota Gauge Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daily Quota Consumption
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-white font-mono">
                {used.toLocaleString()}
              </span>
              <span className="text-lg text-slate-400 font-mono">/ {limit.toLocaleString()} units</span>
            </div>
            <p className="text-xs text-slate-400">
              Resets daily at midnight Pacific Time (00:00 PST / 13:45 NPT).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-28 h-28 rounded-full border-8 border-slate-800 relative flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border-8 border-red-500 transition-all"
                style={{
                  clipPath: `polygon(50% 50%, -50% -50%, ${percentage}% -50%, ${percentage}% 150%, -50% 150%)`
                }}
              />
              <span className="text-xl font-black text-white font-mono z-10">{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-6">
          <div
            style={{ width: `${percentage}%` }}
            className={`h-full rounded-full transition-all ${
              percentage > 85 ? 'bg-red-500' : percentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Costs Reference & Conservation Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>YouTube Data API Point Costs</span>
          </h2>

          <div className="space-y-2 text-xs">
            {[
              { op: 'Video Upload (videos.insert)', cost: '1,600 units', note: 'Heavy operation (max ~6 uploads/day on free tier)' },
              { op: 'Search (search.list)', cost: '100 units', note: 'Heavy search query' },
              { op: 'Update Video Metadata (videos.update)', cost: '50 units', note: 'Title, description, tags edit' },
              { op: 'Set Custom Thumbnail (thumbnails.set)', cost: '50 units', note: 'Image upload' },
              { op: 'Live Broadcast (liveBroadcasts.insert)', cost: '50 units', note: 'Stream initialization' },
              { op: 'Create Playlist (playlists.insert)', cost: '50 units', note: 'Playlist generation' },
              { op: 'List Channels / Videos / Playlists', cost: '1 unit', note: 'Cached & optimized by Dhunboy AI' }
            ].map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{item.op}</span>
                  <span className="text-[11px] text-slate-400">{item.note}</span>
                </div>
                <span className="font-mono font-bold text-white bg-slate-800 px-2 py-1 rounded text-right shrink-0">
                  {item.cost}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Conservation Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dhunboy AI Autonomous Quota Protections</span>
          </h2>

          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Local File Hash Duplicate Protection:</strong> Pre-computes video SHA-256 hashes to prevent accidental duplicate uploads that waste 1,600 units.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Pre-computed Metadata:</strong> Generates and polishes all titles, descriptions, and tags with Gemini AI <em>before</em> sending payloads to YouTube API.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Batched Video Lists:</strong> Fetches up to 50 videos in a single 1-unit request rather than individual video queries.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Resumable Upload Protocol:</strong> Uses chunked HTTP streaming so connection interruptions do not restart the 1,600 point counter.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Quota Usage Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
        <h2 className="text-sm font-bold text-white">Today's Operation Log</h2>

        <div className="space-y-2 text-xs">
          {quota?.history && quota.history.length > 0 ? (
            quota.history.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-850/60 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-white">{item.operation}</span>
                  {item.details && <p className="text-[11px] text-slate-400 mt-0.5">{item.details}</p>}
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-mono font-bold block">-{item.cost} units</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No API calls recorded today yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
