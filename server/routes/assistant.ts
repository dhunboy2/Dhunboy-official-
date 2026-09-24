import express from 'express';
import { processAssistantCommand } from '../services/aiAssistant.js';
import { db } from '../db/store.js';
import { YouTubeService } from '../services/youtube.js';
import { jobQueue } from '../services/jobQueue.js';

const router = express.Router();

// POST /api/assistant/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await processAssistantCommand(message, history || []);
    res.json(result);
  } catch (err: any) {
    console.error('Error processing assistant command:', err);
    res.status(500).json({
      error: 'Failed to process command',
      details: err.message
    });
  }
});

// GET /api/assistant/status
router.get('/status', (req, res) => {
  const settings = db.getSettings();
  const channel = db.getChannel();
  const token = db.getStoredToken();
  const jobs = db.getJobs();
  const pendingJobs = jobs.filter(j => j.status === 'PENDING' || j.status === 'RUNNING');

  res.json({
    assistantName: 'Aura',
    title: 'Dhunboy AI Executive Co-Producer',
    channelConnected: !!token,
    channelName: channel?.title || 'Dhunboy Official',
    channelId: channel?.id || null,
    automationMode: settings.automationMode,
    isAutonomous: settings.automationMode === 'autonomous',
    backgroundWorkerActive: true,
    pendingJobsCount: pendingJobs.length,
    activeTasks: pendingJobs.map(j => ({ id: j.id, title: j.title, status: j.status })),
    timestamp: new Date().toISOString()
  });
});

// POST /api/assistant/trigger-cycle
router.post('/trigger-cycle', async (req, res) => {
  try {
    const channel = db.getChannel();
    const token = db.getStoredToken();
    let syncResult = null;

    if (token) {
      syncResult = await YouTubeService.syncChannelProfile().catch(e => ({ error: e.message }));
    }

    db.logActivity({
      action: 'Manual Autonomous Cycle Triggered',
      title: 'AI Executive Synchronized System',
      endpoint: '/api/assistant/trigger-cycle',
      status: 'success',
      initiatedBy: 'ai_autonomous'
    });

    res.json({
      success: true,
      message: 'Autonomous background cycle triggered successfully.',
      syncResult
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
