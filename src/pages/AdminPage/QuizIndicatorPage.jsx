import IndicatorNextButton from "../../components/admin/indicatorNextButton";
import PageHeader from "../../components/common/PageHeader";
import '@/components/admin/quizIndicator/quizIndicator.css';
import { useRoundStep } from "../../contexts/RoundStepContext";
import { useUser } from "../../contexts/UserContext";
import { useState, useEffect } from 'react';

export default function QuizIndicatorPage(){
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();

    useEffect(() => {
        setStep(2);
    }, []);
    
    const [timeLeft, setTimeLeft] = useState(180);
    const [isButtonActive, setIsButtonActive] = useState(isAdmin);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!isAdmin) {
            const timer = setTimeout(() => {
                setIsButtonActive(true);
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="quiz-indicator-page">
            {isAdmin && (
                <div className="timer">
                    {formatTime(timeLeft)}
                </div>
            )}
            <PageHeader title="STEP2 퀴즈풀이"/>
            {!isAdmin && (
                <div className="user-indicator-footer">
                    퍼실리테이터의 안내 후 다음으로 버튼을 눌러주세요.
                </div>
            )}
            <div style={{ pointerEvents: isButtonActive ? 'auto' : 'none', opacity: isButtonActive ? 1 : 0.5 }}>
                <IndicatorNextButton/>
            </div>
        </div>
    )
}