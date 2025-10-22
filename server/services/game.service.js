// server/services/game.service.js
// Service layer for storing game start and submission events
// Uses MySQL pool when available; falls back to in-memory store for local dev.

import pool from '../index.js';

const memoryDB = {
  sessions: [],
  submissions: [],
};
let usingMemory = false;

async function ensureTables() {
  if (usingMemory) return;
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          session_id VARCHAR(64) NOT NULL,
          nickname VARCHAR(80) NOT NULL,
          started_at BIGINT NOT NULL,
          user_agent VARCHAR(255) NULL,
          ip VARCHAR(64) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_session (session_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS game_submissions (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          session_id VARCHAR(64) NOT NULL,
          nickname VARCHAR(80) NOT NULL,
          submitted_at BIGINT NOT NULL,
          selections_json JSON NOT NULL,
          merged_json JSON NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          KEY idx_session (session_id),
          KEY idx_nickname (nickname)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } finally {
      conn.release();
    }
  } catch (err) {
    console.warn("[GameService] No MySQL connection detected, using in-memory fallback.");
    usingMemory = true;
  }
}

export async function saveGameStart({ nickname, sessionId, startedAt, userAgent, ip }) {
  if (!sessionId) throw new Error("sessionId required");
  await ensureTables();

  if (usingMemory) {
    const existing = memoryDB.sessions.find(s => s.session_id === sessionId);
    if (existing) {
      Object.assign(existing, { nickname, started_at: startedAt, user_agent: userAgent, ip });
    } else {
      memoryDB.sessions.push({
        session_id: sessionId,
        nickname: nickname || "게스트",
        started_at: Number(startedAt) || Date.now(),
        user_agent: userAgent || null,
        ip: ip || null,
        created_at: new Date().toISOString(),
      });
    }
    return { ok: true, memory: true };
  }

  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO game_sessions (session_id, nickname, started_at, user_agent, ip)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nickname = VALUES(nickname),
         started_at = VALUES(started_at),
         user_agent = VALUES(user_agent),
         ip = VALUES(ip)`,
      [sessionId, nickname || "게스트", Number(startedAt) || Date.now(), userAgent || null, ip || null]
    );
  } finally {
    conn.release();
  }
  return { ok: true };
}

export async function saveGameSubmit({ nickname, sessionId, selectionsByCategory, mergedByTrait, submittedAt }) {
  if (!sessionId) throw new Error("sessionId required");
  if (!mergedByTrait) throw new Error("mergedByTrait required");
  await ensureTables();

  if (usingMemory) {
    memoryDB.submissions.push({
      session_id: sessionId,
      nickname: nickname || "게스트",
      submitted_at: Number(submittedAt) || Date.now(),
      selections_json: selectionsByCategory || {},
      merged_json: mergedByTrait || {},
      created_at: new Date().toISOString(),
    });
    return { ok: true, memory: true };
  }

  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO game_submissions (session_id, nickname, submitted_at, selections_json, merged_json)
       VALUES (?, ?, ?, CAST(? AS JSON), CAST(? AS JSON))`,
      [
        sessionId,
        nickname || "게스트",
        Number(submittedAt) || Date.now(),
        JSON.stringify(selectionsByCategory || {}),
        JSON.stringify(mergedByTrait || {}),
      ]
    );
  } finally {
    conn.release();
  }
  return { ok: true };
}

// Export memory DB for debugging in dev mode
export function _getMemoryDB() {
  return memoryDB;
}

// ---------------- Stats helpers ----------------
async function _fetchAllSubmissionsRaw() {
  await ensureTables();
  if (usingMemory) {
    return memoryDB.submissions.map(s => ({
      nickname: s.nickname,
      selections_json: s.selections_json || {},
      merged_json: s.merged_json || {},
      created_at: s.created_at,
    }));
  }
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      `SELECT nickname, selections_json, merged_json, created_at FROM game_submissions`
    );
    return rows.map(r => ({
      nickname: r.nickname,
      selections_json: (typeof r.selections_json === 'string') ? JSON.parse(r.selections_json || '{}') : r.selections_json || {},
      merged_json: (typeof r.merged_json === 'string') ? JSON.parse(r.merged_json || '{}') : r.merged_json || {},
      created_at: r.created_at,
    }));
  } finally {
    conn.release();
  }
}

