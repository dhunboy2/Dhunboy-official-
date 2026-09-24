import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileVideo,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Clock,
  ShieldAlert,
  Image as ImageIcon,
  Tag,
  ListMusic,
  Eye,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { api } from '../api';
import { PlaylistRecord, DescriptionTemplate } from '../types';

export const UploadCenter: React.FC = () => {
  // Video File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Metadata Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('Lobish Sarma');
  const [genre, setGenre] = useState('Nepali DJ Remix');
  const [language, setLanguage] = useState('Nepali');
  const [isAiAssisted, setIsAiAssisted] = useState(false);
  const [isShort, setIsShort] = useState(false);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Dhunboy Official, Lobish Sarma, Nepali DJ Remix, New Nepali Song 2026, Nepali Dance Song');
  const [privacyStatus, setPrivacyStatus] = useState<'private' | 'unlisted' | 'public'>('unlisted');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  // AI Generation states
  const [generatingTitles, setGeneratingTitles] = useState(false);
  const [titleVariations, setTitleVariations] = useState<{
    searchFocused?: string;
    curiosityFocused?: string;
    cleanProfessional?: string;
    musicFocused?: string;
    shortMobileFriendly?: string;
  } | null>(null);

  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [contentInsights, setContentInsights] = useState<any>(null);

  // Templates & Playlists
  const [templates, setTemplates] = useState<DescriptionTemplate[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-nepali-dj-remix');

  // Publish Status
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string; videoId?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Load templates & playlists
    api.getTemplates().then(res => setTemplates(res.templates)).catch(() => {});
    api.getPlaylists().then(res => setPlaylists(res.localPlaylists)).catch(() => {});
  }, []);

  // Handle File Selection & Auto Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDuplicateWarning(null);
    setPublishResult(null);
    setErrorMessage(null);

    // Auto set title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }

    try {
      setUploadingFile(true);
      const res = await api.uploadVideoFile(file);
      setUploadedFilePath(res.filePath);
      setFileHash(res.fileHash);

      // Check duplicates
      const dupCheck = await api.checkDuplicate(title || file.name, res.fileHash);
      if (dupCheck.isDuplicate) {
        setDuplicateWarning(dupCheck.warning || 'Potential duplicate detected in database.');
      }
    } catch (err: any) {
      setErrorMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // AI Content Analysis
  const handleAnalyzeContent = async () => {
    if (!title) {
      alert('Please enter a title or track name first');
      return;
    }
    try {
      setAnalyzingContent(true);
      const res = await api.analyzeContent({
        title,
        artist,
        genre,
        language,
        isAiAssisted
      });
      setContentInsights(res.analysis);
      if (res.analysis?.suggestedGenre) {
        setGenre(res.analysis.suggestedGenre);
      }
    } catch (err: any) {
      alert(`AI Error: ${err.message}`);
    } finally {
      setAnalyzingContent(false);
    }
  };

  // Generate 5 Title Variations
  const handleGenerateTitles = async () => {
    if (!title) {
      alert('Please enter a song title');
      return;
    }
    try {
      setGeneratingTitles(true);
      const res = await api.generateTitles({
        songTitle: title,
        artist,
        genre,
        isRemix: genre.toLowerCase().includes('remix')
      });
      setTitleVariations(res.titles);
    } catch (err: any) {
      alert(`Error generating titles: ${err.message}`);
    } finally {
      setGeneratingTitles(false);
    }
  };

  // Apply Description Template
  const handleApplyTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;

    let text = tpl.template;
    text = text.replace(/{{TITLE}}/g, title || 'Track Title');
    text = text.replace(/{{ARTIST}}/g, artist || 'Lobish Sarma');
    text = text.replace(/{{CHANNEL}}/g, 'Dhunboy Official');
    text = text.replace(/{{SONG_TYPE}}/g, genre || 'Nepali DJ Remix');
    text = text.replace(/{{CREDITS}}/g, `Executive Producer: Lobish Sarma\nLabel: Dhunboy Official`);
    text = text.replace(/{{SOCIAL_LINKS}}/g, `YouTube: https://www.youtube.com/@DhunboyOfficial\nContact: dhunboyofficial@gmail.com`);

    if (isAiAssisted) {
      text = text.replace(
        /{{AI_DISCLOSURE}}/g,
        `🤖 AI Transparency Disclosure:\nThis content was created with the assistance of modern digital and AI audio tools. Elements of composition, tuning, or visual artwork were designed and mastered by Lobish Sarma.`
      );
    } else {
      text = text.replace(/{{AI_DISCLOSURE}}/g, '');
    }

    setDescription(text.trim());
  };

  // Submit Publish
  const handlePublish = async () => {
    if (!title) {
      setErrorMessage('Please provide a video title.');
      return;
    }

    try {
      setPublishing(true);
      setErrorMessage(null);
      setPublishResult(null);

      const payload = {
        title,
        description,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        categoryId: '10', // Music
        privacyStatus,
        isScheduled,
        scheduledTime: isScheduled ? scheduledTime : undefined,
        isShort,
        filePath: uploadedFilePath,
        fileHash,
        artist,
        songType: genre,
        isAiAssisted,
        playlistId: selectedPlaylistId
      };

      const res = await api.publishVideo(payload);
      setPublishResult({
        success: true,
        message: res.message,
        videoId: res.video.youtubeVideoId || res.video.id
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <UploadCloud className="w-6 h-6 text-red-500" />
            <span>Upload Center & Autonomous AI Production</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Publish long-form songs or Shorts directly to Dhunboy Official with real YouTube API integration.
          </p>
        </div>

        {/* Content Type Switch */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setIsShort(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isShort ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Long-Form Track
          </button>
          <button
            onClick={() => setIsShort(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isShort ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            YouTube Short (9:16)
          </button>
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Duplicate Protection Guard Active</p>
            <p className="mt-0.5">{duplicateWarning}</p>
          </div>
        </div>
      )}

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Execution Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {publishResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Task Dispatched Successfully</p>
            <p className="mt-0.5">{publishResult.message}</p>
            {publishResult.videoId && (
              <p className="mt-1 font-mono text-[11px] text-slate-300">
                Identifier: {publishResult.videoId}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Dropzone & AI Controls */}
        <div className="space-y-6">
          {/* File Dropzone */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileVideo className="w-4 h-4 text-red-400" />
              <span>Video File</span>
            </h2>

            <label className="border-2 border-dashed border-slate-700 hover:border-red-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-850/50 hover:bg-slate-800/40">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Select or drop MP4 / MOV video'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                {uploadingFile
                  ? 'Computing SHA-256 hash & uploading to server...'
                  : selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                  : 'Up to 500 MB (Max quality)'}
              </span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadingFile}
              />
            </label>

            {fileHash && (
              <div className="mt-3 p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono break-all">
                <span className="text-slate-500 block">SHA-256 Hash:</span>
                {fileHash}
              </div>
            )}
          </div>

          {/* AI Metadata Assistant Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>AI Content Intelligence</span>
              </h2>
              <button
                onClick={handleAnalyzeContent}
                disabled={analyzingContent}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{analyzingContent ? 'Analyzing...' : 'Analyze Track'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Artist / Producer</label>
                <input
                  type="text"
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Genre / Category</label>
                <select
                  value={genre}
                  onChange={e => setGenre(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="Nepali DJ Remix">Nepali DJ Remix</option>
                  <option value="Nepali Song">Nepali Pop / Melodic</option>
                  <option value="Lok Dohori">Nepali Lok Dohori (Folk)</option>
                  <option value="Teej Special">Teej Special / Festival</option>
                  <option value="Nepali Dance Mix">Nepali Dance / Club Beat</option>
                  <option value="Hindi Song">Hindi Song</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAiAssisted}
                    onChange={e => setIsAiAssisted(e.target.checked)}
                    className="rounded border-slate-700 text-red-600 focus:ring-0"
                  />
                  <span className="text-slate-300">
                    AI-Assisted Music (Includes ethical AI disclosure)
                  </span>
                </label>
              </div>

              {contentInsights && (
                <div className="mt-3 p-3 rounded-xl bg-slate-850 border border-indigo-900/40 text-[11px] text-slate-300 space-y-1.5">
                  <p className="font-semibold text-indigo-300">AI Analysis Result:</p>
                  <p><strong>Audience:</strong> {contentInsights.targetAudience}</p>
                  <p><strong>Tone:</strong> {contentInsights.contentTone}</p>
                  {contentInsights.marketingHook && (
                    <p><strong>Hook:</strong> {contentInsights.marketingHook}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Title, Description, Tags, Privacy */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
            {/* Title Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Video Title (Max 100 characters)
                </label>
                <button
                  onClick={handleGenerateTitles}
                  disabled={generatingTitles}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingTitles ? 'Generating Variations...' : '5 AI Title Styles'}</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Maya Ko Dhun - New Nepali DJ Remix 2026 | Lobish Sarma"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-red-500 font-medium"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Suitable for mobile & search algorithms</span>
                <span>{title.length}/100</span>
              </div>

              {/* Title Variations Chips */}
              {titleVariations && (
                <div className="mt-3 p-3 rounded-xl bg-slate-850 border border-slate-700/60 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Choose an AI Generated Title Style:
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(titleVariations).map(([style, val]) => (
                      <div
                        key={style}
                        onClick={() => setTitle(val as string)}
                        className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-red-500/50 cursor-pointer flex items-center justify-between group transition-colors"
                      >
                        <div className="flex-1 pr-2">
                          <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                            {style.replace(/([A-Z])/g, ' $1')}
                          </span>
                          <span className="text-slate-200">{val}</span>
                        </div>
                        <span className="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 font-semibold">
                          Apply
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Section with Templates */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Description
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Template:</span>
                  <select
                    value={selectedTemplateId}
                    onChange={e => handleApplyTemplate(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-red-500"
                  >
                    {templates.map(tpl => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                rows={8}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detailed YouTube description with credits, copyright, links, and hashtags..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-red-500 font-mono leading-relaxed"
              />
            </div>

            {/* Tags & Playlists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>YouTube Tags (comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5 text-slate-400" />
                  <span>Assign to Playlist</span>
                </label>
                <select
                  value={selectedPlaylistId}
                  onChange={e => setSelectedPlaylistId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="">No Playlist (Direct)</option>
                  {playlists.map(pl => (
                    <option key={pl.id} value={pl.id}>
                      {pl.title} ({pl.itemCount} items)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Privacy & Scheduling */}
            <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-slate-300">Privacy Status:</span>
                  {(['unlisted', 'private', 'public'] as const).map(p => (
                    <label key={p} className="flex items-center gap-1.5 cursor-pointer capitalize">
                      <input
                        type="radio"
                        name="privacy"
                        value={p}
                        checked={privacyStatus === p}
                        onChange={() => setPrivacyStatus(p)}
                        className="text-red-600 focus:ring-0"
                      />
                      <span className="text-slate-300">{p}</span>
                    </label>
                  ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={e => setIsScheduled(e.target.checked)}
                    className="text-red-600 focus:ring-0 rounded"
                  />
                  <span className="text-slate-300 font-semibold">Schedule Release</span>
                </label>
              </div>

              {isScheduled && (
                <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-xs">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-400">Scheduled Time:</span>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing YouTube Release...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isScheduled ? 'Schedule Release' : 'Publish / Enqueue Upload'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
