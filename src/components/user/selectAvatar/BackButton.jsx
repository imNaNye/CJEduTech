import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/');
  };

  return (
    <button className="back-button" onClick={handleClick}>
      뒤로가기
    </button>
  );
}