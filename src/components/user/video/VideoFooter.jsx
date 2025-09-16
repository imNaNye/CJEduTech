import { useNavigate } from 'react-router-dom';
import { useRoundStep } from '../../../contexts/RoundStepContext';

export default function VideoFooter() {
  const navigate = useNavigate();
  const { round, step, setStep } = useRoundStep();

  return (
    <div className="video-footer">
      <p className="video-guide">시연을 위해 임의로 제작된 스킵 버튼입니다. 누를 시 토론 화면으로 이동합니다.   </p>
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