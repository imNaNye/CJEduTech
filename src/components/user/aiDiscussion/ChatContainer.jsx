import AIChat from "./AIChat";
import ChatHistory from "./ChatHistory";
import ChatInput from "./ChatInput";
import ChatSubmitButton from "./ChatSubmitButton";

export default function ChatContainer(){
    return (
        <div className="chat-container">
            <AIChat/>
            <ChatHistory/>
            <div className="chat-input-area">
                <ChatInput/>
            </div>
        </div>
    )
}