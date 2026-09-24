import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db/store.js';
import { generateShortsBreakdown } from '../services/aiManager.js';
import { VideoProcessor } from '../services/videoProcessor.js';
import { jobQueue } from '../services/jobQueue.js';
import { ShortRecord } from '../types.js';

const router = Router();

// GET /api/shorts
router.get('/', (req, res) => {
  const shorts = db.getShorts();
  res.json({ shorts });
});

// POST /api/shorts/generate-breakdown
router.post('/generate-breakdown', async (req, res) => {
  const { videoTitle, transcriptOrDescription, genre, durationSeconds } = req.body;
  if (!videoTitle) {
    return res.status(400).json({ error: 'Video title is required' });
  }

  try {
    const breakdown = await generateShortsBreakdown({
      videoTitle,
      transcriptOrDescription,
      genre,
      durationSeconds: durationSeconds || 180
    });
    res.json({ success: true, breakdown });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/shorts/clip
router.post('/clip', async (req, res) => {
  const {
    sourceFilePath,
    startSec,
    durationSec,
    title,
    description,
    tags,
    hook,
    first3SecondsAdvice,
    captionText
  } = req.body;

  if (!sourceFilePath || !fs.existsSync(sourceFilePath)) {
    return res.status(400).json({ error: 'Valid source file path is required for video clipping.' });
  }

  const shortsDir = path.resolve(process.cwd(), 'uploads', 'shorts');
  if (!fs.existsSync(shortsDir)) {
    fs.mkdirSync(shortsDir, { recursive: true });
  }

  const outputFileName = `short-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.mp4`;
  const outputPath = path.join(shortsDir, outputFileName);

  const shortRecord: ShortRecord = {
    id: `short-${Date.now()}`,
    title: title || 'Nepali Music Short Drop',
    description: description || '',
    tags: tags || ['Shorts', 'NepaliMusic', 'DhunboyOfficial'],
    hook: hook || '',
    first3SecondsAdvice: first3SecondsAdvice || '',
    captionText: captionText || '',
    segmentStart: startSec || 0,
    segmentEnd: (startSec || 0) + (durationSec || 45),
    privacyStatus: 'unlisted',
    status: 'processing',
    createdAt: new Date().toISOString()
  };

  db.addShort(shortRecord);

  // Enqueue background processing with FFmpeg
  const job = jobQueue.enqueueJob('PROCESS_VIDEO_CLIP', `Process Short: ${shortRecord.title}`, {
    shortId: shortRecord.id,
    inputPath: sourceFilePath,
    outputPath,
    startSec: startSec || 0,
    durationSec: durationSec || 45
  });

  res.json({
    success: true,
    short: shortRecord,
    jobId: job.id,
    message: 'Short clipping and 9:16 vertical formatting job started.'
  });
});

// POST /api/shorts/upload
router.post('/upload', async (req, res) => {
  const { shortId } = req.body;
  const short = db.getShorts().find(s => s.id === shortId);

  if (!short) {
    return res.status(404).json({ error: 'Short record not found' });
  }

  if (!short.videoPath || !fs.existsSync(short.videoPath)) {
    return res.status(400).json({ error: 'Short video file has not been processed or is missing.' });
  }

  const job = jobQueue.enqueueJob('UPLOAD_SHORT', `Upload Short: ${short.title}`, {
    shortId: short.id,
    title: short.title,
    description: short.description,
    tags: short.tags,
    privacyStatus: short.privacyStatus,
    filePath: short.videoPath
  });

  db.updateShort(short.id, { status: 'processing' });

  res.json({
    success: true,
    jobId: job.id,
    message: 'Short upload job dispatched to background queue.'
  });
});

export default router;
