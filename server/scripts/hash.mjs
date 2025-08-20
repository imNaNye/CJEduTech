// server/scripts/hash.mjs
import bcrypt from 'bcrypt';

const pwd = process.argv[2] ?? '비밀번호예시';
const hash = await bcrypt.hash(pwd, 10);
console.log(hash);