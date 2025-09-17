import { useEffect, useRef, useState } from "react";
import { socket } from "@/api/chat";
import ChatTimer from "./ChatTimer";
import SubjectOverview from "./SubjectOverview";
import { useNavigate } from "react-router-dom";

import cake1 from '@/assets/images/discussion/cake_1.png';
import cake2 from '@/assets/images/discussion/cake_2.png';
import cake3 from '@/assets/images/discussion/cake_3.png';
import cake4 from '@/assets/images/discussion/cake_4.png';
import badge1 from '@/assets/images/discussion/badge_1_large.png';
import badge2 from '@/assets/images/discussion/badge_2_large.png';
import badge3 from '@/assets/images/discussion/badge_3_large.png';
import badge4 from '@/assets/images/discussion/badge_4_large.png';

const CAKES = { 1: cake1, 2: cake2, 3: cake3, 4: cake4 };
const BADGES = { 1: badge1, 2: badge2, 3: badge3, 4: badge4 };

const LABELS = ["정직", "창의", "존중", "열정"];

const getMyNick = () => {
  const n = localStorage.getItem("nickname");
  return n || "익명";
};

export default function ChatOverView(){
  const [totals, setTotals] = useState({
    정직: 0,
    창의: 0,
    존중: 0,
    열정: 0,
    totalMessages: 0,
    totalReactions: 0,
  });

  const [myTotals, setMyTotals] = useState({
    정직: 0,
    창의: 0,
    존중: 0,
    열정: 0,
    totalMessages: 0,
    totalReactions: 0,
  });

  const reactionsMapRef = useRef(new Map()); // messageId -> reactionsCount
  const aiLabelMapRef = useRef(new Map());   // messageId -> Set<label>

  const myReactionsMapRef = useRef(new Map()); // mine only
  const myAiLabelMapRef = useRef(new Map());   // mine only
  const myMessageIdsRef = useRef(new Set());   // mine only
  const myNickRef = useRef(getMyNick());
  const navigate = useNavigate();

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

      const nextMyReactionsMap = new Map();
      const nextMyAiLabelMap = new Map();
      const nextMyTotals = {
        정직: 0,
        창의: 0,
        존중: 0,
        열정: 0,
        totalMessages: 0,
        totalReactions: 0,
      };
      const nextMyIds = new Set();

      for (const m of messages) {
        const rc = Number(
          m.reactionsCount || (Array.isArray(m.reactedUsers) ? m.reactedUsers.length : 0)
        ) || 0;
        nextTotals.totalReactions += rc;
        nextReactionsMap.set(m.id, rc);

        const labelsArr = Array.isArray(m.aiLabels) && m.aiLabels.length
          ? m.aiLabels
          : (m.aiLabel ? [m.aiLabel] : []);
        const valid = labelsArr.filter(l => LABELS.includes(l));
        if (valid.length) {
          for (const l of valid) nextTotals[l] = (nextTotals[l] || 0) + 1;
          nextAiLabelMap.set(m.id, new Set(valid));
        }

        // mine only
        if (m.nickname === myNickRef.current) {
          nextMyTotals.totalMessages += 1;
          nextMyTotals.totalReactions += rc;
          nextMyReactionsMap.set(m.id, rc);
          if (valid.length) {
            for (const l of valid) nextMyTotals[l] = (nextMyTotals[l] || 0) + 1;
            nextMyAiLabelMap.set(m.id, new Set(valid));
          }
          nextMyIds.add(m.id);
        }
      }

      reactionsMapRef.current = nextReactionsMap;
      aiLabelMapRef.current = nextAiLabelMap;
      setTotals(nextTotals);

      myReactionsMapRef.current = nextMyReactionsMap;
      myAiLabelMapRef.current = nextMyAiLabelMap;
      myMessageIdsRef.current = nextMyIds;
      setMyTotals(nextMyTotals);
    };

    const handleNew = (msg) => {
      setTotals((t) => ({ ...t, totalMessages: t.totalMessages + 1 }));
      reactionsMapRef.current.set(msg.id, 0);

      if (msg.nickname === myNickRef.current) {
        setMyTotals((t) => ({ ...t, totalMessages: t.totalMessages + 1 }));
        myReactionsMapRef.current.set(msg.id, 0);
        myMessageIdsRef.current.add(msg.id);
      }
    };

    const handleReactionUpdate = ({ messageId, reactionsCount }) => {
      const prev = reactionsMapRef.current.get(messageId) || 0;
      const next = Number(reactionsCount || 0);
      reactionsMapRef.current.set(messageId, next);
      const delta = next - prev;
      if (delta !== 0) {
        setTotals((t) => ({ ...t, totalReactions: t.totalReactions + delta }));
      }

      if (myMessageIdsRef.current.has(messageId)) {
        const prevMy = myReactionsMapRef.current.get(messageId) || 0;
        myReactionsMapRef.current.set(messageId, next);
        const deltaMy = next - prevMy;
        if (deltaMy !== 0) {
          setMyTotals((t) => ({ ...t, totalReactions: t.totalReactions + deltaMy }));
        }
      }
    };

    const handleAi = ({ messageId, aiLabels, aiLabel }) => {
      const nextLabels = Array.isArray(aiLabels) && aiLabels.length
        ? aiLabels
        : (aiLabel ? [aiLabel] : []);
      const validNext = nextLabels.filter(l => LABELS.includes(l));

      const prevSet = aiLabelMapRef.current.get(messageId) || new Set();
      const nextSet = new Set(validNext);

      // Compute diffs
      const removed = [...prevSet].filter(l => !nextSet.has(l));
      const added = [...nextSet].filter(l => !prevSet.has(l));

      if (removed.length === 0 && added.length === 0) return;

      setTotals(t => {
        const n = { ...t };
        for (const l of removed) {
          if (LABELS.includes(l)) n[l] = Math.max(0, (n[l] || 0) - 1);
        }
        for (const l of added) {
          if (LABELS.includes(l)) n[l] = (n[l] || 0) + 1;
        }
        return n;
      });

      aiLabelMapRef.current.set(messageId, nextSet);

      if (myMessageIdsRef.current.has(messageId)) {
        const prevMySet = myAiLabelMapRef.current.get(messageId) || new Set();
        const removedMy = [...prevMySet].filter(l => !nextSet.has(l));
        const addedMy = [...nextSet].filter(l => !prevMySet.has(l));

        if (removedMy.length || addedMy.length) {
          setMyTotals(t => {
            const n = { ...t };
            for (const l of removedMy) {
              if (LABELS.includes(l)) n[l] = Math.max(0, (n[l] || 0) - 1);
            }
            for (const l of addedMy) {
              if (LABELS.includes(l)) n[l] = (n[l] || 0) + 1;
            }
            return n;
          });
          myAiLabelMapRef.current.set(messageId, nextSet);
        }
      }
    };

    socket.on("room:recent", handleRecent);
    socket.on("message:new", handleNew);
    socket.on("reaction:update", handleReactionUpdate);
    socket.on("message:ai", handleAi);
    socket.on('room:expired', ({ roomId }) => {
      try {
        sessionStorage.setItem('lastRoomId', roomId || '');
        sessionStorage.setItem('myNickname', myNickRef.current || '');
      } finally {
        navigate('/user/discussionResult');
      }
    });
    return () => {
      socket.off("room:recent", handleRecent);
      socket.off("message:new", handleNew);
      socket.off("reaction:update", handleReactionUpdate);
      socket.off("message:ai", handleAi);
    };
  }, []);

  // cake stacking: 1..4 → cake_1..cake_4, then add another layer for 5..8 (4 per layer)
  const renderCakes = (count, variant) => {
    const imgs = [];

    const render_count = count>20 ? 20 : count;

    if (count && count > 0) {
      const layers = Math.floor(render_count / 4); // full cake_4 layers to stack
      const remainder = render_count % 4;          // top layer remainder (1..3) or 0

      if (remainder > 0) {
        imgs.push(
          <img
            key={`${variant}-rem-${remainder}`}
            className="cake-img"
            src={CAKES[remainder]}
            alt={`${variant} 케이크(${remainder})`}
          />
        );
      }
      for (let i = 0; i < layers; i++) {
        imgs.push(
          <img
            key={`${variant}-full-${i}`}
            className="cake-img"
            src={CAKES[4]}
            alt={`${variant} 케이크(4)`}
          />
        );
      }
    }

    // Always return a stack container so vertical baseline is consistent across items
    return (
      <div className="cake-stack">
        {imgs}
      </div>
    );
  };

  return (
    <div className="chat-overview">
      <div className="overview-top">
        <ChatTimer/>
        <SubjectOverview totals={myTotals}/>
      </div>

      <section className="principle-icons">
        <div className="principle-icon">
          {renderCakes(totals['정직'], 'justice')}
          <img className="badge-img" src={BADGES[1]} alt="정직"/>
        </div>
        <div className="principle-icon">
          {renderCakes(totals['열정'], 'passion')}
          <img className="badge-img" src={BADGES[2]} alt="열정"/>
        </div>
        <div className="principle-icon">
          {renderCakes(totals['창의'], 'creed')}
          <img className="badge-img" src={BADGES[3]} alt="창의"/>
        </div>
        <div className="principle-icon">
          {renderCakes(totals['존중'], 'respect')}
          <img className="badge-img" src={BADGES[4]} alt="존중"/>
        </div>
        <div>
        </div>
      </section>
    </div>
  );
}