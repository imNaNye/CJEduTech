import Chat from "./Chat";

export default function ChatHistory() {
    {/*더미메시지*/}
  const messages = [
    { id: 1, sender: "user", text: "다람쥐 헌 쳇바퀴에 올라타." },
    { id: 2, sender: "user", text: "정말 그런가요?" }
  ];

  return (
    <div className="chat-history">
      {messages.map((msg) => (
        <Chat key={msg.id} sender={msg.sender} text={msg.text} />
      ))}
    </div>
  );
}