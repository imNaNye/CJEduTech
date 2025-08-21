import { useEffect, useState } from "react";
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
  const roomId = "general";

  useEffect(() => {
    socket.emit("room:join", { roomId });

    socket.on("room:recent", (payload) => {
      setMessages(payload.messages || []);
    });

    socket.on("message:new", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
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
    <div className="chat-history">
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
    </div>
  );
}