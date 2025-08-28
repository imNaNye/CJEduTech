import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { socket } from "@/api/chat";
import Chat from "./Chat";

function generateRandomNickname() {
  const adjectives = ["빠른", "멋진", "똑똑한", "용감한", "행복한"];
  const animals = ["호랑이", "토끼", "독수리", "사자", "여우"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective}${animal}${Math.floor(Math.random() * 1000)}`;
}

export default function ChatHistory() {
  const [myNick] = useState(() => {
    let storedNick = localStorage.getItem("nickname");
    if (!storedNick) {
      storedNick = generateRandomNickname();
      localStorage.setItem("nickname", storedNick);
    }
    return storedNick;
  });
  const [messages, setMessages] = useState([]);
  const [autoScroll, setAutoScroll] = useState(false);
  const roomId = "general";

  const bottomRef = useRef(null);
  const historyRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  const isNearBottom = () => {
    if (!historyRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = historyRef.current;
    return scrollHeight - (scrollTop + clientHeight) < 50; // within 50px
  };

  useLayoutEffect(() => {
    const el = historyRef.current;
    if (!el) return;

    const wasNearBottom = isNearBottom();
    const prevH = prevScrollHeightRef.current || 0;
    const newH = el.scrollHeight;

    // Case A: 내가 보냈거나(autoscroll), 이미 하단을 보고 있다면 자동 하단 스크롤
    if ((autoScroll || wasNearBottom) && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: autoScroll ? "smooth" : "auto" });
      setAutoScroll(false);
    } else {
      // Case B: 위쪽을 읽는 중인데 메시지/라벨 업데이트로 높이가 늘어났다면, 상대 위치 보존
      const delta = newH - prevH;
      if (delta > 0) {
        el.scrollTop += delta; // 보정: 새로 증가한 만큼 위로 올려서 현재 뷰 유지
      }
    }

    // 다음 사이클 대비 현재 높이 저장
    prevScrollHeightRef.current = el.scrollHeight;
  }, [messages, autoScroll]);

  useEffect(() => {
    socket.emit("room:join", { roomId });

    socket.on("room:recent", (payload) => {
      setMessages(payload.messages || []);
      // 초기 렌더 후 기준 높이 기록
      requestAnimationFrame(() => {
        if (historyRef.current) {
          prevScrollHeightRef.current = historyRef.current.scrollHeight;
        }
      });
    });

    socket.on("message:new", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      if (newMessage.nickname === myNick || isNearBottom()) {
        setAutoScroll(true);
      } else {
        setAutoScroll(false);
      }
    });

    socket.on("reaction:update", ({ messageId, reactedUsers, reactionsCount }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, reactedUsers, reactionsCount } : m)
      );
    });

    socket.on("message:ai", ({ messageId, aiLabel, aiScore }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, aiLabel, aiScore } : m));
    });

    return () => {
      socket.off("room:recent");
      socket.off("message:new");
      socket.off("reaction:update");
      socket.off("message:ai");
    };
  }, []);

  return (
    <div className="chat-history" ref={historyRef}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          onClick={() => {
            if (msg.nickname !== myNick) {
              socket.emit("reaction:toggle", { messageId: msg.id, nickname: myNick });
            }
          }}
          style={{ cursor: msg.nickname !== myNick ? 'pointer' : 'default' }}
        >
          <Chat
            isMine={msg.nickname === myNick}
            nickname={msg.nickname}
            text={msg.text}
            createdAt={msg.createdAt}
            reactionsCount={msg.reactionsCount || (msg.reactedUsers ? msg.reactedUsers.length : 0)}
            didReact={Array.isArray(msg.reactedUsers) ? msg.reactedUsers.includes(myNick) : false}
            aiLabel={msg.aiLabel}
            aiScore={msg.aiScore}
          />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}