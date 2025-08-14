// src/components/login/SubmitButton.jsx
import { useNavigate } from 'react-router-dom';
import './login.css';
export default function SubmitButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/user/selectAvatar');
  };

  return (
    <button className="login-submit" onClick={handleClick}>
      로그인
    </button>
  );
}