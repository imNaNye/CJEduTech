export default function Chat({sender, text}){
    return (
        <div className="chat">
            <div className="chat-profile-image">{/*캐릭터 이미지 자리*/}</div>
            <div className="chat-bubble">{text}</div>
        </div>
    );
}