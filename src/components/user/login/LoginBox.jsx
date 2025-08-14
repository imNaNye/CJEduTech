// src/components/login/LoginBox.jsx
import './login.css';
import LoginTitle from "./LoginTitle";
import LoginInput from "./LoginInput";
import SubmitButton from "./SubmitButton";

export default function LoginBox() {
  return (
    <div className="login-box">
      <LoginTitle />
      <LoginInput label="닉네임을 입력하세요" icon = 'src/assets/images/login/nickIcon.svg'/>
      <LoginInput label="비밀번호를 입력하세요" type="password" icon = 'src/assets/images/login/psIcon.svg'/>
      <SubmitButton />
    </div>
  );
}