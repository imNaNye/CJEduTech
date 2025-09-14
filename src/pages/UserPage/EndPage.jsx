import { useNavigate } from "react-router-dom";
import endExample from "@/assets/images/end_example.png";
import EndMessage from "../../components/user/end/endmessage";
import '../../components/user/end/end.css';

export default function EndPage(){
    const navigate = useNavigate();
    const handleClick = () => {
        navigate("/", { replace: true });
    };
    return (
        <div className="end-page" onClick={handleClick}>
            <img
                src={endExample}
                alt="End Example"
                style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
            />
        </div>
    );
}