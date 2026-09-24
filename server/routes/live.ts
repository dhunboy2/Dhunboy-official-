import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db/store.js';
import { YouTubeService } from '../services/youtube.js';
import { liveStreamManager } from '../services/liveStreamer.js';
import { AutonomousVideoGenerator } from '../services/videoGenerator.js';
import { LiveBroadcastRecord } from '../types.js';

const router = Router();

// GET /api/live
router.get('/', (req, res) => {
  const broadcasts = db.getLiveBroadcasts();
  res.json({ broadcasts });
});

// GET /api/live/stream/status - Realtime RTMP streaming monitor
router.get('/stream/status', (req, res) => {
  try {
    const status = liveStreamManager.getStatus();
    res.json({ status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/live/stream/videos - List all videos available for 1-click live streaming
router.get('/stream/videos', (req, res) => {
  try {
    const generated = AutonomousVideoGenerator.getGeneratedHistory();
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const genDir = path.join(uploadsDir, 'generated');

    const availableVideos: Array<{
      id: string;
      title: string;
      filePath: string;
      format: string;
      url: string;
      thumbnailUrl: string;
    }> = [];

    // From generated history
    for (const g of generated) {
      if (fs.existsSync(g.filePath)) {
        availableVideos.push({
          id: g.id,
          title: g.title,
          filePath: g.filePath,
          format: g.format,
          url: g.videoUrl,
          thumbnailUrl: g.thumbnailUrl
        });
      }
    }

    // From local catalog
    const catalog = db.getVideos();
    for (const c of catalog) {
      if (c.videoFilePath && fs.existsSync(c.videoFilePath) && !availableVideos.some(v => v.filePath === c.videoFilePath)) {
        availableVideos.push({
          id: c.id,
          title: c.title,
          filePath: c.videoFilePath,
          format: c.isShort ? 'short' : 'video',
          url: c.thumbnailUrl || '',
          thumbnailUrl: c.thumbnailUrl || ''
        });
      }
    }

    res.json({ videos: availableVideos });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/live/stream/start - Start streaming pre-recorded video or animated vlog to YouTube Live
router.post('/stream/start', async (req, res) => {
  const { videoFilePath, videoTitle, rtmpUrl, streamKey, loop, createYouTubeBroadcast, broadcastTitle, privacyStatus } = req.body;

  try {
    let finalPath = videoFilePath;

    // If no path given, use latest generated video or auto-generate one
    if (!finalPath || !fs.existsSync(finalPath)) {
      const generated = AutonomousVideoGenerator.getGeneratedHistory();
      if (generated.length > 0 && fs.existsSync(generated[0].filePath)) {
        finalPath = generated[0].filePath;
      } else {
        // Auto-generate an animated vlog to stream!
        const vlog = await AutonomousVideoGenerator.generateAutonomousVideo({
          artist: 'Lobish Sarma',
          format: 'animated_vlog',
          durationSeconds: 45,
          autoUpload: false
        });
        finalPath = vlog.filePath;
      }
    }

    const title = videoTitle || path.basename(finalPath, path.extname(finalPath));

    const result = await liveStreamManager.startStream({
      videoFilePath: finalPath,
      videoTitle: title,
      rtmpUrl,
      streamKey,
      loop: loop !== false,
      createYouTubeBroadcast: createYouTubeBroadcast !== false,
      broadcastTitle,
      privacyStatus
    });

    res.json(result);
  } catch (err: any) {
    console.error('[Live Stream Start] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/live/stream/stop - Stop active RTMP live stream
router.post('/stream/stop', (req, res) => {
  try {
    const result = liveStreamManager.stopStream();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/live/broadcast
router.post('/broadcast', async (req, res) => {
  const { title, description, scheduledStartTime, privacyStatus } = req.body;

  if (!title || !scheduledStartTime) {
    return res.status(400).json({ error: 'Title and scheduledStartTime are required' });
  }

  const broadcastRecord: LiveBroadcastRecord = {
    id: `live-${Date.now()}`,
    title,
    description: description || '',
    scheduledStartTime,
    privacyStatus: privacyStatus || 'unlisted',
    status: 'created',
    createdAt: new Date().toISOString()
  };

  db.addLiveBroadcast(broadcastRecord);

  // If token exists, create official YouTube Live Broadcast & Stream
  if (db.getStoredToken()) {
    try {
      const result = await YouTubeService.createLiveBroadcast({
        title,
        description: description || '',
        scheduledStartTime,
        privacyStatus: privacyStatus || 'unlisted'
      });

      db.updateLiveBroadcast(broadcastRecord.id, {
        youtubeBroadcastId: result.broadcastId,
        youtubeStreamId: result.streamId,
        rtmpIngestionAddress: result.rtmpUrl,
        streamName: result.streamKey,
        status: 'ready'
      });

      db.logActivity({
        action: 'Created YouTube Live Broadcast & Stream',
        title,
        endpoint: 'liveBroadcasts.insert',
        status: 'success',
        initiatedBy: 'user'
      });

      return res.json({
        success: true,
        broadcast: db.getLiveBroadcasts().find(b => b.id === broadcastRecord.id),
        message: 'Live broadcast created and bound to ingestion stream on YouTube.'
      });
    } catch (err: any) {
      db.updateLiveBroadcast(broadcastRecord.id, { status: 'revoked' });
      db.logActivity({
        action: 'Failed to create Live Broadcast',
        title,
        endpoint: 'liveBroadcasts.insert',
        status: 'failure',
        errorMessage: err.message,
        initiatedBy: 'user'
      });
      return res.status(400).json({ error: err.message });
    }
  }

  res.json({
    success: true,
    broadcast: broadcastRecord,
    message: 'Broadcast scheduled locally. Connect YouTube OAuth to bind RTMP ingestion keys.'
  });
});

export default router;
