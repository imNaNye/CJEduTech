import React, { useState } from "react";
import { socket } from "@/api/chat";

export default function ChatInput() {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    const nickname = localStorage.getItem("nickname") || "익명";
    socket.emit("message:send", {
      roomId: "general",
      text,
      nickname,
    });
    setText("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      send();
    }
  };

  return (
    <div className="chat-input-wrapper">
      <input
        className="chat-input"
        type="text"
        placeholder="메시지를 입력하세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button onClick={send}>전송</button>
    </div>
  );
}