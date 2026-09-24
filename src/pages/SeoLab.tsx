import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  CheckCircle2,
  Tag,
  Hash,
  ListMusic,
  BarChart,
  RefreshCw,
  Sliders,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { api } from '../api';
import { SEORecord } from '../types';

export const SeoLab: React.FC = () => {
  const [records, setRecords] = useState<SEORecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<SEORecord | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Form inputs
  const [songTitle, setSongTitle] = useState('Maya Ko Dhun');
  const [artist, setArtist] = useState('Lobish Sarma');
  const [genre, setGenre] = useState('Nepali DJ Remix');
  const [language, setLanguage] = useState('Nepali');
  const [targetAudience, setTargetAudience] = useState('Nepali youth, club dance lovers, and diaspora audience');
  const [isAiAssisted, setIsAiAssisted] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadRecords = async () => {
    try {
      setLoadingRecords(true);
      const res = await api.getSEORecords();
      setRecords(res.records);
      if (res.records.length > 0 && !activeRecord) {
        setActiveRecord(res.records[0]);
      }
    } catch (err) {
      console.error('Failed to load SEO records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleGenerateSEO = async () => {
    if (!songTitle) {
      alert('Please enter a song title');
      return;
    }

    try {
      setAnalyzing(true);
      const res = await api.analyzeSEO({
        songTitle,
        artist,
        genre,
        language,
        targetAudience,
        isAiAssisted
      });

      setActiveRecord(res.seoRecord);
      await loadRecords();
    } catch (err: any) {
      alert(`SEO Analysis Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Search className="w-6 h-6 text-red-500" />
            <span>YouTube SEO Lab & Ranking Architect</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Engineered specifically for Nepali music discovery across Nepal, India, and the global diaspora.
          </p>
        </div>

        <button
          onClick={loadRecords}
          disabled={loadingRecords}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingRecords ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form & History */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>Track Release Parameters</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Song / Track Title</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={e => setSongTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Artist / Producer</label>
                <input
                  type="text"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Genre</label>
                  <select
                    value={genre}
                    onChange={e => setGenre(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="Nepali DJ Remix">Nepali DJ Remix</option>
                    <option value="Nepali Pop">Nepali Pop</option>
                    <option value="Lok Dohori">Lok Dohori</option>
                    <option value="Teej Special">Teej Special</option>
                    <option value="Party Mashup">Party Mashup</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Language</label>
                  <input
                    type="text"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAiAssisted}
                    onChange={e => setIsAiAssisted(e.target.checked)}
                    className="rounded text-red-600 focus:ring-0"
                  />
                  <span className="text-slate-300">AI Assisted (Enforce ethical disclosure)</span>
                </label>
              </div>

              <button
                onClick={handleGenerateSEO}
                disabled={analyzing}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Search Algorithm Patterns...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Full SEO Package</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Audit History List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Audits
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {records.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => setActiveRecord(rec)}
                  className={`p-2.5 rounded-xl cursor-pointer text-xs transition-colors flex items-center justify-between ${
                    activeRecord?.id === rec.id
                      ? 'bg-red-500/10 border border-red-500/40 text-white'
                      : 'bg-slate-850/70 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold truncate">{rec.songTitle}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Score: {rec.seoScore}/100</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active SEO Record Inspection */}
        <div className="lg:col-span-2 space-y-6">
          {activeRecord ? (
            <div className="space-y-6">
              {/* Score Header Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block">
                      Target Track: {activeRecord.songTitle}
                    </span>
                    <h2 className="text-lg font-bold text-white mt-0.5">
                      Search Engine Optimization Analysis
                    </h2>
                    <p className="text-xs text-slate-400">
                      Channel: <strong className="text-slate-300">Dhunboy Official</strong> • Artist: <strong className="text-slate-300">{activeRecord.artist}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">SEO Score</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {activeRecord.seoScore}
                        <span className="text-slate-600 text-sm font-normal">/100</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Criteria Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Title</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {activeRecord.scoreBreakdown?.titleOptimization || 88}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Keywords</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {activeRecord.scoreBreakdown?.keywordDensity || 85}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tag Coverage</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {activeRecord.scoreBreakdown?.tagCoverage || 88}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Description</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {activeRecord.scoreBreakdown?.descriptionStructure || 82}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-850 border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">Audience Fit</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {activeRecord.scoreBreakdown?.audienceMatch || 85}%
                    </span>
                  </div>
                </div>

                {activeRecord.scoreBreakdown?.notes && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-850/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                    {activeRecord.scoreBreakdown.notes.map((note, i) => (
                      <p key={i}>• {note}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* 5 Distinct Title Styles */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <span>5 Tailored Title Options</span>
                </h3>

                <div className="space-y-2 text-xs">
                  {Object.entries(activeRecord.seoTitles || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 pr-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-slate-100 font-medium">{val as string}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(val as string, key)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
                        title="Copy Title"
                      >
                        {copiedKey === key ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags & Hashtags */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
                {/* YouTube Tags */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span>YouTube Tags ({activeRecord.youtubeTags?.length || 0})</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeRecord.youtubeTags.join(', '), 'tags')}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === 'tags' ? 'Copied All!' : 'Copy All Tags'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRecord.youtubeTags?.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hashtags */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span>Hashtags</span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeRecord.hashtags.join(' '), 'hashtags')}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === 'hashtags' ? 'Copied!' : 'Copy Hashtags'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRecord.hashtags?.map((ht, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                        {ht}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>Generated Description Draft</span>
                  </h3>
                  <button
                    onClick={() => copyToClipboard(activeRecord.generatedDescription, 'description')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedKey === 'description' ? 'Copied!' : 'Copy Description'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {activeRecord.generatedDescription}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No SEO Audit Selected</p>
              <p className="text-xs text-slate-500 mt-1">Configure parameters on the left to run an audit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
