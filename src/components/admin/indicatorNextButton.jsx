import { useNavigate } from 'react-router-dom';
import { useRoundStep } from '@/contexts/RoundStepContext';
import './indicatorNextButton.css';
import { useUser } from '../../contexts/UserContext';

export default function IndicatorNextButton() {
    const navigate = useNavigate();
    const { step, setStep } = useRoundStep();
    const { isAdmin, setIsAdmin } = useUser();

    const handleClick = () => {
        if (step === 1) {
            if (isAdmin){
                setStep(2);
                navigate('/admin/donorsOnboarding');
            } else {
                setStep(2);
                navigate('/user/roundIndicator');
            }
        } else if (step === 2) {
            if (isAdmin){
                setStep(3);
                navigate('/admin/roundIndicator');
            } else {
                setStep(3);
                navigate('/user/quiz');
            }
        } else if (step===3) {
            setStep(4);
            navigate('/admin/game');
        } else if (step===4) {
            if (isAdmin){
            navigate('/admin/video');
            } else {
                navigate('/user/aiDiscussion');
            }
        }

        console.log('현재 스텝 값 : ' + step);
    };

    return (
        
            <button onClick={handleClick} className='indicator-next-button'>
                다음으로
            </button>

    );
}