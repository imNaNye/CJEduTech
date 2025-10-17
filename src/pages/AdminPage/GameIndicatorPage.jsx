import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/gameIndicator/gameIndicator.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../contexts/UserContext";
import { useRoundStep } from "../../contexts/RoundStepContext";

export default function GameIndicatorPage(){
    const navigate = useNavigate();
    const {step, setStep} = useRoundStep();
    const {isAdmin, setIsAdmin} = useUser();

    const handleNext = () => {
        setStep(3);
        setIsAdmin(true);
        navigate('/admin/gameIndicator2');
    };

    return (
        <div className='game-indicator-page'>
            <PageHeader title='STEP3 게임학습'></PageHeader>
            <button onClick={handleNext} className='next-button'>
                다음으로
            </button>
        </div>
    )
}