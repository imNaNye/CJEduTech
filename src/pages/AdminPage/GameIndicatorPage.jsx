import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/gameIndicator/gameIndicator.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from "../../contexts/UserContext";
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useState, useEffect } from 'react';

export default function GameIndicatorPage(){
    const navigate = useNavigate();
    const {step, setStep} = useRoundStep();
    const {isAdmin, setIsAdmin} = useUser();
     const [isButtonActive, setIsButtonActive] = useState(isAdmin);

    const handleNext = () => {
        if (isAdmin){
            setStep(3);
            navigate('/admin/gameIndicator2');
        } else {
            setStep(3);
            navigate('/user/game')
        }
    };
    useEffect(() => {
            if (!isAdmin) {
                const timer = setTimeout(() => {
                    setIsButtonActive(true);
                }, 10000);
                return () => clearTimeout(timer);
            }
        }, [isAdmin]);

    return (
        <div className='game-indicator-page'>
            <PageHeader title='STEP3 게임학습'></PageHeader>
            {!isAdmin && (
                            <div className="user-indicator-footer">
                                퍼실리테이터의 안내 후 다음으로 버튼을 눌러주세요.
                            </div>
                        )}
                        <div style={{ pointerEvents: isButtonActive ? 'auto' : 'none', opacity: isButtonActive ? 1 : 0.5 }}>
                            <button onClick={handleNext} className='next-button'>
                다음으로
            </button>
                        </div>
        </div>
    )
}