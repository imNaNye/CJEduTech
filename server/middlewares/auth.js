// server/middlewares/auth.js
import jwt from 'jsonwebtoken';

export function authRequired(req, res, next) {
  const raw = req.cookies?.token || req.get('Authorization')?.replace('Bearer ', '');
  if (!raw) return res.status(401).json({ error: '인증이 필요합니다.' });

  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '토큰이 유효하지 않습니다.' });
  }
}