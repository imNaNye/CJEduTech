import { useNavigate } from "react-router-dom";

export default function QuizResultPage(){
    const navigate = useNavigate();

    return (
        <div>
            <button className="skip-button" onClick={() => navigate('/user/video')}>
        SKIP
        </button>
        </div>
    );
}