import { useNavigate } from 'react-router-dom';
import { useRoundStep } from '../../../contexts/RoundStepContext';

export default function VideoFooter() {
  const navigate = useNavigate();
  const { round, step, setStep } = useRoundStep();

  return (
    <div className="video-footer">
      <p className="video-guide">영상은 자동 재생되며, 종료 후 토론 화면으로 전환됩니다.</p>
      <button className="skip-button" onClick={() => 
      {
        navigate('/user/roundIndicator');
        setStep(3);
      }}>
        SKIP
      </button>
    </div>
  );
}