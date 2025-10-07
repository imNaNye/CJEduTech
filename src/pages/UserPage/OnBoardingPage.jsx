import PageHeader from "../../components/common/PageHeader";
import OnboardingMain from "../../components/user/onboarding/OnboardingMain";
import '../../components/user/onboarding/onboarding.css';
import { useRoundStep } from '../../contexts/RoundStepContext';


export default function OnBoardingPage(){
    const { round, step, setStep } = useRoundStep();
    setStep(1);
    return(
        <div className="onboarding-page">
            <PageHeader title="Onboarding"/>
            <OnboardingMain/>
        </div>
    )
}