import { useEffect, useRef, useState } from "react";
import { socket } from "@/api/chat";
import ChatTimer from "./ChatTimer";
import SubjectOverview from "./SubjectOverview";

const LABELS = ["정직", "창의", "존중", "열정"];

export default function ChatOverView(){
  const [totals, setTotals] = useState({
    정직: 0,
    창의: 0,
    존중: 0,
    열정: 0,
    totalMessages: 0,
    totalReactions: 0,
  });

  const reactionsMapRef = useRef(new Map()); // messageId -> reactionsCount
  const aiLabelMapRef = useRef(new Map());   // messageId -> aiLabel

  useEffect(() => {
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
        totalReactions: 0,
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

    const handleNew = (msg) => {
      setTotals((t) => ({ ...t, totalMessages: t.totalMessages + 1 }));
      reactionsMapRef.current.set(msg.id, 0);
    };

    const handleReactionUpdate = ({ messageId, reactionsCount }) => {
      const prev = reactionsMapRef.current.get(messageId) || 0;
      const next = Number(reactionsCount || 0);
      reactionsMapRef.current.set(messageId, next);
      const delta = next - prev;
      if (delta !== 0) {
        setTotals((t) => ({ ...t, totalReactions: t.totalReactions + delta }));
      }
    };

    const handleAi = ({ messageId, aiLabel }) => {
      if (!LABELS.includes(aiLabel)) return;
      const prevLabel = aiLabelMapRef.current.get(messageId);
      if (prevLabel === aiLabel) return;

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

  // cake stacking: 1..4 → cake_1..cake_4, then add another layer for 5..8 (4 per layer)
  const renderCakes = (count, variant) => {
    if (!count || count <= 0) return null;
    const layers = Math.floor(count / 4); // full cake_4 layers to stack
    const remainder = count % 4;          // top layer remainder (1..3) or 0

    const imgs = [];
    if (remainder > 0) {
      imgs.push(
        <img
          key={`${variant}-rem-${remainder}`}
          className="cake-img"
          src={`/src/assets/images/discussion/cake_${remainder}.png`}
          alt={`${variant} 케이크(${remainder})`}
        />
      );
    }
    for (let i = 0; i < layers; i++) {
      imgs.push(
        <img
          key={`${variant}-full-${i}`}
          className="cake-img"
          src={`/src/assets/images/discussion/cake_4.png`}
          alt={`${variant} 케이크(4)`}
        />
      );
    }

    return imgs;
  };

  return (
    <div className="chat-overview">
      <div className="overview-top">
        <ChatTimer/>
        <SubjectOverview totals={totals}/>
      </div>

      <section className="principle-icons">
        <div className="principle-icon">
          {renderCakes(totals['정직'], 'justice')}
          <img className="badge-img" src={`/src/assets/images/discussion/badge_1.png`} alt="정직"/>
        </div>
        <div className="principle-icon">
          {renderCakes(totals['열정'], 'passion')}
          <img className="badge-img" src={`/src/assets/images/discussion/badge_2.png`} alt="열정"/>
        </div>
        <div className="principle-icon">
          {renderCakes(totals['창의'], 'creed')}
          <img className="badge-img" src={`/src/assets/images/discussion/badge_3.png`} alt="창의"/>
        </div>
        <div className="principle-icon">
          {renderCakes(totals['존중'], 'respect')}
          <img className="badge-img" src={`/src/assets/images/discussion/badge_4.png`} alt="존중"/>
        </div>
      </section>
    </div>
  );
}