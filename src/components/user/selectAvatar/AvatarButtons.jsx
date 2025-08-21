import AvatarButton from "./AvatarButton";
import avatar1 from "@/assets/images/avatar/avatar1.png";
import avatar2 from "@/assets/images/avatar/avatar2.png";
import avatar3 from "@/assets/images/avatar/avatar3.png";
import avatar4 from "@/assets/images/avatar/avatar4.png";
import avatar5 from "@/assets/images/avatar/avatar5.png";
import avatar6 from "@/assets/images/avatar/avatar6.png";
import avatar7 from "@/assets/images/avatar/avatar7.png";
import avatar8 from "@/assets/images/avatar/avatar8.png";
import avatar9 from "@/assets/images/avatar/avatar9.png";
import avatar10 from "@/assets/images/avatar/avatar10.png";
import avatar11 from "@/assets/images/avatar/avatar11.png";
import avatar12 from "@/assets/images/avatar/avatar12.png";

/**
 * AvatarButtons
 * - Controlled component (no local state)
 * - Props:
 *   - selected: string | number | null  (e.g., '1'..'12')
 *   - onSelect: (value: string) => void
 */
export default function AvatarButtons({ selected = null, onSelect = () => {} }) {
  // Map image source with its id (string) to align with backend `{ avatar: '1' }`
  const avatars = [
    { id: '1', src: avatar1 },
    { id: '2', src: avatar2 },
    { id: '3', src: avatar3 },
    { id: '4', src: avatar4 },
    { id: '5', src: avatar5 },
    { id: '6', src: avatar6 },
    { id: '7', src: avatar7 },
    { id: '8', src: avatar8 },
    { id: '9', src: avatar9 },
    { id: '10', src: avatar10 },
    { id: '11', src: avatar11 },
    { id: '12', src: avatar12 },
  ];

  const selectedStr = selected != null ? String(selected) : null;

  return (
    <div className="avatar-buttons" role="list">
      {avatars.map(({ id, src }) => (
        <AvatarButton
          key={id}
          src={src}
          onClick={() => onSelect(id)}
          className={`avatar-button ${selectedStr === id ? "selected" : ""}`}
          aria-pressed={selectedStr === id}
          aria-label={`아바타 ${id}`}
          data-avatar-id={id}
        />
      ))}
    </div>
  );
}