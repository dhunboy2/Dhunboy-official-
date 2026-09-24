import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Sparkles,
  Scissors,
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  FileVideo,
  Play,
  Clock,
  Send,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { api } from '../api';
import { ShortRecord } from '../types';

export const ShortsStudio: React.FC = () => {
  const [shorts, setShorts] = useState<ShortRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Breakdown inputs
  const [songTitle, setSongTitle] = useState('Nepali DJ Bass Drop');
  const [genre, setGenre] = useState('Nepali DJ Remix');
  const [description, setDescription] = useState('High energy club dance remix with traditional madal beat drop');
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<any>(null);

  // Video clipping inputs
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceFilePath, setSourceFilePath] = useState('');
  const [uploadingSource, setUploadingSource] = useState(false);
  const [shortTitle, setShortTitle] = useState('');
  const [startSec, setStartSec] = useState(15);
  const [durationSec, setDurationSec] = useState(45);
  const [clipping, setClipping] = useState(false);
  const [clipMessage, setClipMessage] = useState<string | null>(null);

  const loadShorts = async () => {
    try {
      setLoading(true);
      const res = await api.getShorts();
      setShorts(res.shorts);
    } catch (err) {
      console.error('Failed to load shorts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShorts();
  }, []);

  const handleGenerateBreakdown = async () => {
    if (!songTitle) {
      alert('Please enter a track title');
      return;
    }
    try {
      setBreakdownLoading(true);
      const res = await api.generateShortsBreakdown({
        videoTitle: songTitle,
        genre,
        transcriptOrDescription: description
      });
      setAiBreakdown(res.breakdown);
      if (res.breakdown?.title) {
        setShortTitle(res.breakdown.title);
      }
      if (res.breakdown?.candidateMoments?.[0]) {
        setStartSec(res.breakdown.candidateMoments[0].startSec);
        setDurationSec(res.breakdown.candidateMoments[0].endSec - res.breakdown.candidateMoments[0].startSec);
      }
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const handleUploadSource = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSourceFile(file);
    try {
      setUploadingSource(true);
      const res = await api.uploadVideoFile(file);
      setSourceFilePath(res.filePath);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploadingSource(false);
    }
  };

  const handleClipAndProcess = async () => {
    if (!sourceFilePath) {
      alert('Please upload or select a source video file first');
      return;
    }

    try {
      setClipping(true);
      setClipMessage(null);
      const res = await api.clipShort({
        sourceFilePath,
        startSec: Number(startSec),
        durationSec: Number(durationSec),
        title: shortTitle || `${songTitle} #Shorts`,
        description: aiBreakdown?.captionText || 'Nepali music hits different! Subscribe to Dhunboy Official.',
        tags: aiBreakdown?.tags || ['Shorts', 'NepaliDJ', 'DhunboyOfficial'],
        hook: aiBreakdown?.hook,
        first3SecondsAdvice: aiBreakdown?.first3SecondsAdvice,
        captionText: aiBreakdown?.captionText
      });

      setClipMessage(res.message);
      await loadShorts();
    } catch (err: any) {
      alert(`Clipping failed: ${err.message}`);
    } finally {
      setClipping(false);
    }
  };

  const handleUploadToYouTube = async (shortId: string) => {
    try {
      const res = await api.uploadShort(shortId);
      alert(res.message);
      await loadShorts();
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-red-500" />
            <span>YouTube Shorts Studio & FFmpeg Formatter</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Produce vertical 9:16 Shorts with viral hooks, first 3-second retention engineering, and direct YouTube upload.
          </p>
        </div>

        <button
          onClick={loadShorts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: AI Retention Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Step 1: AI Hook & Viral Retention Generator</span>
            </h2>
            <button
              onClick={handleGenerateBreakdown}
              disabled={breakdownLoading}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${breakdownLoading ? 'animate-spin' : ''}`} />
              <span>{breakdownLoading ? 'Generating...' : 'Analyze Hook'}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Song / Track Title</label>
              <input
                type="text"
                value={songTitle}
                onChange={e => setSongTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Genre</label>
                <input
                  type="text"
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Audio Vibe / Segment</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {aiBreakdown && (
              <div className="mt-4 p-4 rounded-xl bg-slate-850 border border-indigo-900/40 space-y-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                    Viral Hook Line:
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">"{aiBreakdown.hook}"</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    First 1-3 Seconds Retention Strategy:
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">{aiBreakdown.first3SecondsAdvice}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    On-Screen Caption / Question:
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">{aiBreakdown.captionText}</p>
                </div>

                {aiBreakdown.candidateMoments && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                      Candidate Moments:
                    </span>
                    <div className="space-y-1">
                      {aiBreakdown.candidateMoments.map((m: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setStartSec(m.startSec);
                            setDurationSec(m.endSec - m.startSec);
                          }}
                          className="w-full text-left p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 flex items-center justify-between"
                        >
                          <span>{m.startSec}s - {m.endSec}s ({m.endSec - m.startSec}s): {m.reason}</span>
                          <span className="text-[10px] text-red-400 font-bold">Use</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 2: FFmpeg 9:16 Video Clipper */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Scissors className="w-4 h-4 text-red-400" />
            <span>Step 2: FFmpeg 9:16 Vertical Video Clipper</span>
          </h2>

          <div className="space-y-3 text-xs">
            {/* Source video picker */}
            <div>
              <label className="text-slate-400 block mb-1">Source Video File (MP4/MOV)</label>
              <label className="border border-slate-700 hover:border-slate-600 rounded-xl p-3 flex items-center justify-between bg-slate-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-200">
                    {sourceFile ? sourceFile.name : 'Choose source video file to clip...'}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                  {uploadingSource ? 'Uploading...' : 'Browse'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleUploadSource}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Short Title (Includes #Shorts)</label>
              <input
                type="text"
                value={shortTitle}
                onChange={e => setShortTitle(e.target.value)}
                placeholder="e.g. Nepali Beat Drop Goes Hard 🔥 #Shorts"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Start Second (e.g. 15)</label>
                <input
                  type="number"
                  min={0}
                  value={startSec}
                  onChange={e => setStartSec(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Duration (max 60s)</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={durationSec}
                  onChange={e => setDurationSec(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>
            </div>

            {clipMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{clipMessage}</span>
              </div>
            )}

            <button
              onClick={handleClipAndProcess}
              disabled={clipping || uploadingSource}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 mt-2"
            >
              {clipping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Vertical Crop (1080x1920) with FFmpeg...</span>
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Clip & Convert to 9:16 Short</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cataloged Shorts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-red-500" />
          <span>Produced YouTube Shorts</span>
        </h2>

        <div className="space-y-3">
          {shorts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No Shorts created yet. Use the tool above to generate and clip high-energy Nepali beat moments!
            </p>
          ) : (
            shorts.map(s => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-16 bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 text-slate-500">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        s.status === 'uploaded'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : s.status === 'processing'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-indigo-500/20 text-indigo-400'
                      }`}>
                        {s.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {s.segmentStart}s - {s.segmentEnd}s
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1">{s.title}</h3>
                    {s.hook && <p className="text-[11px] text-indigo-300 mt-0.5">Hook: "{s.hook}"</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {s.status === 'ready' && (
                    <button
                      onClick={() => handleUploadToYouTube(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Upload to YouTube</span>
                    </button>
                  )}
                  {s.youtubeVideoId && (
                    <a
                      href={`https://www.youtube.com/shorts/${s.youtubeVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <span>Watch Short</span>
                      <ExternalLink className="w-3.5 h-3.5" />
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
