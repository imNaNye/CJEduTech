// src/components/user/login/SubmitButton.jsx
import './login.css';

export default function SubmitButton({ text = '로그인', disabled = false }) {
  return (
    <button
      type="submit"
      className="login-submit"
      disabled={disabled}
    >
      {text}
    </button>
  );
}