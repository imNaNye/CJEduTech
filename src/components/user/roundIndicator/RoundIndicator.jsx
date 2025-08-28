import { useRoundStep } from "../../../contexts/RoundStepContext";

export default function RoundIndicator(){
    const { round } = useRoundStep()

    return(
        <div className="round-indicator">
            <h3>Round {round}</h3>
        </div>
    );
}