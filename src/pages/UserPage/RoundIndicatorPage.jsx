import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStep } from "../../contexts/RoundStepContext";
import PageHeader from "../../components/common/PageHeader";
import RoundIndicatorMain from "../../components/user/roundIndicator/RoundIndicatorMain";

export default function RoundIndicatorPage(){
    const { step } = useRoundStep();
    const navigate = useNavigate();

    useEffect(() => {
        const timeout = setTimeout(() => {
            if(step === 1){
                navigate('/user/quiz');
            } else if(step === 2){
                navigate('/user/video');
            } else if(step === 3){
                navigate('/user/aiDiscussionPage');
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [step, navigate]);

    return(
        <div className="round-indicator-page">
            <PageHeader/>
            <RoundIndicatorMain/>
        </div>
    );
}