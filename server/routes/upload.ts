import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db/store.js';
import { YouTubeService } from '../services/youtube.js';
import { VideoProcessor } from '../services/videoProcessor.js';
import { jobQueue } from '../services/jobQueue.js';
import { VideoRecord } from '../types.js';

const router = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

// Helper for title similarity check
function calculateTitleSimilarity(a: string, b: string): number {
  const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  if (cleanA === cleanB) return 1.0;
  const wordsA = new Set(cleanA.split(/\s+/));
  const wordsB = new Set(cleanB.split(/\s+/));
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// POST /api/upload/check-duplicate
router.post('/check-duplicate', async (req, res) => {
  const { title, fileHash } = req.body;
  const existingVideos = db.getVideos();

  let hashMatch: VideoRecord | undefined;
  if (fileHash) {
    hashMatch = existingVideos.find(v => v.fileHash === fileHash);
  }

  let highSimilarityMatch: { video: VideoRecord; similarity: number } | undefined;
  if (title) {
    for (const v of existingVideos) {
      const sim = calculateTitleSimilarity(title, v.title);
      if (sim > 0.75) {
        highSimilarityMatch = { video: v, similarity: sim };
        break;
      }
    }
  }

  const isDuplicate = !!hashMatch || (highSimilarityMatch && highSimilarityMatch.similarity > 0.85);

  res.json({
    isDuplicate,
    hashMatch: hashMatch ? { id: hashMatch.id, title: hashMatch.title } : null,
    similarityMatch: highSimilarityMatch
      ? {
          id: highSimilarityMatch.video.id,
          title: highSimilarityMatch.video.title,
          similarity: Math.round(highSimilarityMatch.similarity * 100)
        }
      : null,
    warning: isDuplicate
      ? 'Warning: Content matching this file or title has already been cataloged. To prevent accidental duplicate uploads, verify this track.'
      : null
  });
});

// POST /api/upload/file (Receives video file)
router.post('/file', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  try {
    const filePath = req.file.path;
    const fileHash = await VideoProcessor.calculateFileHash(filePath);
    let metadata: any = { duration: 0 };
    try {
      metadata = await VideoProcessor.getVideoMetadata(filePath);
    } catch (e) {
      console.warn('Metadata probe warning:', e);
    }

    res.json({
      success: true,
      filename: req.file.filename,
      filePath,
      fileHash,
      sizeBytes: req.file.size,
      metadata
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/upload/thumbnail
router.post('/thumbnail', upload.single('thumbnail'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No thumbnail file provided' });
  }

  res.json({
    success: true,
    filename: req.file.filename,
    filePath: req.file.path,
    url: `/uploads/${req.file.filename}`
  });
});

// POST /api/upload/publish
router.post('/publish', async (req, res) => {
  const {
    title,
    description,
    tags,
    categoryId,
    privacyStatus,
    isScheduled,
    scheduledTime,
    isShort,
    filePath,
    fileHash,
    artist,
    songType,
    isAiAssisted,
    aiDisclosureText,
    thumbnailPath,
    playlistId
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Duplicate guard
  const existing = db.getVideos();
  if (fileHash && existing.some(v => v.fileHash === fileHash)) {
    return res.status(409).json({
      error: 'DUPLICATE_FILE: A video with the exact identical file hash was already uploaded. Duplicate upload halted.'
    });
  }

  const videoRecord: VideoRecord = {
    id: `vid-${Date.now()}`,
    title,
    description: description || '',
    tags: Array.isArray(tags) ? tags : [],
    categoryId: categoryId || '10',
    privacyStatus: privacyStatus || 'unlisted',
    isScheduled: !!isScheduled,
    scheduledTime: isScheduled ? scheduledTime : undefined,
    isShort: !!isShort,
    videoFilePath: filePath,
    fileHash,
    artist: artist || 'Lobish Sarma',
    songType: songType || 'Nepali DJ Remix',
    isAiAssisted: !!isAiAssisted,
    aiDisclosureText,
    status: isScheduled ? 'queued' : 'uploading',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addVideo(videoRecord);

  // If immediate publish requested and token is present
  if (!isScheduled) {
    if (!filePath || !fs.existsSync(filePath)) {
      // Just record metadata draft if no physical file provided
      db.updateVideo(videoRecord.id, { status: 'draft' });
      return res.json({
        success: true,
        video: videoRecord,
        message: 'Video metadata saved as draft (no server video file attached).'
      });
    }

    try {
      // Enqueue upload job
      const job = jobQueue.enqueueJob('UPLOAD_VIDEO', `Upload: ${title}`, {
        videoId: videoRecord.id,
        title,
        description,
        tags: videoRecord.tags,
        categoryId: videoRecord.categoryId,
        privacyStatus: videoRecord.privacyStatus,
        filePath,
        isShort,
        playlistId
      });

      return res.json({
        success: true,
        video: videoRecord,
        jobId: job.id,
        message: 'Video upload enqueued for background processing.'
      });
    } catch (err: any) {
      db.updateVideo(videoRecord.id, { status: 'failed' });
      return res.status(500).json({ error: err.message });
    }
  }

  res.json({
    success: true,
    video: videoRecord,
    message: 'Video scheduled successfully.'
  });
});

export default router;
