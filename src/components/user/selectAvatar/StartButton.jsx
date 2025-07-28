import { useNavigate } from 'react-router-dom';

export default function StartButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/user/slide');
  };

  return (
    <button className="start-button" onClick={handleClick}>
      시작 버튼
    </button>
  );
}