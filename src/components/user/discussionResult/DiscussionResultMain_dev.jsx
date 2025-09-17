import { useNavigate } from "react-router-dom";
import resultExample from "@/assets/images/result_example.png"; // 배포 안전: 번들 포함

export default function DiscussionResultMain() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
    >
      <img
        src={resultExample}
        alt="결과 예시"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
        onClick={() => navigate('/user/loadResult', { replace: true })}
      />
    </div>
  );
}