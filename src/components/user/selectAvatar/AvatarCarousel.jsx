// src/components/selectAvatar/AvatarCarousel.jsx
import ArrowButton from './ArrowButton';
import AvatarImage from './AvatarImage';

export default function AvatarCarousel() {
  return (
    <div className="avatar-carousel">
      <ArrowButton direction="left" />
      <AvatarImage src="/avatars/avatar1.png" />
      <ArrowButton direction="right" />
      <div className="avatar-indicator">● ● ● ● ●</div>
    </div>
  );
}