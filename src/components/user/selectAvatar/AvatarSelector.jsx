// src/components/selectAvatar/AvatarSelector.jsx
import ActionButtons from './ActionButtons.jsx';
import AvatarButtons from './AvatarButtons.jsx';
import './selectAvatar.css';

export default function AvatarSelector() {
  return (
    <div className="avatar-selector">
      <h3>프로필 선택</h3>
      <AvatarButtons />
      <ActionButtons/>
    </div>
  );
}