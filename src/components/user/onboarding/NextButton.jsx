import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';
import { useRoundStep } from '../../../contexts/RoundStepContext';

export default function NextButton() {
  const navigate = useNavigate();
  const {setStep}=useRoundStep();
  const {isAdmin} = useUser();

  const handleClick = () => {
    if (isAdmin){ navigate('/admin/roundIndicator');}
    else {setStep(1);navigate('/user/roundIndicator');}
  };

  return (
    <button className="next-button" onClick={handleClick}>
      다음으로
    </button>
  );
}