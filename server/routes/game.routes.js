// server/routes/game.routes.js
import { Router } from 'express';
import { saveGameStart, saveGameSubmit } from '../services/game.service.js';

const router = Router();

// POST /api/game/start
router.post('/start', async (req, res, next) => {
  try {
    const { nickname, sessionId, startedAt } = req.body || {};
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    const userAgent = req.get('user-agent');
    const data = await saveGameStart({ nickname, sessionId, startedAt, userAgent, ip });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});

// POST /api/game/submit
router.post('/submit', async (req, res, next) => {
  try {
    const { nickname, sessionId, selectionsByCategory, mergedByTrait, submittedAt } = req.body || {};
    if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' });
    if (!mergedByTrait) return res.status(400).json({ ok: false, error: 'mergedByTrait required' });
    const data = await saveGameSubmit({ nickname, sessionId, selectionsByCategory, mergedByTrait, submittedAt });
    res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
});


// GET /api/game/stats/element-traits
router.get('/stats/element-traits', async (req, res, next) => {
  try {
    const { getElementTraitStats } = await import('../services/game.service.js');
    const data = await getElementTraitStats();
    res.json({ ok: true, ...data });
  } catch (err) { next(err); }
});

// GET /api/game/stats/overview
router.get('/stats/overview', async (req, res, next) => {
  try {
    const { getOverviewStats } = await import('../services/game.service.js');
    const data = await getOverviewStats();
    res.json({ ok: true, ...data });
  } catch (err) { next(err); }
});


// GET /api/game/stats/progress — started vs submitted, and incomplete sessions
router.get('/stats/progress', async (req, res, next) => {
  try {
    const { getProgressStats } = await import('../services/game.service.js');
    const data = await getProgressStats();
    res.json({ ok: true, ...data });
  } catch (err) { next(err); }
});

export default router;
