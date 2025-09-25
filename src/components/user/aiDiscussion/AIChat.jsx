import { useEffect, useRef, useState } from "react";
import { socket } from "@/api/chat";
import aiIcon from "@/assets/images/discussion/AI_icon.png";
// 효과음 리소스 (경로만 실제 보유 리소스로 교체하면 됩니다)
import sfxComment from "@/assets/sounds/click.wav";
import sfxEncourage from "@/assets/sounds/click.wav";

function formatTime(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    return `${hh}:${mm}`;
  } catch {
    return "";
  }
}

// phase: idle → thinking → message
export default function AIChat() {
  const [phase, setPhase] = useState("idle");
  const [currentMent, setCurrentMent] = useState(null); // { id, type, text, createdAt }
  const [dots, setDots] = useState(".");

  const myNick = typeof window !== "undefined" ? localStorage.getItem("nickname") : null;
  const hideTimerRef = useRef(null);
  const thinkTimerRef = useRef(null);
  const dotsTimerRef = useRef(null);
  const pendingRef = useRef(null);

  // preload audio
  const commentAudioRef = useRef(null);
  const encourageAudioRef = useRef(null);
  useEffect(() => {
    commentAudioRef.current = new Audio(sfxComment);
    encourageAudioRef.current = new Audio(sfxEncourage);
    // 낮은 볼륨으로 시작
    if (commentAudioRef.current) commentAudioRef.current.volume = 0.6;
    if (encourageAudioRef.current) encourageAudioRef.current.volume = 0.6;
    return () => {
      [commentAudioRef.current, encourageAudioRef.current].forEach(a => {
        try { a && a.pause(); } catch {}
      });
    };
  }, []);

  useEffect(() => {
    const onMent = (payload) => {
      // payload: { id, roomId, type: "topic_comment"|"encourage", text, targets?: string[], createdAt }
      if (!payload) return;
      if (payload.type === "encourage") {
        const targets = Array.isArray(payload.targets) ? payload.targets : [];
        if (!myNick || !targets.includes(myNick)) return; // 본인 대상 아니면 스킵
      }

      // 먼저 thinking 연출로 전환
      pendingRef.current = payload;
      setPhase("thinking");
      setCurrentMent(null);

      // dots 애니메이션 시작 (".", "..", "..." 순환)
      clearInterval(dotsTimerRef.current);
      setDots(".");
      dotsTimerRef.current = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
      }, 300);

      // 잠깐 생각중(예: 900ms) 후 멘트 표시 + 사운드
      clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = setTimeout(() => {
        const next = pendingRef.current;
        setCurrentMent(next);
        setPhase("message");

        // 효과음 재생 (브라우저 정책상 play가 막히면 조용히 실패)
        const playSafe = (audio) => {
          try { audio && audio.currentTime && (audio.currentTime = 0); } catch {}
          try { audio && audio.play && audio.play().catch(() => {}); } catch {}
        };
        if (next?.type === "encourage") playSafe(encourageAudioRef.current);
        else playSafe(commentAudioRef.current);

        // 멘트 표시 시간 후 idle 복귀
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
          setPhase("idle");
          setCurrentMent(null);
          clearInterval(dotsTimerRef.current);
        }, 15000);
      }, 900);
    };

    socket.on("ai:ment", onMent);
    return () => {
      socket.off("ai:ment", onMent);
      clearTimeout(thinkTimerRef.current);
      clearTimeout(hideTimerRef.current);
      clearInterval(dotsTimerRef.current);
    };
  }, [myNick]);

  // 항상 상주: idle일 때도 배지와 말풍선 프레임은 보여줌
  return (
    <div className={`ai-chat ai-chat--${phase}`}>
      <img className="badge-img" src={aiIcon} alt="aiIcon"/>

      {phase === "thinking" && (
        <div className="ai-chat-text" aria-live="polite">
          <span className="ai-thinking">생각중{dots}</span>
        </div>
      )}

      {phase === "message" && currentMent && (
        <div className="ai-chat-text">
          {currentMent.text}
        </div>
      )}

      {phase === "idle" && (
        <div className="ai-chat-text ai-chat-text--idle">
          AI가 함께 보고 있어요
        </div>
      )}
    </div>
  );
}