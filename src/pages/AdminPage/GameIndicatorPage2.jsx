import IndicatorNextButton from "../../components/admin/indicatorNextButton";
import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/gameIndicator/gameIndicator.css';
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useUser } from "../../contexts/UserContext";
import { useEffect } from 'react';

export default function GameIndicatorPage2(){
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();

    useEffect(() => {
        setStep(3);
        setIsAdmin(true);
    }, []);
    return(
        
        <div className="game-indicator-page2">
            <PageHeader title="STEP3 게임학습"/>
            <IndicatorNextButton/>
        </div>
    )
}