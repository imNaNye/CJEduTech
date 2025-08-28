import React, { useState } from "react";
import { socket } from "@/api/chat";

export default function ChatInput() {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

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

  return (
    <div className="chat-input-wrapper">
      <textarea
        className="chat-input-field"
        placeholder="메시지를 입력하세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => {
          setIsComposing(false);
          // ensure the latest composed character is in state
          setText(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            // if IME composition in progress, do not send yet
            if (isComposing || e.nativeEvent.isComposing || e.keyCode === 229) {
              return;
            }
            e.preventDefault();
            send();
          }
        }}
      />
      <button className="chat-submit-button" onClick={send}></button>
    </div>
  );
}