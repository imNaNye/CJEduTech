import { useNavigate } from 'react-router-dom';

export default function StartButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/user/onboarding');
  };

  return (
    <button className="start-button" onClick={handleClick}>
      시작하기
    </button>
  );
}