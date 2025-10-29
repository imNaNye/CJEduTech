import { socket } from "@/api/chat";
import { useState,useEffect } from "react";
import { useRoundStep } from '@/contexts/RoundStepContext';
import AiDiscussionMain from "../../components/user/aiDiscussion/AiDiscussionMain";
import PageHeader from '../../components/common/PageHeader.jsx';
import '../../components/user/aiDiscussion/aiDiscussion.css'
// import { useNavigate } from "react-router-dom";
// import { useCallback } from "react";

import example1 from "@/assets/images/example1.png";
import example2 from "@/assets/images/example2.png";
import subject1 from "@/assets/images/subject/subject1.png";
import subject2 from "@/assets/images/subject/subject2.png";
import subject3 from "@/assets/images/subject/subject3.png";
import subject4 from "@/assets/images/subject/subject4.png";
import subject5 from "@/assets/images/subject/subject5.png";
import subject6 from "@/assets/images/subject/subject6.png";
import subject7 from "@/assets/images/subject/subject7.png";
import subject8 from "@/assets/images/subject/subject8.png";
import subject9 from "@/assets/images/subject/subject9.png";
import subject10 from "@/assets/images/subject/subject10.png";

export default function AIDiscussionPage(){
    // const navigate = useNavigate();
    // const GENERATE_RESULT_API = "/api/discussions/generate-result"; // 서버 토론 결과 생성 API
    // const LOADING_ROUTE = "/user/discussionResult"; // 로딩 페이지 라우트 (필요시 수정)

    const subjects = [subject1, subject2, subject3, subject4, subject5, subject6, subject7, subject8, subject9, subject10];
    const [overlayQueue, setOverlayQueue] = useState([]);
    const [autoTimerId, setAutoTimerId] = useState(null);

    const { round, setRound, step, setStep,videoId,setVideoId } = useRoundStep();

    const buildOverlayList = (vid) => {
        const list = [];
        // 1) 토론 주제 리스트 먼저 (비디오 아이디 매핑)
        const idx = Math.max(0, Math.min(9, Number(vid) || 0));
        list.push({ src: subjects[idx], auto: true }); // 자동 전환
        // 2) (videoId === 0)인 경우에만 토론 기능 가이드 2장 보여주기 (수동 전환)
        if (Number(vid) === 0 || Number(vid) === 3) {
            list.push({ src: example1, auto: false });
            list.push({ src: example2, auto: false });
        }
        return list;
    };

    useEffect(() => {
        setOverlayQueue(buildOverlayList(videoId));
    }, [videoId]);

    const handleOverlayClick = () => {
        setOverlayQueue((prev) => prev.slice(1));
    };

    const handleShowGuidesAgain = () => {
        // clear any running timer
        if (autoTimerId) {
            clearTimeout(autoTimerId);
            setAutoTimerId(null);
        }
        setOverlayQueue(buildOverlayList(videoId));
    };

    useEffect(() => {
        // Clear any previous timer
        if (autoTimerId) {
            clearTimeout(autoTimerId);
            setAutoTimerId(null);
        }
        // Set new timer only if current overlay is auto
        const current = overlayQueue[0];
        if (current && current.auto) {
            const id = setTimeout(() => {
                setOverlayQueue((prev) => prev.slice(1));
            }, 1800000); // 60 seconds
            setAutoTimerId(id);
        }
        return () => {
            if (autoTimerId) clearTimeout(autoTimerId);
        };
    }, [overlayQueue]);

    return (
        <div className="ai-discussion-page">
            {overlayQueue.length === 0 && (
                <button
                    type="button"
                    onClick={handleShowGuidesAgain}
                    style={{
                        position: 'fixed',
                        bottom: 12,
                        left: 12,
                        zIndex: 2100,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #ddd',
                        background: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                        color:'#333'
                    }}
                >
                    가이드
                </button>
            )}
            {overlayQueue.length > 0 ? (
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
                        cursor: 'pointer',
                    }}
                    onClick={handleOverlayClick}
                >
                    <img
                        src={overlayQueue[0].src}
                        alt={overlayQueue[0].auto ? "토론 주제 리스트" : "토론 기능 가이드"}
                        style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                </div>
            ) : (
                <AiDiscussionMain/>
            )}
        </div>
    );
}