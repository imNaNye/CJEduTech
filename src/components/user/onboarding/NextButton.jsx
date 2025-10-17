import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';

export default function NextButton() {
  const navigate = useNavigate();
  const {isAdmin} = useUser();

  const handleClick = () => {
    if (isAdmin){ navigate('/admin/roundIndicator');}
    else {navigate('/user/donorsOnboarding');}
  };

  return (
    <button className="next-button" onClick={handleClick}>
      다음으로
    </button>
  );
}