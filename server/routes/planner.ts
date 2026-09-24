import { Router } from 'express';
import { db } from '../db/store.js';
import { generateContentPlanIdeas } from '../services/aiManager.js';
import { ContentPlanItem } from '../types.js';

const router = Router();

// GET /api/planner/plans
router.get('/plans', (req, res) => {
  const plans = db.getContentPlans();
  res.json({ plans });
});

// POST /api/planner/generate
router.post('/generate', async (req, res) => {
  try {
    const newPlans = await generateContentPlanIdeas();
    db.logActivity({
      action: 'Generated Content Calendar Strategy',
      endpoint: '/api/planner/generate',
      status: 'success',
      aiReasoning: 'Formulated release strategy tailored for seasonal Nepali festival and party trends.',
      initiatedBy: 'user'
    });
    res.json({ success: true, plans: db.getContentPlans() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/planner/plans
router.post('/plans', (req, res) => {
  const { topic, proposedTitle, format, hook, keywords, hashtags, suggestedUploadDate, reason } = req.body;
  if (!topic || !proposedTitle) {
    return res.status(400).json({ error: 'Topic and proposed title are required' });
  }

  const plan: ContentPlanItem = {
    id: `plan-${Date.now()}`,
    topic,
    proposedTitle,
    format: format || 'DJ Remix',
    hook: hook || '',
    keywords: keywords || [],
    hashtags: hashtags || [],
    suggestedUploadDate: suggestedUploadDate || new Date().toISOString(),
    reason: reason || 'Planned release',
    status: 'planned',
    createdAt: new Date().toISOString()
  };

  db.addContentPlan(plan);
  res.json({ success: true, plan });
});

// PUT /api/planner/plans/:id
router.put('/plans/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateContentPlan(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Content plan not found' });
  }
  res.json({ success: true, plan: updated });
});

// DELETE /api/planner/plans/:id
router.delete('/plans/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteContentPlan(id);
  res.json({ success: deleted });
});

export default router;
