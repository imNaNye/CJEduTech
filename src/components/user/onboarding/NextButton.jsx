import { useNavigate } from 'react-router-dom';
export default function NextButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/user/slide');
  };

  return (
    <button className="next-button" onClick={handleClick}>
      다음으로
    </button>
  );
}