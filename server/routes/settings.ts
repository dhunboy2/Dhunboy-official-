import { Router } from 'express';
import { db } from '../db/store.js';
import { DescriptionTemplate } from '../types.js';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
  const settings = db.getSettings();
  const credentials = db.getGoogleCredentials();
  res.json({
    settings,
    credentialsConfigured: credentials.isConfigured,
    clientId: credentials.clientId ? `${credentials.clientId.substring(0, 12)}...` : ''
  });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, settings: updated });
});

// GET /api/settings/templates
router.get('/templates', (req, res) => {
  const templates = db.getDescriptionTemplates();
  res.json({ templates });
});

// POST /api/settings/templates
router.post('/templates', (req, res) => {
  const { name, category, template, isDefault } = req.body;
  if (!name || !template) {
    return res.status(400).json({ error: 'Name and template content are required' });
  }

  const newTpl: DescriptionTemplate = {
    id: `tpl-${Date.now()}`,
    name,
    category: category || 'Custom',
    template,
    isDefault: !!isDefault
  };

  db.addDescriptionTemplate(newTpl);
  res.json({ success: true, template: newTpl });
});

// PUT /api/settings/templates/:id
router.put('/templates/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateDescriptionTemplate(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Template not found' });
  }
  res.json({ success: true, template: updated });
});

// DELETE /api/settings/templates/:id
router.delete('/templates/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteDescriptionTemplate(id);
  res.json({ success: deleted });
});

export default router;
