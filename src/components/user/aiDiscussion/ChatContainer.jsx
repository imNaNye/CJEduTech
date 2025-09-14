import { useState, useEffect } from "react";
import AIChat from "./AIChat";
import ChatHistory from "./ChatHistory";
import ChatInput from "./ChatInput";
import ChatSubmitButton from "./ChatSubmitButton";
import { useRoundStep } from '@/contexts/RoundStepContext';
 
export default function ChatContainer({ nickname, topic }) {
    const [localNickname, setLocalNickname] = useState(nickname);
    const [localTopic, setLocalTopic] = useState(topic);

    const { round, setRound, step, setStep } = useRoundStep();
    console.log(round);
    useEffect(() => {
      if (!nickname) {
        const storedNickname = localStorage.getItem("nickname");
        if (storedNickname) setLocalNickname(storedNickname);
      }
      if (!topic) {
        const storedTopic = localStorage.getItem("topic");
        if (storedTopic) setLocalTopic(storedTopic);
      }
    }, [nickname, topic]);

    return (
        <div className="chat-container">
            <div className="page-header-short">
              
            <div className="title">Round {round} : {localTopic || "토론 주제"}</div>

            <div className="user-info">
                {localNickname && <span className="nickname">{localNickname}</span>}
            </div>
            </div>
            <AIChat/>
            <ChatHistory/>
            <div className="chat-input-area">
                <ChatInput/>
            </div>
        </div>
    )
}