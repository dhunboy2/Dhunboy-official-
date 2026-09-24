import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Bot,
  User,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api';
import { ActivityLog } from '../types';

export const ActivityCenter: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getActivityLogs(200);
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        (log.title && log.title.toLowerCase().includes(q)) ||
        (log.endpoint && log.endpoint.toLowerCase().includes(q)) ||
        (log.aiReasoning && log.aiReasoning.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-red-500" />
            <span>Activity Logs & Transparency Audit Trail</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Complete cryptographic audit trail of every user and AI action taken across YouTube API endpoints.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, title, endpoint, or reasoning..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'success', 'failure'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-800/80">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No matching activity logs found.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-850/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{log.action}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {log.endpoint}
                      </span>
                    </div>

                    {log.title && (
                      <p className="text-slate-300 font-medium mt-0.5">
                        Track: <span className="text-white">{log.title}</span>
                      </p>
                    )}

                    {log.aiReasoning && (
                      <p className="text-[11px] text-slate-400 mt-1 italic leading-relaxed">
                        Reasoning: "{log.aiReasoning}"
                      </p>
                    )}

                    {log.errorMessage && (
                      <p className="text-[11px] text-red-400 mt-1 font-mono">
                        Error: {log.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 text-right shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    log.initiatedBy === 'ai_autonomous'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : log.initiatedBy === 'ai_assisted'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {log.initiatedBy.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
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
