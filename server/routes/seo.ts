import { Router } from 'express';
import { db } from '../db/store.js';
import { generateTitles, generateSEOMetadata, analyzeContentMetadata } from '../services/aiManager.js';

const router = Router();

// GET /api/seo/records
router.get('/records', (req, res) => {
  const records = db.getSEORecords();
  res.json({ records });
});

// POST /api/seo/generate-titles
router.post('/generate-titles', async (req, res) => {
  const { songTitle, artist, genre, isRemix } = req.body;
  if (!songTitle) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  try {
    const titles = await generateTitles({ songTitle, artist, genre, isRemix });
    res.json({ success: true, titles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seo/analyze
router.post('/analyze', async (req, res) => {
  const { songTitle, artist, genre, language, targetAudience, isAiAssisted } = req.body;
  if (!songTitle) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  try {
    const seoRecord = await generateSEOMetadata({
      songTitle,
      artist,
      genre,
      language,
      targetAudience,
      isAiAssisted
    });

    db.logActivity({
      action: `Generated SEO Record for "${songTitle}"`,
      title: songTitle,
      endpoint: '/api/seo/analyze',
      status: 'success',
      aiReasoning: `SEO score calculated at ${seoRecord.seoScore}/100. ${seoRecord.scoreBreakdown.notes?.[0] || ''}`,
      initiatedBy: 'user'
    });

    res.json({ success: true, seoRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seo/analyze-content
router.post('/analyze-content', async (req, res) => {
  const { title, artist, genre, language, notes, isAiAssisted } = req.body;
  try {
    const analysis = await analyzeContentMetadata({
      title,
      artist,
      genre,
      language,
      notes,
      isAiAssisted
    });
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
