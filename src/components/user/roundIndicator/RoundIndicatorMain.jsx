import RoundIndicator from "./RoundIndicator";
import RoundStepContainer from "./RoundStepContainer";
import './roundIndicator.css'

export default function RoundIndicatorMain(){
    return(
        <div className="round-indicator-main">
            <RoundIndicator/>
            <img className="logo-robot" src="/src/assets/images/common/logoRobot.png"></img>
            <RoundStepContainer/>
        </div>
    )
}