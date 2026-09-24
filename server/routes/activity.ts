import { Router } from 'express';
import { db } from '../db/store.js';

const router = Router();

// GET /api/activity/logs
router.get('/logs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const logs = db.getActivityLogs(limit);
  res.json({ logs });
});

// GET /api/activity/notifications
router.get('/notifications', (req, res) => {
  const notifications = db.getNotifications();
  res.json({ notifications });
});

// POST /api/activity/notifications/read-all
router.post('/notifications/read-all', (req, res) => {
  db.markAllNotificationsAsRead();
  res.json({ success: true });
});

// POST /api/activity/notifications/:id/read
router.post('/notifications/:id/read', (req, res) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

export default router;
