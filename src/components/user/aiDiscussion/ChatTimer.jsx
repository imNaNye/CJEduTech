import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const TOTAL_SECONDS = 24 * 60; // 24분
const GENERATE_RESULT_API = "/api/discussions/generate-result"; // 서버 토론 결과 생성 API
const LOADING_ROUTE = "/user/discussionLoading"; // 로딩 페이지 라우트 (필요시 수정)

export default function ChatTimer(){
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const firedRef = useRef(false); // 중복 호출 방지

  async function triggerGenerateAndGo() {
    if (firedRef.current) return;
    firedRef.current = true;
    try {
      await fetch(GENERATE_RESULT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "timeout" })
      });
    } catch (e) {
      // 실패해도 로딩 페이지로 이동 (서버 측 처리 진행 가정)
      // 콘솔에만 남김
      console.error("Failed to request discussion result:", e);
    } finally {
      navigate(LOADING_ROUTE);
    }
  }

  useEffect(() => {//TODO : 타이머 서버 동기화 
    // 1초 간격 카운트다운
    timerRef.current = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // 남은 시간이 0이 되면 서버 요청 후 로딩 페이지로 이동
  useEffect(() => {
    if (remaining === 0) {
      clearInterval(timerRef.current);
      triggerGenerateAndGo();
    }
  }, [remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = 1 - remaining / TOTAL_SECONDS; // 0 → 1

  return (
    <div className="overview-top">
      <div className="timer-wrap">
        <div className="timer-face" style={{"--p": String(progress)}}>
          <div className="timer-total-inside">24:00</div>
          <div className="timer-remaining">{mm}:{ss}</div>
        </div>
      </div>

    </div>
  );
}