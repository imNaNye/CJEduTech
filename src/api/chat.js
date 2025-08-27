import { io } from "socket.io-client";

// 서버 주소에 맞게 수정
export const socket = io("http://localhost:3000/chat", {
  transports: ["websocket"]
});
