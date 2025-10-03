// server/services/auth.service.js
// 비밀번호 해시 / 검증 라이브러리
import bcrypt from 'bcrypt';
// JWT 만들기 / 검증
import jwt from 'jsonwebtoken';
// node 내장 모듈. 고유 ID 생성
import crypto from 'crypto';
// 레포지토리 계층 함수 (DB접근용)
import { findUserByNickname, createUser } from '../repositories/users.repo.js';

function signToken({ user_id, nickname }) {
  return jwt.sign(
    { uid: user_id, nn: nickname },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '7d' }
  );
}

// 정책: 닉네임은 UNIQUE.
// - 존재 + 비번 일치 → 로그인
// - 존재 + 비번 불일치 → 401 오류(새 계정 만들지 않음)
// - 미존재 → 새 계정 생성 후 로그인
export async function loginOrSignup({ nickname, password }) {
  const existing = await findUserByNickname(nickname);

  if (existing) {
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) {
      const err = new Error('중복된 닉네임입니다. 다른 닉네임을 시도해주세요.');
      err.status = 401; // Unauthorized
      throw err;
    }
    const token = signToken({ user_id: existing.user_id, nickname: existing.nickname });
    return { token, user: { user_id: existing.user_id, nickname: existing.nickname } };
  }

  // 없으면 새 계정 생성
  const user_id = crypto.randomUUID();
  const password_hash = await bcrypt.hash(password, 10);
  try {
    await createUser({ user_id, nickname, password_hash });
  } catch (e) {
    // 동시성 등으로 UNIQUE 충돌 시
    if (e && (e.code === 'ER_DUP_ENTRY' || e.errno === 1062)) {
      const err = new Error('이미 사용 중인 닉네임입니다.');
      err.status = 409; // Conflict
      throw err;
    }
    throw e;
  }
  const token = signToken({ user_id, nickname });
  return { token, user: { user_id, nickname } };
}