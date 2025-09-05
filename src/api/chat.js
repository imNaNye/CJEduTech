import { io } from "socket.io-client";
const API = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
// 서버 주소에 맞게 수정
export const socket = io(SOCKET_URL+"/chat", {
  transports: ["websocket"],
  withCredentials: true,
});