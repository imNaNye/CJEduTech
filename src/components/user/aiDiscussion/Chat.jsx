export default function Chat({ isMine, nickname, text, createdAt, reactionsCount = 0, didReact = false, aiLabel, aiScore, aiLabels, aiScores }) {
  const time = createdAt ? new Date(createdAt) : new Date();
  const hh = time.getHours().toString().padStart(2, '0');
  const mm = time.getMinutes().toString().padStart(2, '0');
  const ts = `${hh}:${mm}`;

  const labels = Array.isArray(aiLabels) && aiLabels.length ? aiLabels : (aiLabel ? [aiLabel] : []);

  return (
    <div className={`chat ${isMine ? 'mine' : 'others'}`}>
      {!isMine && <div className="chat-profile-image" />}
      <div className={`chat-bubble ${isMine ? 'mine' : 'others'}`}>
        {!isMine && <div className="chat-nickname">{nickname || '익명'}</div>}
        <div className="chat-text">{text}</div>
        <div className="chat-time">{ts}</div>
        {labels.length > 0 && (
          <div className="chat-ai">
            {labels.map((l) => {
              const s = aiScores && typeof aiScores[l] === 'number' ? aiScores[l] : (l === aiLabel && typeof aiScore === 'number' ? aiScore : undefined);
              return (
                <span key={l} className="chat-ai-badge">🔖 {l}</span>
              );
            })}
          </div>
        )}
        <div className={`chat-reaction ${didReact ? 'active' : ''}`}>
          <span className="heart">♥</span>
          <span className="count">{reactionsCount}</span>
        </div>
      </div>
      {isMine && <div className="chat-profile-image" style={{ visibility: 'hidden' }} />}
    </div>
  );
}