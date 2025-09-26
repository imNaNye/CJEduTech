

// server/routes/user.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middlewares/auth.js';
import { updateUserAvatar, findUserById, findAvatarByNickname } from '../repositories/users.repo.js';

const router = Router();

// 모든 user 라우트는 인증 필요
router.use(authRequired);

// GET /api/user/me -> 로그인 사용자 정보 조회
router.get('/me', async (req, res, next) => {
  try {
    const me = await findUserById(req.user.uid);
    if (!me) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({
      user: {
        user_id: me.user_id,
        nickname: me.nickname,
        avatar: me.avatar ?? null,
      },
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/user/avatar/:nickname -> 특정 닉네임의 아바타 조회
router.get('/avatar/:nickname', async (req, res, next) => {
  try {
    const avatar = await findAvatarByNickname(req.params.nickname);
    if (!avatar) return res.status(404).json({ message: '아바타를 찾을 수 없습니다.' });
    res.json({ nickname: req.params.nickname, avatar });
  } catch (e) {
    next(e);
  }
});

// POST /api/user/avatar -> 아바타 저장
const avatarSchema = z.object({ avatar: z.string().min(1).max(12) });
router.post('/avatar', async (req, res, next) => {
  try {
    const { avatar } = avatarSchema.parse(req.body);
    const ok = await updateUserAvatar({ user_id: req.user.uid, avatar });
    if (!ok) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json({ ok: true, avatar });
  } catch (e) {
    next(e);
  }
});

export default router;