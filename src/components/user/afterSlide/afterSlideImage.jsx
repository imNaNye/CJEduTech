import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import afterslide1 from '@/assets/images/slide/afterslide1.png';
import afterslide2 from '@/assets/images/slide/afterslide2.png';
import afterslide3 from '@/assets/images/slide/afterslide3.png';
import afterslide4 from '@/assets/images/slide/afterslide4.png';
import afterslide5 from '@/assets/images/slide/afterslide5.png';
import { RoundStepProvider, useRoundStep } from '../../../contexts/RoundStepContext.jsx'

export default function AfterSlideImage() {
    const navigate = useNavigate();
    const {step, setStep} = useRoundStep();
    const [index, setIndex] = useState(0);
    const slideImages = [afterslide1, afterslide2, afterslide3, afterslide4, afterslide5];

    const handleClick = () => {
        if (index < 4) {
            setIndex(index + 1);
        } else {
            setStep(2);
            navigate('/admin/roundIndicator');
        }
    };

    return (
        <div
            className="after-slide-image"
            onClick={handleClick}
            style={{
                backgroundImage: `url(${new URL(slideImages[index], import.meta.url).href})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 0,
                cursor: 'pointer'
            }}
        />
    );
}