import { useNavigate } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext';

export default function NextButton() {
  const navigate = useNavigate();
  const {isAdmin, setIsAdmin} = useUser();

  const handleClick = () => {
    if (isAdmin){
      navigate('/admin/slide');
    } else {
      setIsAdmin(true);
      navigate('/admin/slide');
    }
  };

  return (
    <button className="next-button" onClick={handleClick}>
      다음으로
    </button>
  );
}