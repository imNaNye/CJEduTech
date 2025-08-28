import { useRoundStep } from "../../../contexts/RoundStepContext";

export default function RoundStepContainer({whichStep = 1}){
    const {step} = useRoundStep

    return(
        <div className = "round-step-container">
            <div className = {((step === 1) ? 'current-step' : 'step-indicator')}>
                <h4>step 1</h4>
                <text>퀴즈 풀이</text>
            </div>
            <div className = {((step === 2) ? 'current-step' : 'step-indicator')}>
                <h4>step 2</h4>
                <text>영상 시청</text>
            </div>
            <div className = {((step === 3) ? 'current-step' : 'step-indicator')}>
                <h4>step 3</h4>
                <text>AI 토론</text>
            </div>
        </div>
    );
}