import { useNavigate } from 'react-router-dom';

export default function StartButton(onSelect = () => {}) {
  const navigate = useNavigate();

  const handleClick = async () => {
    await onSelect();
    navigate('/user/onboarding');
  };

  return (
    <button className="start-button" onClick={handleClick}>
      시작하기
    </button>
  );
}