import { Router } from 'express';
import { db } from '../db/store.js';
import { YouTubeService } from '../services/youtube.js';
import { analyzeChannelHealthAndAnalytics } from '../services/aiManager.js';

const router = Router();

// GET /api/channel/info
router.get('/info', (req, res) => {
  const channel = db.getChannel();
  res.json({ channel });
});

// POST /api/channel/sync
router.post('/sync', async (req, res) => {
  try {
    const channel = await YouTubeService.syncChannelProfile();
    const liveVideos = await YouTubeService.fetchChannelVideos().catch(() => []);
    const analytics = db.getAnalytics('28d');
    const health = await analyzeChannelHealthAndAnalytics(channel, liveVideos, analytics);

    res.json({
      success: true,
      channel,
      health,
      videoCount: liveVideos.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channel/videos
router.get('/videos', async (req, res) => {
  try {
    const localVideos = db.getVideos();
    let youtubeVideos: any[] = [];

    // Attempt live fetch if token is available
    if (db.getStoredToken()) {
      try {
        youtubeVideos = await YouTubeService.fetchChannelVideos(30);
      } catch (e: any) {
        console.warn('Live YouTube video fetch skipped or failed:', e.message);
      }
    }

    res.json({
      localVideos,
      youtubeVideos
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channel/playlists
router.get('/playlists', async (req, res) => {
  try {
    const localPlaylists = db.getPlaylists();
    let remotePlaylists: any[] = [];

    if (db.getStoredToken()) {
      try {
        remotePlaylists = await YouTubeService.fetchPlaylists();
      } catch (e: any) {
        console.warn('Remote playlists fetch skipped:', e.message);
      }
    }

    res.json({
      localPlaylists,
      remotePlaylists
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/channel/playlists
router.post('/playlists', async (req, res) => {
  const { title, description, privacy } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Playlist title is required' });
  }

  try {
    let youtubePlaylistId = '';
    if (db.getStoredToken()) {
      const created = await YouTubeService.createPlaylist(title, description || '', privacy || 'public');
      youtubePlaylistId = created.id;
    }

    const pl = {
      id: `pl-${Date.now()}`,
      youtubePlaylistId,
      title,
      description: description || '',
      privacyStatus: privacy || 'public',
      itemCount: 0,
      createdAt: new Date().toISOString()
    };

    db.addPlaylist(pl);
    res.json({ success: true, playlist: pl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channel/analytics
router.get('/analytics', (req, res) => {
  const period = (req.query.period as '7d' | '28d' | '90d') || '28d';
  const analytics = db.getAnalytics(period);
  const health = db.getChannelHealth();
  res.json({ analytics, health });
});

// GET /api/channel/health
router.get('/health', async (req, res) => {
  let health = db.getChannelHealth();
  if (!health) {
    const channel = db.getChannel();
    const videos = db.getVideos();
    const analytics = db.getAnalytics('28d');
    health = await analyzeChannelHealthAndAnalytics(channel, videos, analytics);
  }
  res.json({ health });
});

export default router;
