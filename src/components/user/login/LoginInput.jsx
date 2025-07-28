// src/components/login/LoginInput.jsx
import './login.css';
export default function LoginInput({ label, type = "text" }) {
  return (
    <div className="login-input">
      <label>{label}</label>
      <input type={type} placeholder={label} />
    </div>
  );
}