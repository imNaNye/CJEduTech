// server/routes/review.routes.js
import { Router } from 'express';
import { generateOverallSummary, getOverallSummary } from '../services/review.service.js';

const router = Router();

// POST /api/chat/:roomId/overall-summary  (generate once; returns cached if exists)
router.post('/:roomId/overall-summary', async (req, res) => {
  try {
    const { roomId } = req.params;
    const force = String(req.query?.force || '').toLowerCase() === 'true';
    const result = await generateOverallSummary(roomId, { force });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: 'overall_summary_failed', message: e?.message });
  }
});

// GET /api/chat/:roomId/overall-summary  (return if generated)
router.get('/:roomId/overall-summary', (req, res) => {
  try {
    const { roomId } = req.params;
    const v = getOverallSummary(roomId);
    if (!v) return res.status(404).json({ error: 'not_found' });
    return res.json(v);
  } catch (e) {
    return res.status(500).json({ error: 'overall_summary_failed', message: e?.message });
  }
});

export default router;