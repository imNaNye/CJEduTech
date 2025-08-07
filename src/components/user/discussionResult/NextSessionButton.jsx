import { useNavigate } from "react-router-dom";

export default function NextSessionButton() {
  const navigate = useNavigate();

  return (
    <button className="next-session-button" onClick={() => navigate("/user/end")}>
      종료하기\(다음세션\)
    </button>
  );
}