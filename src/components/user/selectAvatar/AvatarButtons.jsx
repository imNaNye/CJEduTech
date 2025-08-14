import { useState } from "react";
import AvatarButton from "./AvatarButton";
import avatar1 from "@/assets/images/avatar/avatar1.png"
import avatar2 from "@/assets/images/avatar/avatar2.png"
import avatar3 from "@/assets/images/avatar/avatar3.png"
import avatar4 from "@/assets/images/avatar/avatar4.png"
import avatar5 from "@/assets/images/avatar/avatar5.png"
import avatar6 from "@/assets/images/avatar/avatar6.png"
import avatar7 from "@/assets/images/avatar/avatar7.png"
import avatar8 from "@/assets/images/avatar/avatar8.png"
import avatar9 from "@/assets/images/avatar/avatar9.png"
import avatar10 from "@/assets/images/avatar/avatar10.png"
import avatar11 from "@/assets/images/avatar/avatar11.png"
import avatar12 from "@/assets/images/avatar/avatar12.png"

export default function AvatarButtons() {
    const [selectedIndex, setSelectedIndex] = useState(null);
    const avatars = [
        avatar1, avatar2, avatar3, avatar4, avatar5, avatar6,
        avatar7, avatar8, avatar9, avatar10, avatar11, avatar12
    ];
    return (
        <div className="avatar-buttons">
            {avatars.map((src, index) => (
                <AvatarButton
                    key={index}
                    src={src}
                    onClick={() => setSelectedIndex(index)}
                    className={`avatar-button ${selectedIndex === index ? "selected" : ""}`}
                />
            ))}
        </div>
    );
}