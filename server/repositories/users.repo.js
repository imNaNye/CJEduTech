// server/repositories/users.repo.js
import { pool } from '../db.js';

export async function findUserByNickname(nickname) {
  const [rows] = await pool.query(
    'SELECT user_id, nickname, password_hash FROM users WHERE nickname = ? LIMIT 1',
    [nickname]
  );
  return rows[0] || null;
}

/** 새 유저 생성 */
export async function createUser({ user_id, nickname, password_hash }) {
  await pool.query(
    'INSERT INTO users (user_id, nickname, password_hash) VALUES (?, ?, ?)',
    [user_id, nickname, password_hash]
  );
  // INSERT 후 호출처에서 바로 쓰기 좋게 최소 정보 반환
  return { user_id, nickname };
}