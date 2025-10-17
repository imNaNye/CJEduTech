
import IndicatorNextButton from "../../components/admin/indicatorNextButton";
import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/gameIndicator/gameIndicator.css';
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useUser } from "../../contexts/UserContext";
import { useState,useEffect } from 'react';

export default function VideoIndicatorPage(){
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();
     const [isButtonActive, setIsButtonActive] = useState(isAdmin);

    useEffect(() => {
        setStep(4);
        if (!isAdmin) {
            const timer = setTimeout(() => {
                setIsButtonActive(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);
    
    return(
        <div className="video-indicator-page">
            <PageHeader title="STEP4 영상시청&토론"/>
            {!isAdmin && (
                            <div className="user-indicator-footer">
                                영상 시청 종료 후 다음으로 버튼을 눌러주세요.
                            </div>
                        )}
                        <div style={{ pointerEvents: isButtonActive ? 'auto' : 'none', opacity: isButtonActive ? 1 : 0.5 }}>
                            <IndicatorNextButton/>
                        </div>
        </div>
    )
}