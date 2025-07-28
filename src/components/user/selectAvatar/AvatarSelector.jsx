// src/components/selectAvatar/AvatarSelector.jsx
import AvatarCarousel from './AvatarCarousel.jsx';
import StartButton from './StartButton.jsx';
import './selectAvatar.css';

export default function AvatarSelector() {
  return (
    <div className="avatar-selector">
      <h3>캐릭터 설정</h3>
      <AvatarCarousel />
      <StartButton />
    </div>
  );
}