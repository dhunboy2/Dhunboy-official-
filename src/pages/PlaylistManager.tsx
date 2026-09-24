import React, { useState, useEffect } from 'react';
import {
  ListMusic,
  Plus,
  Sparkles,
  ExternalLink,
  RefreshCw,
  FolderPlus,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { api } from '../api';
import { PlaylistRecord } from '../types';

export const PlaylistManager: React.FC = () => {
  const [localPlaylists, setLocalPlaylists] = useState<PlaylistRecord[]>([]);
  const [remotePlaylists, setRemotePlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create playlist form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [creating, setCreating] = useState(false);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const res = await api.getPlaylists();
      setLocalPlaylists(res.localPlaylists);
      setRemotePlaylists(res.remotePlaylists);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('Playlist title is required');
      return;
    }

    try {
      setCreating(true);
      await api.createPlaylist(title, description, privacy);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      await loadPlaylists();
    } catch (err: any) {
      alert(`Create playlist failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleQuickAdd = (suggestedTitle: string, desc: string) => {
    setTitle(suggestedTitle);
    setDescription(desc);
    setShowCreateModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
            <ListMusic className="w-6 h-6 text-red-500" />
            <span>Playlist Manager & Content Architecture</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Group music releases into thematic collections for algorithmic search clustering and session watch-time boost.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Recommended Strategy Playlists */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Strategic Channel Curations for Dhunboy Official</span>
        </div>
        <p className="text-xs text-slate-400">
          Click any preset to create official playlists optimized for search intent and repeat party playback:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {[
            {
              title: 'Nepali DJ Remix Club Bass',
              desc: 'High-energy Nepali DJ remixes and dance anthems curated by Lobish Sarma on Dhunboy Official.'
            },
            {
              title: 'New Nepali Songs 2026',
              desc: 'Latest releases, singles, and music videos from Dhunboy Official.'
            },
            {
              title: 'Nepali Lok Dohori Fusion',
              desc: 'Traditional folk melodies reimagined with modern beats and authentic instruments.'
            },
            {
              title: 'Teej & Festival Specials',
              desc: 'Festive Nepali celebration tracks for Teej, Dashain, Tihar, and party seasons.'
            },
            {
              title: 'Lobish Sarma Originals',
              desc: 'Complete catalog of original productions and tracks by creator Lobish Sarma.'
            },
            {
              title: 'Dhunboy Shorts Highlights',
              desc: '30-45s vertical beat drops and behind-the-scenes music production clips.'
            }
          ].map((preset, i) => (
            <div
              key={i}
              onClick={() => handleQuickAdd(preset.title, preset.desc)}
              className="p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <h4 className="font-bold text-white text-xs group-hover:text-red-400 transition-colors">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{preset.desc}</p>
              </div>
              <span className="text-[10px] text-indigo-400 font-semibold mt-2.5 flex items-center gap-1">
                <FolderPlus className="w-3 h-3" />
                <span>Create Playlist</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Playlists Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white">Active Channel Playlists</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {localPlaylists.length === 0 ? (
            <p className="col-span-full text-xs text-slate-500 py-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              No playlists created yet. Use the presets above to bootstrap your channel curation.
            </p>
          ) : (
            localPlaylists.map(pl => (
              <div
                key={pl.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      {pl.privacyStatus === 'public' ? (
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="capitalize">{pl.privacyStatus}</span>
                    </span>
                    <span className="font-mono text-[11px]">{pl.itemCount} videos</span>
                  </div>

                  <h3 className="font-bold text-white text-sm mt-2">{pl.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pl.description || 'No description'}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    Created {new Date(pl.createdAt).toLocaleDateString()}
                  </span>
                  {pl.youtubePlaylistId && (
                    <a
                      href={`https://www.youtube.com/playlist?list=${pl.youtubePlaylistId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Open on YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white">Create New YouTube Playlist</h2>

            <form onSubmit={handleCreatePlaylist} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Playlist Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Privacy</label>
                <select
                  value={privacy}
                  onChange={e => setPrivacy(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-red-500"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  {creating ? 'Creating on YouTube...' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
