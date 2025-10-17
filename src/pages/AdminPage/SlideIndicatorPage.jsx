import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/components/admin/slideIndicator/slideIndicator.css'
import PageHeader from '../../components/common/PageHeader'
import IndicatorNextButton from '../../components/admin/indicatorNextButton';
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useUser } from "../../contexts/UserContext";

export default function SlideIndicatorPage(){
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();

    useEffect(() => {
        setStep(1);
        setIsAdmin(true);
    }, []);
    return (
        <div className="slide-indicator-page">
            <PageHeader title="1STEP 이론학습"/>
            <IndicatorNextButton/>
        </div>
    )
}