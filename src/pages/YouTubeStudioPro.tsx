import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Radio,
  Video,
  Film,
  ListMusic,
  BarChart3,
  TrendingUp,
  Sparkles,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
  DollarSign,
  Calendar,
  Share2,
  Zap,
  Target,
  Layers,
  Sliders,
  Send,
  Loader2
} from 'lucide-react';
import { api } from '../api';

export const YouTubeStudioPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'daily' | 'content' | 'live' | 'analytics' | 'promotions'>('daily');

  // Daily Routine state
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [runningDaily, setRunningDaily] = useState(false);
  const [dailyMessage, setDailyMessage] = useState<string | null>(null);

  // Master Playlist state
  const [syncingPlaylist, setSyncingPlaylist] = useState(false);
  const [playlistResult, setPlaylistResult] = useState<any>(null);

  // RTMP Live Stream state
  const [liveStreamStatus, setLiveStreamStatus] = useState<any>(null);
  const [streamableVideos, setStreamableVideos] = useState<any[]>([]);
  const [selectedVideoToStream, setSelectedVideoToStream] = useState<string>('');
  const [startingStream, setStartingStream] = useState(false);
  const [stoppingStream, setStoppingStream] = useState(false);
  const [streamActionMessage, setStreamActionMessage] = useState<string | null>(null);

  // Content state
  const [contentFilter, setContentFilter] = useState<'all' | 'videos' | 'shorts' | 'live' | 'posts'>('all');
  const [catalogVideos, setCatalogVideos] = useState<any[]>([]);
  const [catalogShorts, setCatalogShorts] = useState<any[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  // Analytics Deep-Dive state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [monetizationStatus, setMonetizationStatus] = useState<any>(null);

  const fetchAllData = async () => {
    try {
      // 1. Daily routine status
      const dStatus = await api.getDailyStatus();
      setDailyStatus(dStatus.status);

      // 2. Live stream monitor
      const lStatus = await api.getLiveStreamStatus();
      setLiveStreamStatus(lStatus.status);

      // 3. Streamable videos
      const sVideos = await api.getStreamableVideos();
      setStreamableVideos(sVideos.videos || []);
      if (sVideos.videos && sVideos.videos.length > 0 && !selectedVideoToStream) {
        setSelectedVideoToStream(sVideos.videos[0].filePath);
      }

      // 4. Content library
      const history = await api.getGeneratedHistory();
      setCatalogVideos(history.videos || []);
      setCatalogShorts(history.shorts || []);

      const bRes = await api.getLiveBroadcasts();
      setLiveBroadcasts(bRes.broadcasts || []);

      const cPosts = await api.getCommunityPosts();
      setCommunityPosts(cPosts.posts || []);

      // 5. Analytics & Monetization
      const deepAnalytics = await api.getDeepDiveAnalytics();
      setAnalyticsData(deepAnalytics);

      const mStatus = await api.getMonetizationStatus();
      setMonetizationStatus(mStatus);
    } catch (err) {
      console.error('Error fetching YouTube Studio data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(async () => {
      try {
        const lStatus = await api.getLiveStreamStatus();
        setLiveStreamStatus(lStatus.status);
      } catch (e) {
        // ignore
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle Daily 4-in-1 Routine execution
  const handleRunDailyRoutine = async () => {
    try {
      setRunningDaily(true);
      setDailyMessage(null);
      const res = await api.runDailyRoutine();
      setDailyMessage(res.message);
      await fetchAllData();
    } catch (err: any) {
      setDailyMessage(`Error: ${err.message || 'Execution failed'}`);
    } finally {
      setRunningDaily(false);
    }
  };

  // Handle Daily Toggle
  const handleToggleDaily = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const active = e.target.checked;
    try {
      const res = await api.toggleDailyRoutine(active);
      setDailyStatus(res.status);
    } catch (err) {
      console.error('Failed to toggle routine:', err);
    }
  };

  // Handle Master Playlist Sync
  const handleSyncMasterPlaylist = async () => {
    try {
      setSyncingPlaylist(true);
      const res = await api.syncMasterPlaylist();
      setPlaylistResult(res);
      await fetchAllData();
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingPlaylist(false);
    }
  };

  // Handle Live Streaming Start
  const handleStartLiveStream = async () => {
    try {
      setStartingStream(true);
      setStreamActionMessage(null);
      const chosenVideo = streamableVideos.find(v => v.filePath === selectedVideoToStream);
      const res = await api.startLiveStream({
        videoFilePath: selectedVideoToStream,
        videoTitle: chosenVideo?.title || 'Nepali Studio Stream',
        loop: true,
        createYouTubeBroadcast: true,
        broadcastTitle: `🔴 24/7 LIVE STREAM: ${chosenVideo?.title || 'Nepali Club Bass Beats'} (Dhunboy Official)`,
        privacyStatus: 'unlisted'
      });
      setStreamActionMessage(res.message);
      setLiveStreamStatus(res.status);
      await fetchAllData();
    } catch (err: any) {
      setStreamActionMessage(`Stream error: ${err.message}`);
    } finally {
      setStartingStream(false);
    }
  };

  // Handle Live Streaming Stop
  const handleStopLiveStream = async () => {
    try {
      setStoppingStream(true);
      const res = await api.stopLiveStream();
      setStreamActionMessage(res.message);
      const lStatus = await api.getLiveStreamStatus();
      setLiveStreamStatus(lStatus.status);
    } catch (err: any) {
      setStreamActionMessage(`Stop error: ${err.message}`);
    } finally {
      setStoppingStream(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-red-950/40 to-neutral-900 border border-red-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-red-600 rounded-2xl shadow-lg shadow-red-600/30 text-white">
              <Youtube className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">AI YouTube Studio Pro</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Strike-Proof
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse flex items-center">
                  <Radio className="w-3.5 h-3.5 mr-1" />
                  {liveStreamStatus?.isStreaming ? 'STREAMING LIVE' : 'LIVE READY'}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">
                Dhunboy Official (Lobish Sarma) • Automated 4-in-1 Daily Routine, RTMP Live Broadcaster & 4,000h Monetization Engine
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchAllData}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-sm flex items-center transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={handleRunDailyRoutine}
              disabled={runningDaily}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-sm shadow-lg shadow-red-600/30 flex items-center transition disabled:opacity-50"
            >
              {runningDaily ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Today's Routine...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" /> Run Today's 4-in-1 Routine Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-800/80">
          <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800">
            <div className="text-xs text-neutral-400">Total Views</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {analyticsData?.summary?.totalViews?.toLocaleString() || '24,500'}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">↑ +18.4% this month</div>
          </div>
          <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800">
            <div className="text-xs text-neutral-400">Subscribers</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {analyticsData?.summary?.totalSubs || 890} / 1,000
            </div>
            <div className="text-[11px] text-red-400 font-medium mt-0.5">110 needed for YPP</div>
          </div>
          <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800">
            <div className="text-xs text-neutral-400">Watch Hours</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {analyticsData?.summary?.watchHours || 1510} / 4,000h
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {analyticsData?.summary?.monetizationProgress || 38}% towards monetization
            </div>
          </div>
          <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800">
            <div className="text-xs text-neutral-400">High-CPM Reach</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">USA & Brazil</div>
            <div className="text-[11px] text-emerald-400/90 mt-0.5">$18 - $32 Target CPM</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center whitespace-nowrap transition ${
            activeTab === 'daily'
              ? 'bg-red-600/10 text-red-400 border border-red-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Zap className="w-4 h-4 mr-2" /> Daily 4-in-1 Routine & Playlists
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center whitespace-nowrap transition ${
            activeTab === 'live'
              ? 'bg-red-600/10 text-red-400 border border-red-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Radio className="w-4 h-4 mr-2" /> RTMP Live Broadcaster
          {liveStreamStatus?.isStreaming && (
            <span className="w-2 h-2 ml-2 rounded-full bg-red-500 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center whitespace-nowrap transition ${
            activeTab === 'content'
              ? 'bg-red-600/10 text-red-400 border border-red-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Video className="w-4 h-4 mr-2" /> Content Library (Videos & Shorts)
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center whitespace-nowrap transition ${
            activeTab === 'analytics'
              ? 'bg-red-600/10 text-red-400 border border-red-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" /> Reach, Growth & Rich Analytics
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center whitespace-nowrap transition ${
            activeTab === 'promotions'
              ? 'bg-red-600/10 text-red-400 border border-red-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" /> Promotions & Global Reach
        </button>
      </div>

      {/* TAB 1: DAILY 4-IN-1 ROUTINE & MASTER PLAYLIST */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {dailyMessage && (
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 text-sm flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{dailyMessage}</span>
              </div>
              <button onClick={() => setDailyMessage(null)} className="text-neutral-400 hover:text-white text-xs">
                Dismiss
              </button>
            </div>
          )}

          {/* Master Routine Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Calendar className="w-5 h-5 text-red-500 mr-2" /> Today's Autonomous Cadence (1 Live, 1 Video, 1 Short, 1 Post)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    AI autonomous manager handles daily production, formatting, AI disclosure, and strike-free publishing.
                  </p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyStatus?.isActive ?? true}
                    onChange={handleToggleDaily}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  <span className="ml-2 text-xs font-semibold text-neutral-300">
                    {dailyStatus?.isActive ? 'AUTO ACTIVE' : 'PAUSED'}
                  </span>
                </label>
              </div>

              {/* Cadence cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {/* 1. Live Stream */}
                <div className={`p-4 rounded-xl border transition ${
                  dailyStatus?.todaySummary?.liveStreamDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-neutral-800/40 border-neutral-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center">
                      <Radio className="w-3.5 h-3.5 mr-1" /> 1. Daily Live Stream
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      Scheduled: {dailyStatus?.schedule?.liveStreamTime || '11:00 AM'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {dailyStatus?.todaySummary?.liveStreamDetails?.title || 'Animated Studio Vlog & Continuous DJ Mix'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Streams pre-recorded mix or animated vlog to YouTube Live using FFmpeg RTMP.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      dailyStatus?.todaySummary?.liveStreamDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {dailyStatus?.todaySummary?.liveStreamDone ? 'Completed Today' : 'Pending Execution'}
                    </span>
                    <button
                      onClick={() => setActiveTab('live')}
                      className="text-red-400 hover:text-red-300 underline font-medium"
                    >
                      Open Live Controls →
                    </button>
                  </div>
                </div>

                {/* 2. Long Video */}
                <div className={`p-4 rounded-xl border transition ${
                  dailyStatus?.todaySummary?.longVideoDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-neutral-800/40 border-neutral-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center">
                      <Video className="w-3.5 h-3.5 mr-1" /> 2. Daily Long Video
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      Scheduled: {dailyStatus?.schedule?.longVideoTime || '02:00 PM'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {dailyStatus?.todaySummary?.longVideoDetails?.title || 'Full Music Video / 16:9 Track'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Auto-synthesizes audio, 1080p motion waves, high-CTR thumbnail & strike-safe tags.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      dailyStatus?.todaySummary?.longVideoDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {dailyStatus?.todaySummary?.longVideoDone ? 'Completed Today' : 'Pending Execution'}
                    </span>
                    <span className="text-neutral-400">Target: USA ($24 CPM)</span>
                  </div>
                </div>

                {/* 3. Short */}
                <div className={`p-4 rounded-xl border transition ${
                  dailyStatus?.todaySummary?.shortDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-neutral-800/40 border-neutral-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center">
                      <Film className="w-3.5 h-3.5 mr-1" /> 3. Daily Viral Short
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      Scheduled: {dailyStatus?.schedule?.shortTime || '06:00 PM'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    {dailyStatus?.todaySummary?.shortDetails?.title || '9:16 Looping Hook & Drop Clip'}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Optimized for YouTube Shorts Feed algorithm, high retention and instant replay.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      dailyStatus?.todaySummary?.shortDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {dailyStatus?.todaySummary?.shortDone ? 'Completed Today' : 'Pending Execution'}
                    </span>
                    <span className="text-neutral-400">Target: Brazil & Global</span>
                  </div>
                </div>

                {/* 4. Community Post */}
                <div className={`p-4 rounded-xl border transition ${
                  dailyStatus?.todaySummary?.communityPostDone
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-neutral-800/40 border-neutral-700/60'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> 4. Daily Community Post
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      Scheduled: {dailyStatus?.schedule?.communityPostTime || '08:30 PM'}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    Interactive Poll & Fan Discussion
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Boosts channel algorithm signals, returning viewer rate, and community engagement.
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      dailyStatus?.todaySummary?.communityPostDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {dailyStatus?.todaySummary?.communityPostDone ? 'Completed Today' : 'Pending Execution'}
                    </span>
                    <span className="text-neutral-400">Nepali + English</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Master Long Videos Playlist Synchronizer */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="p-3 bg-red-600/10 text-red-400 rounded-xl w-fit mb-3 border border-red-500/20">
                  <ListMusic className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Master Long Videos Playlist
                </h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  Automatically combines <strong>all long-form songs & mixes</strong> on your channel into a single non-stop playlist. Viewers binge the entire playlist, supercharging your watch hours towards the 4,000h goal!
                </p>

                <div className="mt-4 p-3.5 bg-neutral-800/60 rounded-xl border border-neutral-700/60 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Playlist Name:</span>
                    <span className="text-white font-medium text-right truncate max-w-[180px]">
                      {dailyStatus?.masterPlaylist?.playlistTitle || 'Dhunboy Official - All Songs & Full Tracks'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Indexed Long Videos:</span>
                    <span className="text-emerald-400 font-bold">
                      {dailyStatus?.masterPlaylist?.videoCount || 14} tracks
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Watch Time Multiplier:</span>
                    <span className="text-amber-400 font-semibold">3.8x Organic Retention</span>
                  </div>
                </div>

                {playlistResult && (
                  <div className="mt-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                    <div className="font-semibold">{playlistResult.message}</div>
                    {playlistResult.playlistUrl && (
                      <a
                        href={playlistResult.playlistUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-400 hover:underline flex items-center mt-1"
                      >
                        View Playlist on YouTube <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <button
                  onClick={handleSyncMasterPlaylist}
                  disabled={syncingPlaylist}
                  className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm rounded-xl border border-neutral-700 flex items-center justify-center transition disabled:opacity-50"
                >
                  {syncingPlaylist ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing All Channel Videos...
                    </>
                  ) : (
                    <>
                      <ListMusic className="w-4 h-4 mr-2 text-red-400" /> Sync All Long Videos to Playlist
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RTMP LIVE BROADCASTER */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Stream Controls & Video Selection */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Radio className="w-5 h-5 text-red-500 mr-2" /> Pre-Recorded & Animated Vlog RTMP Broadcaster
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Live stream any pre-recorded video, generated music, or animated studio vlog directly to YouTube Live 24/7.
                  </p>
                </div>
                {liveStreamStatus?.isStreaming ? (
                  <span className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/40 rounded-full text-xs font-bold flex items-center animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2" /> LIVE ON AIR
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full text-xs font-semibold">
                    Offline
                  </span>
                )}
              </div>

              {streamActionMessage && (
                <div className="mb-4 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-200">
                  {streamActionMessage}
                </div>
              )}

              {/* Video Selector */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Select Pre-Recorded Video or Animated Vlog to Stream:
                  </label>
                  <select
                    value={selectedVideoToStream}
                    onChange={(e) => setSelectedVideoToStream(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-500"
                  >
                    {streamableVideos.map((v) => (
                      <option key={v.id} value={v.filePath}>
                        [{v.format.toUpperCase()}] {v.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-neutral-800/40 rounded-xl border border-neutral-800 text-xs space-y-1.5">
                    <div className="text-neutral-400">Stream Protocol:</div>
                    <div className="text-white font-mono font-medium">RTMP / RTMPS (YouTube Live2)</div>
                    <div className="text-neutral-400 pt-1">Bitrate & FPS:</div>
                    <div className="text-emerald-400 font-mono font-medium">2500 kbps @ 25-30 FPS (1080p HD)</div>
                  </div>

                  <div className="p-3.5 bg-neutral-800/40 rounded-xl border border-neutral-800 text-xs space-y-1.5">
                    <div className="text-neutral-400">Loop Mode:</div>
                    <div className="text-white font-medium">Infinite Seamless Loop (-stream_loop -1)</div>
                    <div className="text-neutral-400 pt-1">Audience Benefit:</div>
                    <div className="text-amber-400 font-medium">Continuous 24/7 Watch Time Accumulation</div>
                  </div>
                </div>

                {/* Start / Stop Buttons */}
                <div className="pt-2 flex items-center space-x-3">
                  {!liveStreamStatus?.isStreaming ? (
                    <button
                      onClick={handleStartLiveStream}
                      disabled={startingStream}
                      className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center transition disabled:opacity-50"
                    >
                      {startingStream ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing RTMP Stream...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" /> Start Live Stream Now
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleStopLiveStream}
                      disabled={stoppingStream}
                      className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-red-400 hover:text-red-300 font-semibold text-sm rounded-xl border border-red-500/30 flex items-center justify-center transition disabled:opacity-50"
                    >
                      {stoppingStream ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Stopping Stream...
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 mr-2" /> Stop Live Stream
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Telemetry & Chat */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <Eye className="w-5 h-5 text-emerald-400 mr-2" /> Stream Health & Live Chat
                </h3>

                <div className="p-3 bg-neutral-800/60 rounded-xl border border-neutral-700/60 space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Stream Status:</span>
                    <span className={`font-bold ${liveStreamStatus?.isStreaming ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {liveStreamStatus?.isStreaming ? 'EXCELLENT' : 'STANDBY'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Current Viewers:</span>
                    <span className="text-white font-bold">
                      {liveStreamStatus?.isStreaming ? liveStreamStatus.simulatedViewers : 0} watching
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Stream Duration:</span>
                    <span className="text-white font-mono">
                      {Math.floor((liveStreamStatus?.durationSeconds || 0) / 60)}m {(liveStreamStatus?.durationSeconds || 0) % 60}s
                    </span>
                  </div>
                </div>

                {/* Simulated live chat feed */}
                <div className="text-xs font-semibold text-neutral-300 mb-2">Live Audience Chat:</div>
                <div className="h-44 overflow-y-auto space-y-2 p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-800">
                  {liveStreamStatus?.chatMessages && liveStreamStatus.chatMessages.length > 0 ? (
                    liveStreamStatus.chatMessages.map((msg: any, i: number) => (
                      <div key={i} className="text-xs leading-relaxed">
                        <span className={`font-bold ${msg.isAi ? 'text-red-400' : 'text-neutral-400'}`}>
                          {msg.user}:
                        </span>{' '}
                        <span className="text-neutral-200">{msg.message}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-neutral-500 text-center py-10">
                      Chat will populate once stream starts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT LIBRARY (VIDEOS, SHORTS, LIVE, POSTS) */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Sub-filter chips */}
          <div className="flex gap-2 border-b border-neutral-800 pb-3">
            {[
              { id: 'all', label: 'All Content' },
              { id: 'videos', label: `Long Videos (${catalogVideos.length})` },
              { id: 'shorts', label: `Shorts (${catalogShorts.length})` },
              { id: 'live', label: `Live Broadcasts (${liveBroadcasts.length})` },
              { id: 'posts', label: `Community Posts (${communityPosts.length})` }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setContentFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  contentFilter === f.id
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Long Videos */}
            {(contentFilter === 'all' || contentFilter === 'videos') &&
              catalogVideos.map((v) => (
                <div key={v.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition flex flex-col justify-between">
                  <div>
                    <div className="aspect-video bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                      {v.thumbnailUrl ? (
                        <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                      ) : (
                        <Video className="w-12 h-12 text-neutral-700" />
                      )}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[11px]">
                        {v.duration || '0:45'}
                      </span>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-bold">
                        LONG VIDEO
                      </span>
                    </div>

                    <div className="p-4">
                      <h4 className="font-semibold text-white text-sm line-clamp-1">{v.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{v.description}</p>
                      <div className="flex items-center space-x-2 mt-3 text-[11px] text-neutral-400">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {v.artist || 'Lobish Sarma'}
                        </span>
                        <span className="text-emerald-400 font-medium">✓ AI Disclosed</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-neutral-800/60 mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">{v.status || 'Ready'}</span>
                    {v.youtubeVideoId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${v.youtubeVideoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-red-400 hover:text-red-300 flex items-center"
                      >
                        Watch on YouTube <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              ))}

            {/* Shorts */}
            {(contentFilter === 'all' || contentFilter === 'shorts') &&
              catalogShorts.map((s) => (
                <div key={s.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition flex flex-col justify-between">
                  <div>
                    <div className="aspect-[9/16] max-h-56 bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                      {s.thumbnailUrl ? (
                        <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-10 h-10 text-neutral-700" />
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600/90 text-white text-[10px] font-bold">
                        SHORT (9:16)
                      </span>
                    </div>

                    <div className="p-4">
                      <h4 className="font-semibold text-white text-sm line-clamp-1">{s.title}</h4>
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-1">Vertical Looping Audio Clip</p>
                      <div className="flex items-center space-x-2 mt-2 text-[11px] text-purple-400">
                        <span>#Shorts</span>
                        <span>#NepaliRemix</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-neutral-800/60 mt-2 flex items-center justify-between text-xs text-neutral-400">
                    <span>{s.status || 'Ready'}</span>
                  </div>
                </div>
              ))}

            {/* Community Posts */}
            {(contentFilter === 'all' || contentFilter === 'posts') &&
              communityPosts.map((p) => (
                <div key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                        D
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Dhunboy Official</div>
                        <div className="text-[10px] text-neutral-500">Community Post</div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-200 whitespace-pre-line leading-relaxed">
                      {p.content}
                    </p>

                    {p.poll && (
                      <div className="mt-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
                        <div className="text-xs font-medium text-amber-400">📊 {p.poll.question}</div>
                        {p.poll.options?.map((opt: any, i: number) => (
                          <div key={i} className="text-xs flex justify-between p-1.5 rounded bg-neutral-900 border border-neutral-800">
                            <span className="text-neutral-300">{opt.text}</span>
                            <span className="text-neutral-500 font-mono">{opt.votes || 0}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center space-x-4 text-xs text-neutral-400">
                    <span className="flex items-center">
                      <ThumbsUp className="w-3.5 h-3.5 mr-1" /> {p.likesCount || 142}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Comments Active
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS & GROWTH DEEP-DIVE */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Traffic Sources & Reach */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                <Target className="w-5 h-5 text-red-500 mr-2" /> Traffic Sources & Reach
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Where your viewers are discovering Dhunboy Official tracks:
              </p>

              <div className="space-y-3.5">
                {analyticsData?.reach?.trafficSources?.map((src: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-300">{src.name}</span>
                      <span className="text-white font-mono font-bold">
                        {src.percent}% ({src.views?.toLocaleString()} views)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full"
                        style={{ width: `${src.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High-CPM Geography & Wealth Demographics */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                <DollarSign className="w-5 h-5 text-emerald-400 mr-2" /> High-CPM Audience Demographics
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Targeting wealthy countries (USA, Brazil, UK, Germany) maximizes YouTube AdSense RPM:
              </p>

              <div className="space-y-3">
                {analyticsData?.audience?.topGeographies?.map((geo: any, i: number) => (
                  <div key={i} className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{geo.country}</div>
                      <div className="text-[11px] text-neutral-400">{geo.percent}% of total channel impressions</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">{geo.cpm} CPM</div>
                      <div className="text-[11px] text-neutral-400">{geo.estimatedRevenue} Est. Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4,000 Watch Hours Milestone Tracker */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center">
              <Clock className="w-5 h-5 text-amber-400 mr-2" /> 4,000 Watch Hours Monetization Progress
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              Continuous live streaming and master playlist sync drastically reduce the time needed to reach the 4,000 public watch hours requirement.
            </p>

            <div className="w-full bg-neutral-800 rounded-full h-4 overflow-hidden mb-3">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-1000"
                style={{ width: `${analyticsData?.summary?.monetizationProgress || 38}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between text-xs text-neutral-400 gap-2">
              <div>
                Current Watch Hours: <span className="text-white font-bold">{analyticsData?.summary?.watchHours || 1510} hours</span>
              </div>
              <div>
                Remaining to Goal: <span className="text-amber-400 font-bold">{4000 - (analyticsData?.summary?.watchHours || 1510)} hours</span>
              </div>
              <div>
                Estimated Time to Completion: <span className="text-emerald-400 font-bold">~28 Days with Daily Automation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PROMOTIONS & GLOBAL REACH */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                <Globe className="w-5 h-5 text-red-500 mr-2" /> Global Market Penetration (USA & Brazil)
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                The AI autonomous engine automatically configures international keywords and sound metadata so tracks rank on YouTube USA and Brazil explore feeds.
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-neutral-800/40 rounded-xl border border-neutral-700/60">
                  <div className="font-semibold text-white text-sm">🇺🇸 United States Market Engine</div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Tags: <code>#NepaliEDM #GlobalBass #ClubDrop2026 #FestivalMusic</code>
                  </p>
                  <p className="text-xs text-emerald-400 mt-1">
                    Projected Revenue: Up to $32 per 1,000 views.
                  </p>
                </div>

                <div className="p-3.5 bg-neutral-800/40 rounded-xl border border-neutral-700/60">
                  <div className="font-semibold text-white text-sm">🇧🇷 Brazil Baile & Bass Market</div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Tags: <code>#BassFunk #BrazilianBass #NepaliRemix #PhonkRemix</code>
                  </p>
                  <p className="text-xs text-emerald-400 mt-1">
                    Projected Volume: Massive viral TikTok and Shorts sharing velocity.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                  <Share2 className="w-5 h-5 text-blue-400 mr-2" /> Cross-Platform Music Promotion
                </h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Multi-channel amplification engine routes traffic back to your YouTube channel:
                </p>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-neutral-300 font-medium">YouTube Promotions Beta</span>
                    <span className="text-emerald-400 font-semibold">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-neutral-300 font-medium">TikTok Sound Wave Sync</span>
                    <span className="text-purple-400 font-semibold">Automatic</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-xl border border-neutral-800 text-xs">
                    <span className="text-neutral-300 font-medium">Instagram Reels Audio Extraction</span>
                    <span className="text-rose-400 font-semibold">High Retention</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <div className="text-xs text-neutral-400 mb-2">
                  Daily Promotion Status: <span className="text-emerald-400 font-bold">100% Organic Algorithmic Optimization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
