import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/components/admin/slideIndicator/slideIndicator.css'
import PageHeader from '../../components/common/PageHeader'
import IndicatorNextButton from '../../components/admin/indicatorNextButton';
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useUser } from "../../contexts/UserContext";
import { useState } from 'react';

export default function SlideIndicatorPage(){
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();
    const [isButtonActive, setIsButtonActive] = useState(isAdmin);

    useEffect(() => {
        setStep(1);
        if (!isAdmin) {
            const timer = setTimeout(() => {
                setIsButtonActive(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);
    return (
        <div className="slide-indicator-page">
            <PageHeader title="1STEP 이론학습"/>
            {!isAdmin && (
                            <div className="user-indicator-footer">
                                슬라이드 종료 후 다음으로 버튼을 눌러주세요.
                            </div>
                        )}
                        <div style={{ pointerEvents: isButtonActive ? 'auto' : 'none', opacity: isButtonActive ? 1 : 0.5 }}>
                            <IndicatorNextButton/>
                        </div>
        </div>
    )
}