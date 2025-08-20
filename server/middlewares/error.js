// server/middlewares/error.js
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  // Zod 입력 검증 오류 → 400
  const isZod = err instanceof ZodError;

  // 잘못된 JSON 바디 파싱 오류 감지 (express.json())
  const isBadJson = err instanceof SyntaxError && 'body' in err;

  const status = err.status || (isZod || isBadJson ? 400 : 500);

  // 로그는 서버 콘솔에 상세히 남김
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // 사용자에게 보여줄 메시지 정리
  let message = 'Internal Server Error';
  let errorName = err.name || 'Error';

  if (isZod) {
    errorName = 'ValidationError';
    message = err.errors?.map(e => e.message).join(', ') || 'Invalid request';
  } else if (isBadJson) {
    errorName = 'BadJson';
    message = 'Malformed JSON in request body';
  } else if (err.message) {
    message = err.message;
  }

  const payload = { error: errorName, message };

  // 개발 환경에서만 stack 포함
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}