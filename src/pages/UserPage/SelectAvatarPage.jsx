// src/pages/UserPage/SelectAvatarPage.jsx
import LoginBox from '../../components/user/login/LoginBox.jsx';
import AvatarSelector from '../../components/user/selectAvatar/AvatarSelector.jsx';
import '../../components/user/selectAvatar/selectAvatar.css';

export default function SelectAvatarPage() {
  return (
    <div className="select-avatar-page">
      <div className="select-avatar-layout">
        <LoginBox />
        <AvatarSelector />
      </div>
    </div>
  );
}