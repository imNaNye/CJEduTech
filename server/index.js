// server/index.js
// (Node 18+에서는 글로벌 fetch 존재. 필요한 경우 node-fetch를 설치해 import 하세요.)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import cookieParser from "cookie-parser";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chatRouter from './routes/socket.routes.js';
import { errorHandler } from './middlewares/error.js';
import { randomUUID } from "crypto";
import { initChatSocket } from './services/socket.service.js';

dotenv.config();

const app = express();
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

// HTTP 서버 및 Socket.IO 설정
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

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

//유저 관련 api
app.use('/api/user', userRoutes);

// chat overview route
app.use('/api/chat', chatRouter);

// Initialize chat socket namespace/handlers from service
initChatSocket(io);

//에러 핸들러 (마지막에))
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
httpServer.listen(PORT, () => console.log(`API + Socket.IO UP http://localhost:${PORT}`));
