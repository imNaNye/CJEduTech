import { socket } from "@/api/chat";
import { useState } from "react";
import { useRoundStep } from '@/contexts/RoundStepContext';
import AiDiscussionMain from "../../components/user/aiDiscussion/AiDiscussionMain";
import PageHeader from '../../components/common/PageHeader.jsx';
import '../../components/user/aiDiscussion/aiDiscussion.css'
// import { useNavigate } from "react-router-dom";
// import { useCallback } from "react";

import example1 from "@/assets/images/example1.png";
import example2 from "@/assets/images/example2.png";

export default function AIDiscussionPage(){
    // const navigate = useNavigate();
    // const GENERATE_RESULT_API = "/api/discussions/generate-result"; // 서버 토론 결과 생성 API
    // const LOADING_ROUTE = "/user/discussionResult"; // 로딩 페이지 라우트 (필요시 수정)

    const [overlayImages, setOverlayImages] = useState([example1, example2]);

    const { round, setRound, step, setStep } = useRoundStep();
    const handleOverlayClick = () => {
        setOverlayImages((prev) => prev.slice(1));
    };

    const handleSkip = () => {
        socket.emit('room:end', { });
    };

    const handleRequestMent = () => {
        socket.emit("ai:ment:request", { });
    };

    return (
        <div className="ai-discussion-page">
            {overlayImages.length > 0 ? (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "black",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2000,
                    }}
                    onClick={handleOverlayClick}
                >
                    <img
                        src={overlayImages[0]}
                        alt="토론 채팅방 예시"
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                </div>
            ) : (
                <>

                                       
                    <AiDiscussionMain/>

                </>
            )}
        </div>
    );
}