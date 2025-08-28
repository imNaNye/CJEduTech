import { useEffect, useRef, useState } from "react";

const TOTAL_SECONDS = 24 * 60; // 24분

export default function ChatTimer(){
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    // 1초 간격 카운트다운
    timerRef.current = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

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