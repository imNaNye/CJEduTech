// server/repositories/users.repo.js
import { pool } from '../db.js';

/** 닉네임으로 유저 아바타 조회 */
export async function findAvatarByNickname(nickname) {
  const [rows] = await pool.query(
    'SELECT avatar FROM users WHERE nickname = ? LIMIT 1',
    [nickname]
  );
  return rows[0]?.avatar ?? null;
}


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

/** 사용자 ID로 찾기 */
export async function findUserById(user_id) {
  const [rows] = await pool.query(
    'SELECT user_id, nickname, password_hash, avatar FROM users WHERE user_id = ? LIMIT 1',
    [user_id]
  );
  return rows[0] || null;
}

/** 아바타 번호 업데이트 */
export async function updateUserAvatar({ user_id, avatar }) {
  const [result] = await pool.query(
    'UPDATE users SET avatar = ? WHERE user_id = ?',
    [avatar, user_id]
  );
  return result.affectedRows === 1;
}