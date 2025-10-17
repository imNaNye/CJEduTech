import { useNavigate } from 'react-router-dom';
import afterSlideImage from '@/assets/images/slide/afterslide.png';
import { RoundStepProvider, useRoundStep } from '../../../contexts/RoundStepContext.jsx'

export default function AfterSlideImage() {
    const navigate = useNavigate();
    const {step, setStep} = useRoundStep();

    const handleClick = () => {
        setStep(2)
        navigate('/admin/roundIndicator')
    };

    return (
        <img src={afterSlideImage} onClick={handleClick} className="after-slide-image"></img>
    );
}