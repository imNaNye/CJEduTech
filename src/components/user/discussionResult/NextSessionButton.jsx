import { useNavigate } from "react-router-dom";
import { useRoundStep } from '../../../contexts/RoundStepContext';


export default function NextSessionButton() {
  const navigate = useNavigate();
  const { round, setRound, step, setStep,videoId, setVideoId } = useRoundStep();
  return (
    <button
      className="next-session-button"
      onClick={() => {
        if (videoId === 2) {
          navigate("/user/loadResult");
        } else {
          setStep(4);
          setVideoId(videoId+1);
          navigate("/user/video", { replace: true });
        }
      }}
    >
      다음으로
    </button>
  );
}