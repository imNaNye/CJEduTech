import avatar1 from "@/assets/images/avatar/avatar1.png";
import avatar2 from "@/assets/images/avatar/avatar2.png";
import avatar3 from "@/assets/images/avatar/avatar3.png";
import avatar4 from "@/assets/images/avatar/avatar4.png";
import avatar5 from "@/assets/images/avatar/avatar5.png";
import avatar6 from "@/assets/images/avatar/avatar6.png";
import avatar7 from "@/assets/images/avatar/avatar7.png";
import avatar8 from "@/assets/images/avatar/avatar8.png";
import avatar9 from "@/assets/images/avatar/avatar9.png";
import avatar10 from "@/assets/images/avatar/avatar10.png";
import avatar11 from "@/assets/images/avatar/avatar11.png";
import avatar12 from "@/assets/images/avatar/avatar12.png";
import AIicon from "@/assets/images/discussion/AI_icon.png";

export default function Chat({ isMine, nickname, text, createdAt, reactionsCount = 0, didReact = false, aiLabel, aiScore, aiLabels, aiScores ,avatarUrl}) {
  
      const avatars = [
        { id: '1', src: avatar1 },
        { id: '2', src: avatar2 },
        { id: '3', src: avatar3 },
        { id: '4', src: avatar4 },
        { id: '5', src: avatar5 },
        { id: '6', src: avatar6 },
        { id: '7', src: avatar7 },
        { id: '8', src: avatar8 },
        { id: '9', src: avatar9 },
        { id: '10', src: avatar10 },
        { id: '11', src: avatar11 },
        { id: '12', src: avatar12 },
        {id:'ai',src:AIicon},
      ];

  const time = createdAt ? new Date(createdAt) : new Date();
  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ts = `${hh}:${mm}`;

  const labels = Array.isArray(aiLabels) && aiLabels.length ? aiLabels : (aiLabel ? [aiLabel] : []);
  function findAvatarById(id) {
    const found = avatars.find(a => a.id === id);
    return found ? found.src : avatar1;
  }

  console.log("Chat: avataUrl : ",avatarUrl);
  const isAIDM = (!isMine) && (avatarUrl === 'ai' || nickname === '아이고라AI');

  return (
    <div className={`chat ${isMine ? 'mine' : 'others'}`}>
            {!isMine && (
        <img src={findAvatarById(avatarUrl)} alt="avatar" className="chat-profile-image" />
      )}
      <div className={`chat-bubble ${isMine ? 'mine' : 'others'} ${isAIDM ? 'ai-dm' : ''}`}>
        {!isMine && <div className="chat-nickname">{nickname || '익명'}</div>}
        <div className="chat-text">{text}</div>
        {labels.length > 0 && (
          <div className="chat-ai">
            {labels.map((l) => (
              <span key={l} className="chat-ai-badge">🔖 {l}</span>
            ))}
          </div>
        )}
        <div className="chat-meta">
          <div className="chat-time">{ts}</div>
          <div className={`chat-reaction ${didReact ? 'active' : ''}`}>
            <span className="heart">♥</span>
            <span className="count">{reactionsCount}</span>
          </div>
        </div>
      </div>
      {isMine && <div className="chat-profile-image"  style={{ visibility: 'hidden' }} />}
    </div>
  );
}