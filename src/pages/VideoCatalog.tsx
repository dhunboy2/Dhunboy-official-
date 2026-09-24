import React, { useState, useEffect } from 'react';
import {
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Clock,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Share2,
  Play,
  Copy,
  Check,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { VideoRecord } from '../types';

interface VideoCatalogProps {
  onNavigate: (page: string) => void;
}

export const VideoCatalog: React.FC<VideoCatalogProps> = ({ onNavigate }) => {
  const [localVideos, setLocalVideos] = useState<VideoRecord[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'youtube' | 'shorts' | 'posts' | 'ai_creations'>('all');

  // AI Optimization Modal State
  const [optimizingVideo, setOptimizingVideo] = useState<any | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [disclosureSuccessMsg, setDisclosureSuccessMsg] = useState<string | null>(null);

  const loadAllCatalogData = async () => {
    try {
      setLoading(true);
      const [videosRes, communityRes] = await Promise.allSettled([
        api.getVideos(),
        api.getCommunityPosts()
      ]);

      if (videosRes.status === 'fulfilled') {
        setLocalVideos(videosRes.value.localVideos || []);
        setYoutubeVideos(videosRes.value.youtubeVideos || []);
      }
      if (communityRes.status === 'fulfilled') {
        setCommunityPosts(communityRes.value.posts || []);
      }
    } catch (err) {
      console.error('Failed to load video catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCatalogData();
  }, []);

  const handleOptimize = async (video: any) => {
    setOptimizingVideo(video);
    setOptimizationResult(null);
    setDisclosureSuccessMsg(null);
    try {
      setOptimizing(true);
      const res = await api.analyzeSEO({
        songTitle: video.snippet?.title || video.title,
        artist: video.artist || 'Lobish Sarma',
        genre: video.songType || 'Nepali DJ Remix',
        language: 'Nepali',
        targetAudience: 'Nepali youth, global dance fans, US and Brazil diaspora'
      });
      setOptimizationResult(res.seoRecord);
    } catch (err: any) {
      alert(`AI Optimization error: ${err.message}`);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert raw YouTube API item into standardized display format
  const normalizedYoutubeVideos = youtubeVideos.map(y => {
    const isShort = (y.snippet?.title || '').toLowerCase().includes('#shorts') ||
      (y.snippet?.description || '').toLowerCase().includes('#shorts');
    return {
      id: y.id,
      title: y.snippet?.title || 'YouTube Video',
      description: y.snippet?.description || '',
      thumbnailUrl: y.snippet?.thumbnails?.medium?.url || y.snippet?.thumbnails?.default?.url,
      publishedAt: y.snippet?.publishedAt,
      views: parseInt(y.statistics?.viewCount || '0', 10),
      likes: parseInt(y.statistics?.likeCount || '0', 10),
      comments: parseInt(y.statistics?.commentCount || '0', 10),
      privacyStatus: y.status?.privacyStatus || 'public',
      youtubeUrl: `https://www.youtube.com/watch?v=${y.id}`,
      isLiveYouTube: true,
      isShort,
      isAiAssisted: (y.snippet?.description || '').toLowerCase().includes('ai-assisted') ||
        (y.snippet?.description || '').toLowerCase().includes('ai disclosure')
    };
  });

  // Combine normalized YouTube videos + local videos (avoiding duplicates)
  const allItems = [
    ...normalizedYoutubeVideos,
    ...localVideos
      .filter(l => !normalizedYoutubeVideos.some(y => y.id === l.youtubeVideoId))
      .map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        thumbnailUrl: l.thumbnailUrl,
        publishedAt: l.publishedAt || l.createdAt,
        views: l.views ?? l.viewCount ?? 0,
        likes: l.likes ?? l.likeCount ?? 0,
        comments: l.comments ?? l.commentCount ?? 0,
        privacyStatus: l.privacyStatus,
        youtubeUrl: l.youtubeVideoId ? `https://www.youtube.com/watch?v=${l.youtubeVideoId}` : undefined,
        isLiveYouTube: !!l.youtubeVideoId,
        isShort: l.isShort,
        isAiAssisted: l.isAiAssisted || true,
        videoFilePath: l.videoFilePath,
        artist: l.artist
      }))
  ];

  // Filtering
  const filteredItems = allItems.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'youtube') return item.isLiveYouTube;
    if (activeTab === 'shorts') return item.isShort;
    if (activeTab === 'ai_creations') return !item.isLiveYouTube || item.isAiAssisted;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
              YouTube Studio Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              Direct Channel Library
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Video className="w-6 h-6 text-red-500" />
            <span>Channel Content & YouTube Studio Hub</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Full control of your videos, Shorts, community updates, and AI creations for <strong className="text-slate-200">Dhunboy Official</strong> without leaving the platform.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate('ai_studio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>AI Auto-Create Video</span>
          </button>

          <button
            onClick={loadAllCatalogData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync YT Studio</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Content', count: allItems.length },
            { id: 'youtube', label: '🔴 Live on YouTube', count: normalizedYoutubeVideos.length },
            { id: 'shorts', label: '⚡ Shorts', count: allItems.filter(i => i.isShort).length },
            { id: 'posts', label: '💬 Community Posts', count: communityPosts.length },
            { id: 'ai_creations', label: '✨ AI Generated', count: allItems.filter(i => i.isAiAssisted).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, lyrics, or tags..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* COMMUNITY POSTS TAB VIEW */}
      {activeTab === 'posts' ? (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>YouTube Community Tab Posts & Polls</span>
            </h3>
            <p className="text-xs text-slate-400">
              Engage with Dhunboy Official fans, announce upcoming Nepali dance releases, and conduct audience polls to keep your algorithm engagement high.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityPosts.map((post, idx) => (
              <div
                key={post.id || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{post.author}</span>
                  <span className="text-slate-400">
                    {new Date(post.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>

                {post.poll && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="text-xs font-bold text-amber-400">📊 Poll: {post.poll.question}</div>
                    {post.poll.options.map((opt: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-300">
                        <span>{opt.text}</span>
                        <span className="font-mono text-slate-400">{opt.votes}%</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <ThumbsUp className="w-3.5 h-3.5 text-red-400" />
                    <span>{post.likesCount} Likes</span>
                  </span>
                  <span className="text-emerald-400 text-[11px] font-semibold">Active Community Feed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIDEO CARDS LIST */
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <Video className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No videos found matching current filter</p>
              <button
                onClick={() => onNavigate('ai_studio')}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition-all"
              >
                Create New Video with AI Now
              </button>
            </div>
          ) : (
            filteredItems.map(video => (
              <div
                key={video.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-32 h-20 sm:w-40 sm:h-24 bg-slate-950 rounded-xl overflow-hidden shrink-0 relative border border-slate-800">
                    <img
                      src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    {video.isShort && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold uppercase">
                        Short
                      </span>
                    )}
                    {video.isLiveYouTube && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white text-[8px] font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Live on YT
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <DollarSign className="w-2.5 h-2.5" />
                        Monetized 100%
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {video.privacyStatus}
                      </span>
                      {video.isAiAssisted && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          AI Disclosure Safe
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {video.description || 'Full audio track and video composition for Dhunboy Official.'}
                    </p>

                    {/* Stats & Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{video.views.toLocaleString()} views</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-slate-400" />
                        <span>{video.likes.toLocaleString()} likes</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>{video.comments.toLocaleString()} comments</span>
                      </span>
                      {video.publishedAt && (
                        <span className="text-slate-500">
                          {new Date(video.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  {video.youtubeUrl && (
                    <a
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Watch</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleOptimize(video)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI SEO Boost</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* AI SEO & METADATA BOOST MODAL */}
      {optimizingVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  AI Algorithm Optimization
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {optimizingVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setOptimizingVideo(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                Close
              </button>
            </div>

            {optimizing ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-white">Analyzing YouTube Search Algorithms & Trending Tags...</p>
                <p className="text-xs text-slate-400">Injecting High-CPM keywords for USA, Brazil and Global audience reach.</p>
              </div>
            ) : optimizationResult ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-300 font-semibold">
                      SEO Score: {optimizationResult.seoScore}/100 • Strike Safe
                    </span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">100% Monetizable</span>
                </div>

                {/* Optimized Titles */}
                <div>
                  <h4 className="font-bold text-slate-300 mb-2 uppercase text-[11px]">Recommended High-CTR Titles</h4>
                  <div className="space-y-2">
                    {Object.entries(optimizationResult.seoTitles || {}).map(([key, val]: any) => (
                      <div
                        key={key}
                        className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-slate-200"
                      >
                        <span className="line-clamp-1">{val}</span>
                        <button
                          onClick={() => handleCopy(val, key)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optimized Description with AI Notice */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-slate-300 uppercase text-[11px]">
                      Strike-Proof Description with AI Disclosure
                    </h4>
                    <button
                      onClick={() => handleCopy(optimizationResult.generatedDescription, 'opt_desc')}
                      className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
                    >
                      {copiedKey === 'opt_desc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto text-slate-300 font-mono whitespace-pre-wrap text-[11px]">
                    {optimizationResult.generatedDescription}
                  </div>
                </div>

                {/* High-CPM Tags */}
                <div>
                  <h4 className="font-bold text-slate-300 mb-1.5 uppercase text-[11px]">High-CPM Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(optimizationResult.youtubeTags || []).map((t: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
