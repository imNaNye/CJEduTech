import roundStartSound from '@/assets/sounds/round_start.mp3';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStep } from "../../contexts/RoundStepContext";
import PageHeader from "../../components/common/PageHeader";
import logoRobot from "@//assets/images/common/logoRobot.png";
import "@/components/user/roundIndicator/roundIndicator.css";

export default function RoundIndicatorPage(){
    const { step, round } = useRoundStep();
    const navigate = useNavigate();

    useEffect(() => {
        const audio = new Audio(roundStartSound);
        audio.play();

        const timeout = setTimeout(() => {
            if(step === 1){
                navigate('/admin/slideIndicator');
            } else if(step === 2){
                navigate('/admin/quiz');
            } else if(step === 3){
                navigate('/admin/game');
            } else if(step === 4){
                navigate('/admin/video');
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