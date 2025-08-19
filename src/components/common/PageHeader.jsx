// src/components/common/PageHeader.jsx
import { useUser } from '../../contexts/UserContext';
import './PageHeader.css';

export default function PageHeader({ title }) {
  const { nickname, avatarUrl } = useUser(); {/* 유저 관련 정보는 contexts/UserContext에서 해당 함수를 통해 받아옴*/}

  return (
    <header className="page-header">
      <h2 className="title">{title}</h2>  {/* title은 props에서 가져옴 */}

      <div className="user-info">
        {nickname && <span className="nickname">{nickname}</span>}
      </div>
    </header>
  );
}