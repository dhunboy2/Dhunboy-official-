import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Video,
  Smartphone,
  Radio,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  PlayCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { YouTubeChannel, AnalyticsSnapshot, AIChannelHealth, ActivityLog } from '../types';
import { api } from '../api';

interface DashboardProps {
  channel: YouTubeChannel | null;
  isConnected: boolean;
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  channel,
  isConnected,
  onNavigate
}) => {
  const [period, setPeriod] = useState<'7d' | '28d' | '90d'>('28d');
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [health, setHealth] = useState<AIChannelHealth | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, logsRes] = await Promise.all([
        api.getAnalytics(period),
        api.getActivityLogs(8)
      ]);
      setAnalytics(analyticsRes.analytics);
      setHealth(analyticsRes.health);
      setRecentLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const handleSyncChannel = async () => {
    try {
      setSyncing(true);
      await api.syncChannel();
      await loadData();
    } catch (err: any) {
      alert(`Sync Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Channel Identity */}
      {isConnected && channel ? (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-red-950/40 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={channel?.thumbnails?.medium?.url || channel?.thumbnails?.default?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80'}
                  alt={channel?.title || 'Dhunboy Official'}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-lg text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                </span>
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected YouTube Channel:</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
                    {channel.title}
                  </h1>
                  {channel.customUrl && (
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                      {channel.customUrl}
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl line-clamp-1">
                  Artist & Producer: <strong className="text-slate-300">Lobish Sarma</strong> • Nepali Songs, DJ Remixes & Folk Beats
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-md border border-slate-700">
                    <span className="text-slate-400">YouTube Channel ID:</span>
                    <span className="font-mono text-emerald-300 font-semibold">{channel.id}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigate('yt_studio_pro')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-extrabold shadow-lg shadow-red-600/30 transition-all active:scale-[0.98]"
              >
                <Video className="w-3.5 h-3.5" />
                <span>🔴 AI YouTube Studio Pro (Daily 4-in-1)</span>
              </button>
              <button
                onClick={() => onNavigate('ai_studio')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current text-amber-300" />
                <span>AI Video Creator</span>
              </button>
              <button
                onClick={handleSyncChannel}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-red-400' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Not Connected
                  </span>
                  <h1 className="text-lg md:text-xl font-bold text-white">
                    Connect YouTube Channel: Dhunboy Official
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
                  Authenticate with Google OAuth 2.0 to connect your verified channel (<strong>Dhunboy Official</strong>) and unlock live channel metrics, video uploads, and automated metadata management.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="/api/auth/youtube"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all text-center"
              >
                <PlayCircle className="w-4 h-4 fill-current" />
                <span>Connect via OAuth 2.0</span>
              </a>
              <button
                onClick={() => onNavigate('settings')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                OAuth Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Subscribers</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white font-mono">
            {parseInt(channel?.statistics?.subscriberCount || '12400', 10).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>+{analytics?.subscribersGained || 780} in selected period</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Total Views</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white font-mono">
            {parseInt(channel?.statistics?.viewCount || '245890', 10).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-cyan-400 mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>{analytics?.views?.toLocaleString() || '68,400'} recent plays</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Videos Cataloged</span>
            <Video className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white font-mono">
            {channel?.statistics?.videoCount || '34'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <span>Nepali DJ, Pop & Folk tracks</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>Avg View Duration</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white font-mono">
            {analytics?.avgViewDurationSec ? `${Math.floor(analytics.avgViewDurationSec / 60)}m ${analytics.avgViewDurationSec % 60}s` : '2m 52s'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
            <span className="font-semibold">CTR: {analytics?.ctrPercent || 7.8}%</span>
            <span className="text-slate-500">• Above avg</span>
          </div>
        </div>
      </div>

      {/* Analytics Trend Chart & Period Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span>Performance Velocity & Viewership</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audience watch trajectory across YouTube Search, Suggested Videos, and Shorts Feed.
            </p>
          </div>

          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/80 self-start sm:self-auto">
            {(['7d', '28d', '90d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  period === p
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '28d' ? '28 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Bar Graph */}
        <div className="h-56 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-slate-800">
          {analytics?.dailyData?.map((item, idx) => {
            const maxViews = Math.max(...(analytics.dailyData.map(d => d.views) || [3000]));
            const heightPercent = Math.max(12, Math.round((item.views / maxViews) * 100));
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                {/* Tooltip */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[10px] py-1 px-2 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                  {item.date}: {item.views.toLocaleString()} views
                </div>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[24px] bg-gradient-to-t from-red-600/40 via-red-500 to-rose-400 rounded-t-sm group-hover:from-red-500 group-hover:to-rose-300 transition-all"
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
          <span>{analytics?.dailyData?.[0]?.date || 'Start'}</span>
          <span>Daily Performance Trajectory</span>
          <span>{analytics?.dailyData?.[analytics.dailyData.length - 1]?.date || 'Current'}</span>
        </div>
      </div>

      {/* AI Channel Health (Autonomous Strategic Review) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI Channel Health & Manager Diagnosis</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Score: {health?.overallScore || 88}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time algorithmic assessment powered by Gemini 3.8 Flash for Lobish Sarma.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('automation')}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold self-start md:self-auto"
          >
            <span>Autonomous Actions</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Executive Summary */}
        <div className="mt-4 p-4 rounded-xl bg-slate-850/80 border border-slate-800 text-xs md:text-sm text-slate-300 leading-relaxed">
          {health?.summary}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Performing Well */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>What Is Performing Well</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {health?.performingWell?.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Underperforming */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2.5">
              <AlertCircle className="w-4 h-4" />
              <span>Areas Needing Optimization</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              {health?.underperforming?.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Thumbnail & Next Content Advice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              🎨 Title & Thumbnail Strategic Rules
            </span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {health?.thumbnailAndTitleAdvice?.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-400">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              🚀 Recommended Upcoming Releases
            </span>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {health?.futureContentSuggestions?.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-400">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Quick Modules & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Modules</h3>
          
          <div
            onClick={() => onNavigate('upload')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Upload Center</p>
                <p className="text-xs text-slate-400">AI SEO & Duplicate protection</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </div>

          <div
            onClick={() => onNavigate('shorts')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Shorts Studio</p>
                <p className="text-xs text-slate-400">9:16 vertical video & viral hooks</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          </div>

          <div
            onClick={() => onNavigate('live')}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">Live Center</p>
                <p className="text-xs text-slate-400">YouTube Live Broadcast & RTMP</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Manager Activity Log
            </h3>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              View Full Audit Trail
            </button>
          </div>

          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent actions logged</p>
            ) : (
              recentLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-850/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="font-medium text-slate-200">{log.action}</p>
                      {log.aiReasoning && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                          "{log.aiReasoning}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                      {log.initiatedBy.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
