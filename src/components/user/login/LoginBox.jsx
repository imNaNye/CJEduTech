// src/components/user/login/LoginBox.jsx
import './login.css';
import LoginTitle from './LoginTitle';
import LoginInput from './LoginInput';
import SubmitButton from './SubmitButton';
import { useState } from 'react';
import { authApi } from '@/api/auth';
import nickIcon from '@/assets/images/login/nickIcon.svg';
import psIcon from '@/assets/images/login/psIcon.svg';
import { useNavigate } from 'react-router-dom';

export default function LoginBox() {
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const { user } = await authApi.login({ nickname, password });
      setMsg(`${user.nickname}님 환영합니다!`);
      navigate('/user/selectAvatar');
      
    } catch (err) {
      if (err.status === 401) setMsg('닉네임 또는 비밀번호가 올바르지 않습니다.');
      else if (err.status === 409) setMsg('이미 사용 중인 닉네임입니다.');
      else setMsg(err.message || '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-box" onSubmit={onSubmit}>
      <LoginTitle />
      <LoginInput
        label="닉네임을 입력하세요"
        icon={nickIcon}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <LoginInput
        label="비밀번호를 입력하세요"
        type="password"
        icon={psIcon}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <SubmitButton
        disabled={loading || !nickname.trim() || !password.trim()}
        text={loading ? '처리중...' : '시작하기'}
      />
      {msg && <p className="login-msg">{msg}</p>}
    </form>
  );
}