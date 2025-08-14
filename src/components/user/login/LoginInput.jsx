// src/components/login/LoginInput.jsx
import './login.css';
export default function LoginInput({ label, type = "text", icon }) {
  return (
    <div className="login-input">
      <img src = {icon}></img>
      <input type={type} placeholder={label} />
    </div>
  );
}