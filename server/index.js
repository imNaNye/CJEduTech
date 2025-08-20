// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import cookieParser from "cookie-parser";
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middlewares/error.js';

dotenv.config();

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

// MySQL 커넥션 풀
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306, // ← 포트 옵션 추가
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

export default pool;

// 헬스체크
app.get('/health', (req, res) => res.json({ ok: true }));

//로그인 api
app.use('/api/auth', authRoutes);

//에러 핸들러 (마지막에))
app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => console.log('API UP'));

