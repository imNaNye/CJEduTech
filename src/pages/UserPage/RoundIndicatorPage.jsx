import roundStartSound from '@/assets/sounds/round_start.mp3';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStep } from "../../contexts/RoundStepContext";
import PageHeader from "../../components/common/PageHeader";
import logoRobot from "@//assets/images/common/logoRobot.png";
import "@/components/user/roundIndicator/roundIndicator.css";
import { useUser } from '../../contexts/UserContext';

export default function RoundIndicatorPage(){
    const { step, round } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        const audio = new Audio(roundStartSound);
        audio.play();
        localStorage.setItem("step",step);

        localStorage.removeItem("isAdmin");
        const timeout = setTimeout(() => {
            if(step === 1){
                setIsAdmin(false);
                navigate('/user/slideIndicator');
            } else if(step === 2){
                setIsAdmin(false);
                navigate('/user/quizIndicator');
            } else if(step === 3){
                setIsAdmin(false);
                navigate('/user/gameIndicator');
            } else if(step === 4){
                navigate('/user/videoIndicator');
            }
        }, 6000);

        return () => clearTimeout(timeout);
    }, [step, navigate]);

    return(
        <div className="round-indicator-page">
            <PageHeader title={`Step ${step}`} />
            <div className="round-indicator">
                <img className="logo-robot" src={logoRobot}></img>
                <div className = "round-step-container">
                    <div className = {((step === 1) ? 'current-step' : 'step-indicator')}>
                        <h4>step 1</h4>
                        이론학습
                    </div>
                    <div className = {((step === 2) ? 'current-step' : 'step-indicator')}>
                        <h4>step 2</h4>
                        퀴즈풀이
                    </div>
                    <div className = {((step === 3) ? 'current-step' : 'step-indicator')}>
                        <h4>step 3</h4>
                        게임학습
                    </div>
                    <div className = {((step === 4) ? 'current-step' : 'step-indicator')}>
                        <h4>step 4</h4>
                        영상시청&토론
                    </div>
                </div>
                <div className="explanation">몇 초 뒤, 다음 화면으로 자동 전환됩니다.</div>
            </div>
        </div>
    );
}