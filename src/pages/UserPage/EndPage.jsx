import { useNavigate } from "react-router-dom";
import '../../components/user/end/end.css';

export default function EndPage(){
    const navigate = useNavigate();
    const handleClick = () => {
        navigate("/", { replace: true });
    };
    return (
        <div className="end-page" onClick={handleClick}>
        </div>
    );
}