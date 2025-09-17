import { useEffect, useRef, useState } from "react";
import { socket } from "@/api/chat";

const TOTAL_SECONDS_FALLBACK = 24 * 60; // 24분 (서버 미응답시 초기 표기)

export default function ChatTimer(){
  const [remaining, setRemaining] = useState(TOTAL_SECONDS_FALLBACK);
  const tickRef = useRef(null);
  const syncRef = useRef(null);

  // 서버에서 남은 시간 수신
  useEffect(() => {
    const handleTime = ({ remainingMs }) => {
      const sec = Math.max(0, Math.floor((remainingMs || 0) / 1000));
      setRemaining(sec);
    };
    socket.on('room:time', handleTime);
    // 초기 요청 (방 id는 상황에 맞게 교체)
    socket.emit('room:time:request', { roomId: 'general' });

    return () => {
      socket.off('room:time', handleTime);
    };
  }, []);

  // 1초 틱 (로컬 카운트다운)
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // 5초마다 서버 동기화 요청
  useEffect(() => {
    syncRef.current = setInterval(() => {
      socket.emit('room:time:request', { roomId: 'general' });
    }, 5000);
    return () => clearInterval(syncRef.current);
  }, []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = 1 - remaining / (TOTAL_SECONDS_FALLBACK || 1);

  return (
    <div className="overview-top">
      <div className="timer-wrap">
        <div className="timer-face" style={{"--p": String(progress)}}>
          <div className="timer-total-inside">25:00</div>
          <div className="timer-remaining">{mm}:{ss}</div>
        </div>
      </div>
    </div>
  );
}