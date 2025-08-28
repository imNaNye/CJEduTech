import { useEffect, useRef, useState } from "react";
import { socket } from "@/api/chat";

const LABELS = ["정직", "창의", "존중", "열정"];

export default function SubjectOverview() {
  // 총계 상태
  const [totals, setTotals] = useState({
    정직: 0,
    창의: 0,
    존중: 0,
    열정: 0,
    totalMessages: 0,
    totalReactions: 0
  });

  // 메시지별 상태(증분 업데이트를 위한 참조 맵)
  const reactionsMapRef = useRef(new Map()); // messageId -> reactionsCount
  const aiLabelMapRef = useRef(new Map());   // messageId -> aiLabel

  useEffect(() => {
    // 초기/최근 상태 수신 → 전체 집계 초기화
    const handleRecent = (payload) => {
      const messages = payload?.messages || [];

      const nextReactionsMap = new Map();
      const nextAiLabelMap = new Map();
      const nextTotals = {
        정직: 0,
        창의: 0,
        존중: 0,
        열정: 0,
        totalMessages: messages.length,
        totalReactions: 0
      };

      for (const m of messages) {
        const rc = Number(
          m.reactionsCount || (Array.isArray(m.reactedUsers) ? m.reactedUsers.length : 0)
        ) || 0;
        nextTotals.totalReactions += rc;
        nextReactionsMap.set(m.id, rc);

        const label = m.aiLabel;
        if (LABELS.includes(label)) {
          nextTotals[label] += 1;
          nextAiLabelMap.set(m.id, label);
        }
      }

      reactionsMapRef.current = nextReactionsMap;
      aiLabelMapRef.current = nextAiLabelMap;
      setTotals(nextTotals);
    };

    // 새 메시지 → 총 채팅 수 +1, 반응 초기값 0
    const handleNew = (msg) => {
      setTotals((t) => ({ ...t, totalMessages: t.totalMessages + 1 }));
      reactionsMapRef.current.set(msg.id, 0);
      // AI 라벨은 아직 없음
    };

    // 반응 업데이트 → 총 반응 수 증분 반영
    const handleReactionUpdate = ({ messageId, reactionsCount }) => {
      const prev = reactionsMapRef.current.get(messageId) || 0;
      const next = Number(reactionsCount || 0);
      reactionsMapRef.current.set(messageId, next);
      const delta = next - prev;
      if (delta !== 0) {
        setTotals((t) => ({ ...t, totalReactions: t.totalReactions + delta }));
      }
    };

    // AI 분류 결과 → 라벨 카운트 이동
    const handleAi = ({ messageId, aiLabel }) => {
      if (!LABELS.includes(aiLabel)) return;
      const prevLabel = aiLabelMapRef.current.get(messageId);
      if (prevLabel === aiLabel) return; // 변화 없음

      setTotals((t) => {
        const next = { ...t };
        if (prevLabel && LABELS.includes(prevLabel)) {
          next[prevLabel] = Math.max(0, next[prevLabel] - 1);
        }
        next[aiLabel] = (next[aiLabel] || 0) + 1;
        return next;
      });
      aiLabelMapRef.current.set(messageId, aiLabel);
    };

    socket.on("room:recent", handleRecent);
    socket.on("message:new", handleNew);
    socket.on("reaction:update", handleReactionUpdate);
    socket.on("message:ai", handleAi);

    return () => {
      socket.off("room:recent", handleRecent);
      socket.off("message:new", handleNew);
      socket.off("reaction:update", handleReactionUpdate);
      socket.off("message:ai", handleAi);
    };
  }, []);

  return (
    <div className="summary-box">
      <span className="summary-item j"><i className="icon"/>+{totals['정직']}건</span>
      <span className="summary-item p"><i className="icon"/>+{totals['열정']}건</span>
      <span className="summary-item c"><i className="icon"/>+{totals['창의']}건</span>
      <span className="summary-item r"><i className="icon"/>+{totals['존중']}건</span>
      <span className="summary-item lk"><i className="icon"/>+{totals.totalReactions}건</span>
      <span className="summary-item ch"><i className="icon"/>+{totals.totalMessages}건</span>
    </div>
  );
}