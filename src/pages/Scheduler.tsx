import React, { useState, useEffect } from 'react';
import {
  Clock,
  Video,
  Smartphone,
  Radio,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { api } from '../api';
import { VideoRecord, LiveBroadcastRecord, ContentPlanItem } from '../types';

interface SchedulerProps {
  onNavigate: (page: string) => void;
}

export const Scheduler: React.FC<SchedulerProps> = ({ onNavigate }) => {
  const [scheduledVideos, setScheduledVideos] = useState<VideoRecord[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<LiveBroadcastRecord[]>([]);
  const [contentPlans, setContentPlans] = useState<ContentPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const [vidRes, liveRes, planRes] = await Promise.all([
        api.getVideos(),
        api.getLiveBroadcasts(),
        api.getPlans()
      ]);

      const queued = vidRes.localVideos.filter(v => v.isScheduled && v.status === 'queued');
      setScheduledVideos(queued);
      setLiveBroadcasts(liveRes.broadcasts.filter(b => b.status === 'ready' || b.status === 'created'));
      setContentPlans(planRes.plans.filter(p => p.status === 'planned'));
    } catch (err) {
      console.error('Failed to load scheduler:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-red-500" />
            <span>Master Release Scheduler & Timeline</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Autonomous queue tracker. Automatically watches and releases queued long-form tracks, Shorts, and Live events.
          </p>
        </div>

        <button
          onClick={() => onNavigate('upload')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Release</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Videos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-400" />
              <span>Queued Long-Form & Shorts ({scheduledVideos.length})</span>
            </h2>
          </div>

          <div className="space-y-3">
            {scheduledVideos.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No videos queued for scheduled release.
              </p>
            ) : (
              scheduledVideos.map(v => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {v.isShort ? 'Short' : 'Long-form'}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {v.scheduledTime ? new Date(v.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending'}
                    </span>
                  </div>
                  <h4 className="font-bold text-white line-clamp-1">{v.title}</h4>
                  <p className="text-[11px] text-slate-400">
                    Privacy on drop: <span className="uppercase text-slate-300">{v.privacyStatus}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduled Live Broadcasts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Upcoming Live Broadcasts ({liveBroadcasts.length})</span>
          </h2>

          <div className="space-y-3">
            {liveBroadcasts.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No live broadcasts scheduled.
              </p>
            ) : (
              liveBroadcasts.map(b => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Live Stream
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(b.scheduledStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-white line-clamp-1">{b.title}</h4>
                  {b.streamName && (
                    <span className="text-[10px] text-slate-400 font-mono block">
                      RTMP bound • Ingestion ready
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Strategy Releases */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Planned Strategic Drops ({contentPlans.length})</span>
          </h2>

          <div className="space-y-3">
            {contentPlans.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No future releases planned.
              </p>
            ) : (
              contentPlans.map(p => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {p.format}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {new Date(p.suggestedUploadDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-bold text-white line-clamp-1">{p.proposedTitle}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {p.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
