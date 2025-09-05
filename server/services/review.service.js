// server/services/review.service.js
import { getRoomSnapshot } from './socket.service.js';

const AI_BASE = process.env.AI_SERVER_BASE || process.env.AI_BASE || 'http://localhost:8000';

// in-memory cache: roomId -> { summaryText, createdAt, payload }
const overallSummaryCache = new Map();

export function getOverallSummary(roomId) {
  if (!roomId) throw new Error('roomId_required');
  const v = overallSummaryCache.get(roomId);
  return v ? { roomId, ...v } : null;
}

export async function generateOverallSummary(roomId, opts = {}) {
  const force = !!opts.force;
  if (!roomId) throw new Error('roomId_required');

  if (!force && overallSummaryCache.has(roomId)) {
    const cached = overallSummaryCache.get(roomId);
    return { roomId, cached: true, ...cached };
  }

  const snap = getRoomSnapshot(roomId);
  const messages = Array.isArray(snap?.messages) ? snap.messages : [];
  const topic = snap?.context?.topic || '';
  const duration = snap?.context?.duration;
  const round_number = snap?.context?.round_number;

  const all_user_messages = messages.map(m => ({ user_id: m.nickname || m.userId || '익명', text: m.text || m.message || '' }));
  const discussion_context = {};
  if (topic) discussion_context.topic = topic;
  if (typeof duration !== 'undefined') discussion_context.duration = duration;
  if (typeof round_number !== 'undefined') discussion_context.round_number = round_number;

  const payload = { user_id: 'system', all_user_messages, discussion_context };

  const url = `${AI_BASE.replace(/\/$/, '')}/discussion-overall`;
  console.log(payload)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`ai_request_failed: ${res.status}`);
    err.details = body;
    throw err;
  }
  const data = await res.json().catch(() => ({}));

  // AI 서버가 { summary: "..."} 형태를 준다고 가정, 없으면 백업
  const summaryText = data?.discussion_summary || data?.summary || data?.result || data?.text || JSON.stringify(data);
  const result = { summaryText, createdAt: new Date().toISOString(), payload };
  overallSummaryCache.set(roomId, result);
  return { roomId, cached: false, ...result };
}