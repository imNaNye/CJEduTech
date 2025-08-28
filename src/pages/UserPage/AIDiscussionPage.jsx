import { socket } from "@/api/chat";
import AiDiscussionMain from "../../components/user/aiDiscussion/AiDiscussionMain";
import PageHeader from '../../components/common/PageHeader.jsx';
import '../../components/user/aiDiscussion/aiDiscussion.css'
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export default function AIDiscussionPage(){
    const navigate = useNavigate();
    const GENERATE_RESULT_API = "/api/discussions/generate-result"; // 서버 토론 결과 생성 API
    const LOADING_ROUTE = "/user/discussionLoading"; // 로딩 페이지 라우트 (필요시 수정)

    const handleSkip = useCallback(async () => {
        try {
            await fetch(GENERATE_RESULT_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "skip" })
            });
        } catch (e) {
            console.error("Failed to request discussion result:", e);
        } finally {
            navigate(LOADING_ROUTE);
        }
    }, [navigate]);

    const handleRequestMent = useCallback(() => {
        socket.emit("ai:ment:request", { roomId: "general" });
    }, []);

    return (
        <div className="ai-discussion-page">
            <AiDiscussionMain/>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px" }}>
                <button className="skip-button" onClick={handleSkip}>
                    스킵
                </button>
                <button className="request-ment-button" onClick={handleRequestMent}>
                    AI 멘트 요청
                </button>
            </div>
        </div>
    );
}