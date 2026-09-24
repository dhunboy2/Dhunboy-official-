import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Tag,
  Hash,
  Filter,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { ContentPlanItem } from '../types';

export const ContentPlanner: React.FC = () => {
  const [plans, setPlans] = useState<ContentPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modal / Add Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [proposedTitle, setProposedTitle] = useState('');
  const [format, setFormat] = useState<'Long-form' | 'Short' | 'DJ Remix' | 'Lok Dohori' | 'Live Session'>('DJ Remix');
  const [hook, setHook] = useState('');
  const [keywords, setKeywords] = useState('Nepali DJ Remix, New Nepali Song 2026, Lobish Sarma');
  const [hashtags, setHashtags] = useState('#DhunboyOfficial #NepaliDJRemix #NepaliSong');
  const [suggestedUploadDate, setSuggestedUploadDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState('High demand party dance anthem');

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.getPlans();
      setPlans(res.plans);
    } catch (err) {
      console.error('Failed to load content plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleGenerateAIPlans = async () => {
    try {
      setGenerating(true);
      const res = await api.generatePlans();
      setPlans(res.plans);
    } catch (err: any) {
      alert(`AI Plan Generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !proposedTitle) {
      alert('Topic and title are required');
      return;
    }

    try {
      await api.createPlan({
        topic,
        proposedTitle,
        format,
        hook,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        hashtags: hashtags.split(/\s+/).filter(Boolean),
        suggestedUploadDate,
        reason
      });

      setShowAddModal(false);
      setTopic('');
      setProposedTitle('');
      setHook('');
      await loadPlans();
    } catch (err: any) {
      alert(`Create failed: ${err.message}`);
    }
  };

  const handleStatusChange = async (id: string, newStatus: any) => {
    try {
      await api.updatePlan(id, { status: newStatus });
      await loadPlans();
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this planned release?')) return;
    try {
      await api.deletePlan(id);
      await loadPlans();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-red-500" />
            <span>Content Strategy & Seasonal Release Planner</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Organize upcoming music singles, DJ club drops, festival specials, and YouTube Shorts for Dhunboy Official.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleGenerateAIPlans}
            disabled={generating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating Ideas...' : 'AI Seasonal Suggestions'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No content plans scheduled</p>
            <p className="text-xs text-slate-500 mt-1">
              Click "AI Seasonal Suggestions" above to let Gemini plan upcoming festival and club drops.
            </p>
          </div>
        ) : (
          plans.map(plan => (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    {plan.format}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{new Date(plan.suggestedUploadDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Topic:</span>
                  <h3 className="text-sm font-bold text-white mt-0.5 line-clamp-1">{plan.topic}</h3>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                  <span className="text-[10px] text-indigo-400 font-bold block mb-0.5">Proposed Title:</span>
                  <p className="text-slate-200 font-medium line-clamp-2">{plan.proposedTitle}</p>
                </div>

                {plan.hook && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic">
                    Hook: "{plan.hook}"
                  </p>
                )}

                <div className="flex flex-wrap gap-1 pt-1">
                  {plan.keywords?.slice(0, 3).map((kw, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status footer & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <select
                  value={plan.status}
                  onChange={e => handleStatusChange(plan.id, e.target.value)}
                  className={`bg-slate-800 border rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none ${
                    plan.status === 'published'
                      ? 'text-emerald-400 border-emerald-500/30'
                      : plan.status === 'in_progress'
                      ? 'text-cyan-400 border-cyan-500/30'
                      : plan.status === 'planned'
                      ? 'text-amber-400 border-amber-500/30'
                      : 'text-slate-400 border-slate-700'
                  }`}
                >
                  <option value="idea">💡 Idea</option>
                  <option value="planned">📅 Planned</option>
                  <option value="in_progress">⚙️ In Progress</option>
                  <option value="published">✅ Published</option>
                </select>

                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  title="Delete release idea"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Schedule New Content Release</h2>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Topic / Working Name</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Teej Fast Beats Fusion"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Proposed YouTube Title</label>
                <input
                  type="text"
                  required
                  value={proposedTitle}
                  onChange={e => setProposedTitle(e.target.value)}
                  placeholder="e.g. Teej Special DJ Dance Mix 2026 | Dhunboy Official"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="DJ Remix">DJ Remix</option>
                    <option value="Long-form">Long-form Track</option>
                    <option value="Lok Dohori">Lok Dohori</option>
                    <option value="Short">YouTube Short</option>
                    <option value="Live Session">Live Session</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={suggestedUploadDate}
                    onChange={e => setSuggestedUploadDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Strategic Hook / Angle</label>
                <input
                  type="text"
                  value={hook}
                  onChange={e => setHook(e.target.value)}
                  placeholder="e.g. Explosive bass drop mixed with traditional sarangi melody"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Save Release Idea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
