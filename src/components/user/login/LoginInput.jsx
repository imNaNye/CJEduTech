// src/components/login/LoginInput.jsx
import './login.css';

export default function LoginInput({ label, type = "text", icon, value, onChange }) {
  return (
    <div className="login-input">
      {icon && <img src={icon} alt="icon" />}
      <input
        type={type}
        placeholder={label}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
}