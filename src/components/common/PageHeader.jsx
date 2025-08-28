// src/components/common/PageHeader.jsx
import { useUser } from '../../contexts/UserContext';
import './PageHeader.css';

export default function PageHeader({ title, isShort}) {
  const { nickname, avatarUrl } = useUser(); {/* 유저 관련 정보는 contexts/UserContext에서 해당 함수를 통해 받아옴*/}

  return (
    <div className={isShort ? "page-header-short" : "page-header"}>
      <div className="title">{title}</div>  {/* title은 props에서 가져옴 */}

      <div className="user-info">
        {nickname && <span className="nickname">{nickname}</span>}
      </div>
    </div>
  );
}