import { Router } from 'express';
import { db } from '../db/store.js';
import { runManagerDecisionCycle } from '../services/aiManager.js';
import { AutomationMode } from '../types.js';

const router = Router();

// GET /api/automation/settings
router.get('/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({
    mode: settings.automationMode,
    permissions: settings.permissions
  });
});

// POST /api/automation/mode
router.post('/mode', (req, res) => {
  const { mode } = req.body;
  if (!['manual', 'assisted', 'autonomous'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid automation mode' });
  }

  db.updateSettings({ automationMode: mode as AutomationMode });

  db.logActivity({
    action: `Changed AI Manager Mode to ${mode.toUpperCase()}`,
    endpoint: '/api/automation/mode',
    status: 'success',
    aiReasoning: `Operating mode updated to ${mode}. Permissions enforced according to policy.`,
    initiatedBy: 'user'
  });

  res.json({ success: true, mode });
});

// POST /api/automation/permissions
router.post('/permissions', (req, res) => {
  const { permissions } = req.body;
  if (!permissions || typeof permissions !== 'object') {
    return res.status(400).json({ error: 'Valid permissions object required' });
  }

  const updatedSettings = db.updateSettings({ permissions });

  db.logActivity({
    action: 'Updated Automation Permissions',
    endpoint: '/api/automation/permissions',
    status: 'success',
    aiReasoning: 'Fine-grained autonomous permission boundaries adjusted by creator.',
    initiatedBy: 'user'
  });

  res.json({ success: true, permissions: updatedSettings.permissions });
});

// POST /api/automation/trigger-cycle
router.post('/trigger-cycle', async (req, res) => {
  try {
    const cycleResult = await runManagerDecisionCycle();
    res.json({ success: true, cycleResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/automation/jobs
router.get('/jobs', (req, res) => {
  const jobs = db.getJobs();
  res.json({ jobs });
});

export default router;
