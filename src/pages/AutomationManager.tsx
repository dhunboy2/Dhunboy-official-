import React, { useState, useEffect } from 'react';
import {
  Bot,
  Shield,
  Sliders,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { AutomationMode, AutomationPermissions, BackgroundJob } from '../types';

export const AutomationManager: React.FC = () => {
  const [mode, setMode] = useState<AutomationMode>('assisted');
  const [permissions, setPermissions] = useState<AutomationPermissions | null>(null);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision Cycle state
  const [runningCycle, setRunningCycle] = useState(false);
  const [cycleResults, setCycleResults] = useState<any[] | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, jobsRes] = await Promise.all([
        api.getAutomationSettings(),
        api.getJobs()
      ]);
      setMode(settingsRes.mode);
      setPermissions(settingsRes.permissions);
      setJobs(jobsRes.jobs);
    } catch (err) {
      console.error('Failed to load automation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api.getJobs().then(res => setJobs(res.jobs)).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleModeChange = async (newMode: AutomationMode) => {
    try {
      await api.setAutomationMode(newMode);
      setMode(newMode);
    } catch (err: any) {
      alert(`Failed to set mode: ${err.message}`);
    }
  };

  const handlePermissionToggle = async (key: keyof AutomationPermissions) => {
    if (!permissions) return;
    const updated = { ...permissions, [key]: !permissions[key] };
    try {
      await api.setPermissions({ [key]: updated[key] });
      setPermissions(updated);
    } catch (err: any) {
      alert(`Permission update error: ${err.message}`);
    }
  };

  const handleTriggerCycle = async () => {
    try {
      setRunningCycle(true);
      setCycleResults(null);
      const res = await api.triggerCycle();
      setCycleResults(res.cycleResult.decisions);
      await loadData();
    } catch (err: any) {
      alert(`Decision cycle error: ${err.message}`);
    } finally {
      setRunningCycle(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-red-500" />
            <span>AI Manager Autonomy & Permission Boundaries</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Configure how autonomously Dhunboy AI operates. Dangerous upload and publish actions are constrained by creator policy.
          </p>
        </div>

        <button
          onClick={handleTriggerCycle}
          disabled={runningCycle}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Cpu className={`w-4 h-4 ${runningCycle ? 'animate-spin' : ''}`} />
          <span>{runningCycle ? 'Evaluating State...' : 'Run Decision Cycle'}</span>
        </button>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'manual' as const,
            title: 'Manual Mode',
            badge: 'Human Controlled',
            desc: 'AI acts strictly as an advisory assistant. No background tasks or uploads are initiated without explicit creator confirmation.',
            color: 'border-amber-500/40'
          },
          {
            id: 'assisted' as const,
            title: 'Assisted Mode',
            badge: 'Recommended',
            desc: 'AI automates keyword analysis, title drafts, and health monitoring. Uploads and live stream creations require single-click approval.',
            color: 'border-cyan-500/40'
          },
          {
            id: 'autonomous' as const,
            title: 'Autonomous Mode',
            badge: 'Full Human Manager Proxy',
            desc: 'AI executes authorized background cycles, syncs channel analytics, schedules drafts, and maintains content velocity.',
            color: 'border-emerald-500/40'
          }
        ].map(m => {
          const isSelected = mode === m.id;
          return (
            <div
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? `bg-slate-850 ${m.color} ring-1 ring-red-500 shadow-xl`
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-white text-sm">{m.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    isSelected ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {m.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{m.desc}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className={isSelected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {isSelected ? 'Active Mode' : 'Click to Activate'}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Cycle Results Banner */}
      {cycleResults && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Decision Cycle Evaluation Log</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluated {cycleResults.length} checkpoints
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {cycleResults.map((dec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{dec.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      dec.allowed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {dec.allowed ? 'Permission Granted' : 'Blocked By Policy'}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{dec.reason}</p>
                  {dec.result && (
                    <p className="text-indigo-300 mt-0.5 font-medium">Result: {dec.result}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Granular Permission Toggles */}
      {permissions && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Fine-Grained Autonomous Authorization Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle individual permissions for content creation, YouTube API execution, and live streaming.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
            {Object.entries(permissions).map(([key, val]) => {
              const isDangerous = ['uploadVideos', 'uploadShorts', 'publishVideos', 'updateMetadata'].includes(key);
              return (
                <div
                  key={key}
                  onClick={() => handlePermissionToggle(key as keyof AutomationPermissions)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    val
                      ? 'bg-slate-850 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-900/50 border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="pr-3">
                    <span className="font-semibold text-slate-200 block">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    {isDangerous && (
                      <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>High-Impact Action</span>
                      </span>
                    )}
                  </div>

                  <div className={`w-10 h-5 rounded-full transition-colors relative ${val ? 'bg-red-600' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${val ? 'left-5' : 'left-1'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Background Job Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Background Job Queue & Worker Daemon</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {jobs.length} jobs in history
          </span>
        </div>

        <div className="space-y-2.5">
          {jobs.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              Queue is empty. Background jobs will appear here when tasks are enqueued.
            </p>
          ) : (
            jobs.map(job => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase font-mono ${
                      job.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : job.status === 'RUNNING'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 animate-pulse'
                        : job.status === 'FAILED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{job.type}</span>
                  </div>
                  <h4 className="font-bold text-white mt-1">{job.title}</h4>
                  {job.error && (
                    <p className="text-[11px] text-red-400 mt-0.5 font-mono">
                      Error: {job.error}
                    </p>
                  )}
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono shrink-0">
                  <span>Retries: {job.retryCount}/{job.maxRetries}</span>
                  <span className="block mt-0.5">
                    {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
