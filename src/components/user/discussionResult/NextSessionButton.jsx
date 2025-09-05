import { useNavigate } from "react-router-dom";

export default function NextSessionButton() {
  const navigate = useNavigate();

  return (
    <button className="next-session-button" onClick={() => navigate("/user/end")}>
      다음으로
    </button>
  );
}