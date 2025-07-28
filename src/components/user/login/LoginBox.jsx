// src/components/login/LoginBox.jsx
import './login.css';
import LoginTitle from "./LoginTitle";
import LoginInput from "./LoginInput";
import SubmitButton from "./SubmitButton";

export default function LoginBox() {
  return (
    <div className="login-box">
      <LoginTitle />
      <LoginInput label="닉네임" />
      <LoginInput label="아이디" />
      <LoginInput label="비밀번호" type="password" />
      <SubmitButton />
    </div>
  );
}