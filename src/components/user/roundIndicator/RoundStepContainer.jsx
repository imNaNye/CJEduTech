import { useRoundStep } from "../../../contexts/RoundStepContext";
import './roundIndicator.css';

export default function RoundStepContainer(){
    const { step } = useRoundStep();

    return(
        <div className = "round-step-container">
            <div className = {((step === 1) ? 'current-step' : 'step-indicator')}>
                <h4>step 1</h4>
                퀴즈 풀이
            </div>
            <div className = {((step === 2) ? 'current-step' : 'step-indicator')}>
                <h4>step 2</h4>
                영상 시청
            </div>
            <div className = {((step === 3) ? 'current-step' : 'step-indicator')}>
                <h4>step 3</h4>
                AI 토론
            </div>
        </div>
    );
}