// src/components/user/selectAvatar/AvatarSelector.jsx
import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import ActionButtons from './ActionButtons.jsx';
import AvatarButtons from './AvatarButtons.jsx';
import './selectAvatar.css';

// API 유틸 (http.js 기반)
const API = import.meta.env.VITE_API_URL;

export default function AvatarSelector() {
  const [selected, setSelected] = useState(null); // '1'..'12' 문자열 또는 null
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const { setAvatarUrl } = useUser();

  // 현재 사용자 아바타 불러오기
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/user/me`, { credentials: 'include' });
        if (!res.ok) return; // 비로그인 등은 조용히 무시
        const data = await res.json();
        if (data?.user?.avatar) setSelected(String(data.user.avatar));
      } catch (_) {}
    })();
  }, []);

  // 아바타 저장
  const saveAvatar = async () => {
    if (!selected) {
      setMsg('아바타를 선택해주세요.');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      const res = await fetch(`${API}/api/user/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ avatar: String(selected) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body?.message || '저장에 실패했습니다.');
        return;
      }
      setAvatarUrl(String(selected));
      localStorage.setItem('avatarUrl', String(selected));
      setMsg('아바타가 저장되었습니다!');
    } catch (e) {
      setMsg('서버 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="avatar-selector">
      <h3>프로필 선택</h3>
      <AvatarButtons selected={selected} onSelect={setSelected} />

      {msg && <p className="avatar-msg" role="alert">{msg}</p>}

      <ActionButtons />
    </div>
  );
}