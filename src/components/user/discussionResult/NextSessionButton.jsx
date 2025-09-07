import { useNavigate } from "react-router-dom";
import { useRoundStep } from '../../../contexts/RoundStepContext';


export default function NextSessionButton() {
  const navigate = useNavigate();
  const { round, setRound, step, setStep } = useRoundStep();
  return (
    <button
      className="next-session-button"
      onClick={() => {
        if (round === 3) {
          navigate("/user/loadResult");
        } else {
          setRound(round + 1);
          setStep(1);
          navigate("/user/roundIndicator", { replace: true });
        }
      }}
    >
      다음으로
    </button>
  );
}