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
