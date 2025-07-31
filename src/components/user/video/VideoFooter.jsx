import { useNavigate } from 'react-router-dom';

export default function VideoFooter() {
  const navigate = useNavigate();

  return (
    <div className="video-footer">
      <p className="video-guide">영상은 자동 재생되며, 종료 후 토론 화면으로 전환됩니다.</p>
      <button className="skip-button" onClick={() => navigate('/user/aiDiscussion')}>
        SKIP
      </button>
    </div>
  );
}