/**
 * Build per-element per-trait stats with user lists.
 * Result shape:
 * {
 *   items: [
 *     { id: '정직함', category: 'personal', counts: {integrity:2, passion:0, creativity:1, respect:0}, users: {integrity:['홍길동'], ...} }
 *   ],
 *   totals: { submissions: N, users: M }
 * }
 */
export async function getElementTraitStats() {
  const subs = await _fetchAllSubmissionsRaw();
  const usersSet = new Set(subs.map(s => s.nickname));
  const byItem = new Map(); // id -> { id, category, counts, users }

  const traitKeys = ['integrity','passion','creativity','respect'];
  const ensureRow = (id, category) => {
    if (!byItem.has(id)) {
      const counts = Object.fromEntries(traitKeys.map(k => [k, 0]));
      const users = Object.fromEntries(traitKeys.map(k => [k, new Set()]));
      byItem.set(id, { id, category: category || null, counts, users });
    }
    return byItem.get(id);
  };

  // Traverse each submission selections_json
  subs.forEach(({ nickname, selections_json }) => {
    if (!selections_json || typeof selections_json !== 'object') return;
    Object.entries(selections_json).forEach(([categoryKey, traitObj]) => {
      if (!traitObj || typeof traitObj !== 'object') return;
      traitKeys.forEach(traitKey => {
        const arr = traitObj[traitKey] || [];
        if (!Array.isArray(arr)) return;
        arr.forEach((itemId) => {
          const row = ensureRow(itemId, categoryKey);
          row.counts[traitKey] += 1;
          row.users[traitKey].add(nickname || '게스트');
        });
      });
    });
  });

  // finalize sets to arrays and sorting
  const items = Array.from(byItem.values()).map(r => ({
    id: r.id,
    category: r.category,
    counts: r.counts,
    users: Object.fromEntries(
      Object.entries(r.users).map(([k, set]) => [k, Array.isArray(set) ? set : Array.from(set || [])])
    ),
  }));

  // sort items by total assignments desc
  items.sort((a,b) => {
    const sa = Object.values(a.counts).reduce((p,c)=>p+c,0);
    const sb = Object.values(b.counts).reduce((p,c)=>p+c,0);
    return sb - sa;
  });

  return {
    items,
    totals: { submissions: subs.length, users: usersSet.size }
  };
}

/** Basic overview */
export async function getOverviewStats() {
  const subs = await _fetchAllSubmissionsRaw();
  const usersSet = new Set(subs.map(s => s.nickname));
  return { submissions: subs.length, users: usersSet.size };
}

// Progress stats: started vs submitted vs incomplete
export async function getProgressStats() {
  await ensureTables();
  if (usingMemory) {
    const sessions = memoryDB.sessions.map(s => ({
      session_id: s.session_id,
      nickname: s.nickname,
      started_at: s.started_at,
      created_at: s.created_at,
    }));
    const submissions = memoryDB.submissions.map(s => ({
      session_id: s.session_id,
      nickname: s.nickname,
      submitted_at: s.submitted_at,
      created_at: s.created_at,
    }));
    const submittedIds = new Set(submissions.map(x => x.session_id));
    const incompletes = sessions.filter(s => !submittedIds.has(s.session_id));
    return { sessions, submissions, incompletes };
  }
  const conn = await pool.getConnection();
  try {
    const [sessRows] = await conn.query(
      `SELECT session_id, nickname, started_at, created_at FROM game_sessions`
    );
    const [subRows] = await conn.query(
      `SELECT session_id, nickname, submitted_at, created_at FROM game_submissions`
    );
    const sessions = sessRows.map(r => ({
      session_id: r.session_id,
      nickname: r.nickname,
      started_at: Number(r.started_at) || null,
      created_at: r.created_at,
    }));
    const submissions = subRows.map(r => ({
      session_id: r.session_id,
      nickname: r.nickname,
      submitted_at: Number(r.submitted_at) || null,
      created_at: r.created_at,
    }));
    const submittedIds = new Set(submissions.map(x => x.session_id));
    const incompletes = sessions.filter(s => !submittedIds.has(s.session_id));
    return { sessions, submissions, incompletes };
  } finally {
    conn.release();
  }
}

export async function resetAllGameData() {
  await ensureTables();
  if (usingMemory) {
    memoryDB.sessions = [];
    memoryDB.submissions = [];
    return { ok: true, memory: true };
  }
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM game_sessions');
    await conn.query('DELETE FROM game_submissions');
  } finally {
    conn.release();
  }
  return { ok: true };
}
