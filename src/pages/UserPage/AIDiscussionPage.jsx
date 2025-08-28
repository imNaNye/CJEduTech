import AiDiscussionMain from "../../components/user/aiDiscussion/AiDiscussionMain";
import PageHeader from '../../components/common/PageHeader.jsx';
import '../../components/user/aiDiscussion/aiDiscussion.css'
import { useNavigate } from "react-router-dom";

export default function AIDiscussionPage(){
    const navigate = useNavigate();
    return (
        <div className="ai-discussion-page">
            <AiDiscussionMain/>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px" }}>
                <button className="skip-button" onClick={() => navigate('/user/discussionResult')}>
                    스킵
                </button>
            </div>
        </div>
    );
}