
import IndicatorNextButton from "../../components/admin/indicatorNextButton";
import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/gameIndicator/gameIndicator.css';
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useUser } from "../../contexts/UserContext";
import { useEffect } from 'react';

export default function VideoIndicatorPage(){
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();

    useEffect(() => {
        setStep(4);
        setIsAdmin(true);
    }, []);
    
    return(
        <div className="video-indicator-page">
            <PageHeader title="STEP4 영상시청&토론"/>
            <IndicatorNextButton/>
        </div>
    )
}