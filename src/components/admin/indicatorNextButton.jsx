import { useNavigate } from 'react-router-dom';
import { useRoundStep } from '@/contexts/RoundStepContext';
import './indicatorNextButton.css';

export default function IndicatorNextButton() {
    const navigate = useNavigate();
    const { step, setStep } = useRoundStep();

    const handleClick = () => {
        if (step === 1) {
            setStep(2);
            navigate('/admin/donorsOnboarding');
        } else if (step === 2) {
            setStep(3);
            navigate('/admin/roundIndicator');
        } else if (step===3) {
            setStep(4);
            navigate('/admin/game');
        } else if (step===4) {
            navigate('/admin/video');
        }

        console.log('현재 스텝 값 : ' + step);
    };

    return (
        
            <button onClick={handleClick} className='indicator-next-button'>
                다음으로
            </button>

    );
}