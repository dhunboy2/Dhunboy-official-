import { Router } from 'express';
import { db } from '../db/store.js';

const router = Router();

// GET /api/quota
router.get('/', (req, res) => {
  const quota = db.getQuota();
  res.json({ quota });
});

export default router;
