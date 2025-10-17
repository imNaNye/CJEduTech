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
        setIsAdmin(true);
    }, []);
    
    const [timeLeft, setTimeLeft] = useState(180);

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

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="quiz-indicator-page">
            <div className="timer">
                {formatTime(timeLeft)}
            </div>
            <PageHeader/>
            <IndicatorNextButton/>
        </div>
    )
}