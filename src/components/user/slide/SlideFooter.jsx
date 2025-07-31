//하단 안내 문구 + Skip 버튼

import { useNavigate } from 'react-router-dom';

export default function SlideFooter() {
  const navigate = useNavigate();

  return (
    <div className="slide-footer">
      <p className="slide-guide">슬라이드는 자동으로 전환됩니다. 아래 버튼을 누르면 퀴즈로 이동합니다.</p>
      <button className="skip-button" onClick={() => navigate('/user/quiz')}>
        SKIP
      </button>
    </div>
  );
}
