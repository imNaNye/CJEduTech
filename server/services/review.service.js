// server/services/review.service.js
import { getRoomSnapshot } from './socket.service.js';
import { listRoomArchives } from './socket.service.js';

const AI_BASE = process.env.AI_SERVER_BASE || process.env.AI_BASE || 'http://localhost:8000';

// in-memory cache: roomId -> { summaryText, createdAt, payload }
const overallSummaryCache = new Map();
// in-memory cache: `${baseRoomId}|${nickname}` -> final result blob
const finalResultCache = new Map();

function toBaseRoomId(roomId){
  // strip optional __r{n}
  const m = /^(.+?)__r(\d+)$/.exec(String(roomId||''));
  return m ? m[1] : String(roomId||'');
}
// Aggregate archives for a base room and compute final result
export async function generateFinalResult(roomId, nickname, opts = {}){
  if (!roomId) throw new Error('roomId_required');
  const baseId = toBaseRoomId(roomId);
  const key = `${baseId}|${nickname||''}`;
  const force = !!opts.force;
  if (!force && finalResultCache.has(key)){
    const cached = finalResultCache.get(key);
    return { roomId: baseId, nickname, cached: true, ...cached };
  }

  // 1) Load all round archives for the base room
  const rounds = await listRoomArchives(baseId);
  if (!rounds.length){
    const empty = {
      createdAt: new Date().toISOString(),
      sections: {
        overall: { rank: null, score: null, totalMessages: 0, totalReactions: 0 },
        aiSummary: null,
        personaIntegrated: { counts: { '정직':0,'창의':0,'존중':0,'열정':0 }, percentages: { '정직':0,'창의':0,'존중':0,'열정':0 } },
        personaByRound: [],
        participationByRound: [],
        top3Statements: []
      }
    };
    finalResultCache.set(key, empty);
    return { roomId: baseId, nickname, cached:false, ...empty };
  }

  // 2) Aggregate across rounds
  const perUser = {};
  const personaByRound = []; // [{ round_number, labels:{...} }]
  const participationByRound = []; // [{ round_number, totalMessages, totalReactions, myMessages, myReactions }]
  const allMessages = [];
  const integratedLabels = { '정직':0,'창의':0,'존중':0,'열정':0 };

  for (const a of rounds){
    const rno = (typeof a.round_number === 'number') ? a.round_number : undefined;
    const labelsAgg = { '정직':0,'창의':0,'존중':0,'열정':0 };
    const msgs = Array.isArray(a.messages) ? a.messages : [];
    let totalReactions = 0, myMsgs = 0, myReacts = 0;

    // per-user merge + per-round aggregates
    for (const [nick, u] of Object.entries(a.perUser || {})){
      if (!perUser[nick]) perUser[nick] = { nickname:nick, totalMessages:0, totalReactions:0, labels:{ '정직':0,'창의':0,'존중':0,'열정':0 } };
      perUser[nick].totalMessages += (u.totalMessages||0);
      perUser[nick].totalReactions += (u.totalReactions||0);
      for (const k of Object.keys(perUser[nick].labels)){
        const v = u.labels?.[k]||0;
        perUser[nick].labels[k] += v;
        labelsAgg[k] += v;
        integratedLabels[k] += v;
      }
    }

    for (const m of msgs){
      totalReactions += (m.reactionsCount||0);
      if ((nickname||'') && m.nickname === nickname){
        myMsgs += 1; myReacts += (m.reactionsCount||0);
      }
      // for AI only my messages (we'll filter below)
      allMessages.push(m);
    }

    personaByRound.push({ round_number: rno, labels: labelsAgg });
    participationByRound.push({ round_number: rno, totalMessages: msgs.length, totalReactions: totalReactions, myMessages: myMsgs, myReactions: myReacts });
  }

  // 3) Ranking recompute (overall)
  const calcScore = (u) => (u.totalReactions||0)*3 + (Object.values(u.labels||{}).reduce((a,b)=>a+(b||0),0))*1 + (u.totalMessages||0)*0.5;
  const ranking = Object.values(perUser).map(u=>({ nickname:u.nickname, totalMessages:u.totalMessages, totalReactions:u.totalReactions, labels:u.labels, score:calcScore(u) }))
    .sort((a,b)=> b.score-a.score);
  let rank=1,last=null,same=0; for (const r of ranking){ if(last===null){rank=1;same=1;last=r.score;} else if(r.score===last){same++;} else {rank+=same;same=1;last=r.score;} r.rank=rank; }
  const meRow = ranking.find(x=>x.nickname===nickname);
  const overall = {
    rank: meRow?.rank ?? null,
    score: meRow?.score ?? null,
    totalMessages: perUser[nickname]?.totalMessages || 0,
    totalReactions: perUser[nickname]?.totalReactions || 0,
  };

  // 4) Persona integrated percentages
  const totalLabelSum = Object.values(integratedLabels).reduce((a,b)=>a+(b||0),0) || 1;
  const personaIntegrated = {
    counts: integratedLabels,
    percentages: Object.fromEntries(Object.entries(integratedLabels).map(([k,v])=>[k, Math.round((v/totalLabelSum)*1000)/10])) // 0.1% 단위 반올림
  };

  // 5) AI summary with only my messages
  let aiSummary = null;
  try {
    const myMsgs = allMessages.filter(m => (nickname||'') && m.nickname === nickname).map(m => ({ text: m.text || '' }));
    if (myMsgs.length){
      const url = `${AI_BASE.replace(/\/$/, '')}/evaluate`;
      const payload = { user_id: nickname || 'me', messages: myMsgs, task: 'summarize' };
      const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok){ const data = await res.json().catch(()=>({})); aiSummary = data?.personalized_feedback || data?.result || data?.text || null; }
    }
  } catch {}

  // 6) Top3 statements: only my statements (highest reactions)
  const top3Base = allMessages
    .filter(m => (m?.text||'').trim().length > 0 && (!!nickname && m.nickname === nickname));
  const top3Statements = top3Base
    .sort((a,b)=> (b.reactionsCount||0) - (a.reactionsCount||0))
    .slice(0,3)
    .map(m => ({
      text: m.text,
      reactionsCount: m.reactionsCount || 0,
      createdAt: m.createdAt,
      round_number: m.round_number
    }));

  // 7) Build final sections object tailored for FinalResultPage
  const sections = {
    overall,
    aiSummary,
    personaIntegrated,
    personaByRound,
    participationByRound,
    top3Statements,
    ranking // keep full ranking for other widgets if needed
  };

  const result = { createdAt: new Date().toISOString(), sections };
  finalResultCache.set(key, result);
  return { roomId: baseId, nickname, cached:false, ...result };
}

export function getFinalResult(roomId, nickname){
  if (!roomId) throw new Error('roomId_required');
  const baseId = toBaseRoomId(roomId);
  const key = `${baseId}|${nickname||''}`;
  const v = finalResultCache.get(key);
  return v ? { roomId: baseId, nickname, ...v } : null;
}

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