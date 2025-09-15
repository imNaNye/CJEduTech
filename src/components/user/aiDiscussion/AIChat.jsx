import { useEffect, useState } from "react";
import { socket } from "@/api/chat";
import aiIcon from "@/assets/images/discussion/AI_icon.png";

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

export default function AIChat() {
  const [ments, setMents] = useState([]);
  const myNick = typeof window !== "undefined" ? localStorage.getItem("nickname") : null;

  useEffect(() => {
    const onMent = (payload) => {
      // payload: { id, roomId, type: "topic_comment"|"encourage", text, targets?: string[], createdAt }
      console.log(payload)
      if (!payload) return;
      if (payload.type === "encourage") {
        const targets = Array.isArray(payload.targets) ? payload.targets : [];
        if (!myNick || !targets.includes(myNick)) return; // 본인 대상이 아니면 렌더링 생략
      }
      setMents([payload]);
      setTimeout(() => {
        setMents([]);
      }, 15000);//15000);
    };

    socket.on("ai:ment", onMent);
    return () => {
      socket.off("ai:ment", onMent);
    };
  }, [myNick]);

  if (ments.length === 0) return null;
  const m = ments[0];
  return (
      <div key={m.id} className="ai-chat">
        <img className="badge-img" src={aiIcon} alt="aiIcon"/>
        <div className="ai-chat-text">{m.text}</div>
    </div>
  );
}