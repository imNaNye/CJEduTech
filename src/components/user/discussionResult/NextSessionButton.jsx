import { useNavigate } from "react-router-dom";
import { useRoundStep } from '../../../contexts/RoundStepContext';
import { useUser } from '../../../contexts/UserContext';


export default function NextSessionButton() {
  const navigate = useNavigate();
  const { round, setRound, step, setStep,videoId, setVideoId } = useRoundStep();
  const { isAdmin } = useUser();
  return (
    <button
      className="next-session-button"
      onClick={() => {
        if (videoId === 2 || videoId===9) {
          navigate("/user/loadResult");
        } else {
          setVideoId(videoId+1);
          if(isAdmin){

          navigate("/admin/video",{replace:false});
          }else{

          navigate("/user/videoIndicator",{replace:false});
          }
        }
      }}
    >
      다음으로
    </button>
  );
}