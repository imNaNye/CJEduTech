import NextButton from "./NextButton";
import OnboardingImgText from "./OnboardingimgText";

export default function OnboardingContainer(){
    return(
        <div className="onboarding-container">
            <OnboardingImgText/>
            <NextButton></NextButton>
        </div>
    )
}