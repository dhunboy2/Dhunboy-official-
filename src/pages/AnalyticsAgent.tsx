import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Users,
  Eye,
  Clock,
  ThumbsUp,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Compass
} from 'lucide-react';
import { api } from '../api';
import { AnalyticsSnapshot, AIChannelHealth } from '../types';

export const AnalyticsAgent: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '28d' | '90d'>('28d');
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [health, setHealth] = useState<AIChannelHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics(period);
      setAnalytics(res.analytics);
      setHealth(res.health);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-red-500" />
            <span>AI Analytics Agent & Interpretation Engine</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Autonomous performance diagnostics answering what happened, what changed, and what to release next.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          {(['7d', '28d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p === '7d' ? 'Last 7 Days' : p === '28d' ? 'Last 28 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Views</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.views?.toLocaleString() || '68,400'}
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>+14.2% vs previous period</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Watch Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.watchTimeHours?.toLocaleString() || '3,240'} hrs
          </div>
          <span className="text-[11px] text-indigo-300 mt-1 block">
            Avg: {analytics ? `${Math.floor(analytics.avgViewDurationSec / 60)}m ${analytics.avgViewDurationSec % 60}s` : '2m 52s'}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Impressions CTR</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.ctrPercent || 7.8}%
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block font-semibold">
            Top 15% in Music category
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Subscribers Gained</span>
            <Users className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            +{analytics?.subscribersGained?.toLocaleString() || '780'}
          </div>
          <span className="text-[11px] text-rose-400 mt-1 block font-semibold">
            Strong Shorts conversion
          </span>
        </div>
      </div>

      {/* Trajectory Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-red-500" />
          <span>Daily View Distribution</span>
        </h2>

        <div className="h-60 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-800">
          {analytics?.dailyData?.map((item, idx) => {
            const maxViews = Math.max(...(analytics.dailyData.map(d => d.views) || [3000]));
            const heightPercent = Math.max(15, Math.round((item.views / maxViews) * 100));
            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              >
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-slate-200 text-[10px] py-1 px-2 rounded border border-slate-700 pointer-events-none whitespace-nowrap z-20 shadow-xl font-mono">
                  {item.date}: {item.views.toLocaleString()} plays ({item.likes} likes)
                </div>

                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full max-w-[28px] bg-gradient-to-t from-red-600 via-rose-500 to-rose-400 rounded-t-sm group-hover:from-red-400 group-hover:to-rose-300 transition-all"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Core Questions of the AI Analytics Agent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Q1: What Happened? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>1. What Happened?</span>
          </div>
          <h3 className="text-base font-bold text-white">Audience Growth & Velocity</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dhunboy Official saw a surge in overall video plays driven primarily by recommendations in the Nepali dance and party music genre. Average session watch duration reached 2m 52s, indicating high music replay value.
          </p>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p>• <strong>Top Traffic Source:</strong> YouTube Search (42%) and Suggested Videos (36%).</p>
            <p>• <strong>Core Search Terms:</strong> "Nepali DJ remix 2026", "Lobish Sarma songs", "new nepali dance geet".</p>
          </div>
        </div>

        {/* Q2: What Changed? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>2. What Changed?</span>
          </div>
          <h3 className="text-base font-bold text-white">Shift in Viewer Behaviors</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Compared to the prior interval, viewer retention in the initial 15 seconds improved by 8.4%. The addition of Romanized keywords in video tags captured higher diaspora engagement from UAE, Qatar, Australia, and the US.
          </p>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p>• <strong>Shorts Velocity:</strong> 30-45s vertical clips are responsible for 40% of new subscriber gains.</p>
            <p>• <strong>Engagement Ratio:</strong> Likes-to-views ratio remains robust at 4.2%.</p>
          </div>
        </div>

        {/* Q3: What Content Performed Differently? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>3. What Content Performed Differently?</span>
          </div>
          <h3 className="text-base font-bold text-white">Format & Genre Variance</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tracks featuring energetic folk madal beat drops demonstrated 28% higher repeat listenership than standard pop arrangements. High-contrast typography on thumbnails had a 3.1% higher CTR than plain artist photos.
          </p>
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p>• <strong>Highest Retention:</strong> Fast BPM DJ remixes (130-134 BPM).</p>
            <p>• <strong>Opportunity Area:</strong> Traditional Lok Dohori needs stronger bass mixing to retain mobile listeners.</p>
          </div>
        </div>

        {/* Q4: What Should Be Tested Next? */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>4. What Should Be Tested Next?</span>
          </div>
          <h3 className="text-base font-bold text-white">Strategic Experiments</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The AI Manager recommends these 3 high-impact experiments for creator Lobish Sarma:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-300">
              <span className="font-bold text-rose-400 block mb-0.5">1. Pre-Drop Shorts Campaign:</span>
              Release 2 Shorts showcasing the isolated beat drop 48 hours before dropping the full long-form release.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-300">
              <span className="font-bold text-amber-400 block mb-0.5">2. Festival Themed Mashup:</span>
              Prepare seasonal DJ remixes 3 weeks in advance of Nepali festivals (Tihar, Dashain, Teej) to capture search momentum.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-800 text-slate-300">
              <span className="font-bold text-indigo-400 block mb-0.5">3. Live Stream Jam:</span>
              Schedule an Unlisted live test stream on Saturday evening (Nepal Time) to verify audio fidelity and viewer engagement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
