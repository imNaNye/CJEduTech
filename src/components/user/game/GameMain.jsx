// Lightweight client for game telemetry
const API_BASE = import.meta.env?.VITE_API_URL || ""; // e.g., https://api.example.com

async function postJSON(path, body) {
  console.log(API_BASE);
  const url = `${API_BASE}/api/game/${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }
    return await res.json().catch(() => ({}));
  } catch (err) {
    console.error(`[GameService] POST ${path} failed:`, err);
    throw err;
  }
}

export const GameService = {
  /** Notify server that a player has started the game */
  start({ nickname, sessionId, startedAt }) {
    return postJSON("start", { nickname, sessionId, startedAt });
  },
  /** Submit final trait classification results */
  submit({ nickname, sessionId, selectionsByCategory, mergedByTrait, submittedAt }) {
    return postJSON("submit", {
      nickname,
      sessionId,
      selectionsByCategory,
      mergedByTrait,
      submittedAt,
    });
  },
};

import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStep } from '../../../contexts/RoundStepContext';
import { useUser } from "../../../contexts/UserContext";
import guide1 from "@/assets/images/game/guide1.png";
import "./game.css";

// 4 인재상 키
const TRAITS = [
  { key: "integrity", label: "정직" },
  { key: "passion", label: "열정" },
  { key: "creativity", label: "창의" },
  { key: "respect", label: "존중" },
];
const TRAIT_DESCS = {
  integrity: "비효율과 부정을 용납하지 않는다.",
  passion: "최고와 완벽을 추구한다.",
  creativity: "끊임없이 변화하고 혁신한다.",
  respect: "서로 이해하고 배려한다.",
};

// 게임 카테고리(인성 → 태도 → 기능)
const CATEGORIES = [
  {
    key: "personal",
    label: "인성적 요소",
    color: "#ffefe4",
    items: [
      { id: "이해심", desc: "이런 저런 상황과 사람은 늘 있을 수 있다고 받아들이는 여유" },
      { id: "유머감각", desc: "분위기를 부드럽게 전환시킬 수 있는 재치있는 표현력" },
      { id: "끈기", desc: "주어진 과업과 직무를 쉽게 포기하지 않고 끝까지 해내는 힘" },
      { id: "성실함", desc: "맡은 일을 끝까지 책임지고 완성도 높게 수행하는 자세" },
      { id: "정직함", desc: "문제를 숨기지 않고 해결을 위해 최선을 다하는 자세" },
      { id: "배려심", desc: "고객, 동료 등의 입장을 헤아리고 먼저 생각하는 마음" },
      { id: "책임감", desc: "고객요청에 스스로 책임지고 마무리하는 태도" },
      { id: "절제력", desc: "스트레스 상황에 감정이나 말, 행동을 자제하는 힘" },
    ],
  },
  {
    key: "attitude",
    label: "태도적 요소",
    color: "#ffe6d5",
    items: [
      { id: "단호함", desc: "어느 경우에도 원칙과 규정을 잘 지키며 흔들리지 않는 태도" },
      { id: "신중함", desc: "실수를 줄이고 일의 완성도를 높이기 위한 세심한 판단과 태도" },
      { id: "유연함", desc: "고정된 방식에 갇히지 않고 상황 변화에 적응하는 능력" },
      { id: "부지런함", desc: "맡은 일을 한 발 앞서 준비하는 태도" },
      { id: "관찰력", desc: "상황 변화나 고객, 팀 동료 특성을 빠르게 파악하는 능력" },
    ],
  },
  {
    key: "functional",
    label: "기능적 요소",
    color: "#ffe0a8",
    items: [
      { id: "위기관리능력", desc: "예상치 못한 돌발 상황을 침착하게 수습하는 능력" },
      { id: "시간관리능력", desc: "제한된 시간 안에 효율적으로 일처리를 조율하는 능력" },
      { id: "설득력", desc: "상대를 납득시키고 긍정적으로 이끄는 능력" },
      { id: "팀워크능력", desc: "팀원 간 협업에 본인의 역할을 잘 인지하고 발휘하는 능력" },
      { id: "창의성", desc: "틀에 얽매이지 않고 새롭고 효과적인 해결책을 제시하는 능력" },
      { id: "다재다능함", desc: "다양한 업무를 효율적이고 유연하게 처리할 수 있는 능력" },
    ],
  },
];

// selections 구조: { personal: {integrity: [], passion: [], ...}, attitude: {...}, functional: {...} }
const makeEmptySelections = () =>
  CATEGORIES.reduce((acc, c) => {
    acc[c.key] = TRAITS.reduce((ta, t) => ({ ...ta, [t.key]: [] }), {});
    return acc;
  }, {});

export default function GameMain() {
  const {isAdmin} = useUser();
  const [step, setLevel] = useState("guide"); // guide | play | mid | final | wait
  const [phaseIdx, setPhaseIdx] = useState(0); // 0: 인성, 1: 태도, 2: 기능
  const [hovered, setHovered] = useState(null); // {id}
  const [selections, setSelections] = useState(makeEmptySelections);
  const [activeTraitInfo, setActiveTraitInfo] = useState(null);

  const dragGhostRef = useRef(null);

  const navigate = useNavigate();
  const { round, setRound, setStep } = useRoundStep();

  // stable session id for this play
  const sessionIdRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  const getNickname = () =>
    localStorage.getItem("nickname") ||
    localStorage.getItem("userNickname") ||
    localStorage.getItem("user_name") ||
    "게스트";

  const currentCategory = CATEGORIES[phaseIdx];

  // 현재 카테고리에서 아직 배치되지 않은 아이템
  const assignedIds = useMemo(() => {
    const m = new Set();
    const catSel = selections[currentCategory.key];
    TRAITS.forEach((t) => catSel[t.key].forEach((id) => m.add(id)));
    return m;
  }, [selections, currentCategory.key]);

  const remainingItems = useMemo(() => {
    return currentCategory.items.filter((i) => !assignedIds.has(i.id));
  }, [currentCategory.items, assignedIds]);


  const createDragGhost = (text) => {
    const el = document.createElement('div');
    el.className = 'cjgame-drag-ghost';
    el.textContent = text;
    document.body.appendChild(el);
    return el;
  };

  const onDragStart = (e, itemId) => {
    setHovered(null);
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        id: itemId,
        categoryKey: currentCategory.key,
      })
    );
    // Use custom drag image that shows the name (id)
    const ghost = createDragGhost(itemId);
    dragGhostRef.current = ghost;
    // center the drag image under cursor
    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);
  };

  const onDropToTrait = (e, traitKey) => {
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    const payload = JSON.parse(data);
    const { id, categoryKey } = payload;
    if (categoryKey !== currentCategory.key) return; // 다른 단계의 드롭 무시

    setSelections((prev) => {
      // 이미 들어가 있으면 무시
      const already = new Set(
        TRAITS.flatMap((t) => prev[categoryKey][t.key])
      );
      if (already.has(id)) return prev;

      const next = structuredClone(prev);
      next[categoryKey][traitKey].push(id);
      return next;
    });
  };

  const removeFromTrait = (id) => {
    setSelections((prev) => {
      const next = structuredClone(prev);
      TRAITS.forEach((t) => {
        next[currentCategory.key][t.key] = next[currentCategory.key][t.key].filter(
          (x) => x !== id
        );
      });
      return next;
    });
  };

  const allPlaced = remainingItems.length === 0;

  const goNextFromPlay = () => {
    if (phaseIdx < CATEGORIES.length - 1) {
      setPhaseIdx((v) => v + 1);
      setLevel("play");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setLevel("final");
    }
  };


  const restart = () => {
    setSelections(makeEmptySelections());
    setPhaseIdx(0);
    setLevel("guide");
    setActiveTraitInfo(null);
  };

  // 가이드 화면 단일 페이지
  if (step === "guide") {
    return (
      <div
        className="cjgame-wrap cjgame-guide-screen"
        onClick={async () => {
          setLevel("play");
          try {
            await GameService.start({
              nickname: getNickname(),
              sessionId: sessionIdRef.current,
              startedAt: Date.now(),
            });
          } catch (e) {
            console.warn("[Game] start notify failed", e);
          }
        }}
      >
        <div className="cjgame-guide-image">
          <img alt="guide1" src={guide1} />
        </div>
        <p className="cjgame-guide-hint">화면을 클릭하면 시작합니다</p>
      </div>
    );
  }


  // 최종결과(전체 합산)
  if (step === "final") {
    const merged = TRAITS.reduce((acc, t) => {
      acc[t.key] = [
        ...selections.personal[t.key],
        ...selections.attitude[t.key],
        ...selections.functional[t.key],
      ];
      return acc;
    }, {});

    return (
      <div className="cjgame-wrap cjgame-final-screen">
        <h2 className="cjgame-title">나의 분류 결과</h2>
        <p className="cjgame-subtitle">내가 각 인재상에 배치한 기본 역량을 확인해 주세요.</p>
        <div className="cjgame-result-grid">
          {TRAITS.map((t) => (
            <div key={t.key} className={`cjgame-result-card trait-${t.key}`}>
              <div className={`cjgame-result-card-header trait-${t.key}`}>{t.label}</div>
              <div className="cjgame-result-chips">
                {merged[t.key].map((id) => (
                  <span
                    key={id}
                    className={`cjgame-chip cjgame-chip--small cjgame-chip--${t.key}`}
                    title={id}
                  >
                    {id}
                  </span>
                ))}
                {merged[t.key].length === 0 && (
                  <div className="cjgame-muted">(선택 없음)</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="cjgame-final-actions">
          <button className="cjgame-btn cjgame-return" onClick={restart}>
            다시하기
          </button>
          <button
            className="cjgame-btn cjgame-primary"
            onClick={async () => {
              // prepare payloads
              const selectionsByCategory = selections;
              const mergedByTrait = TRAITS.reduce((acc, t) => {
                acc[t.key] = [
                  ...selections.personal[t.key],
                  ...selections.attitude[t.key],
                  ...selections.functional[t.key],
                ];
                return acc;
              }, {});
              try {
                await GameService.submit({
                  nickname: getNickname(),
                  sessionId: sessionIdRef.current,
                  selectionsByCategory,
                  mergedByTrait,
                  submittedAt: Date.now(),
                });
              } catch (e) {
                console.warn("[Game] submit failed", e);
              } finally {
                setLevel("wait");
              }
            }}
          >
            최종 제출하기
          </button>
        </div>
      </div>
    );
  }

  // 대기 화면
  if (step === "wait") {
    return (
      <div className="cjgame-wrap cjgame-wait-screen">
        <h2 className="cjgame-title">결과 확인 완료</h2>
        <p className="cjgame-subtitle">다음 페이지로 이동할 준비가 되셨나요?</p>
        <button
          className="cjgame-btn cjgame-primary"
          onClick={() => {
            console.log("다음 페이지로 이동 트리거");
            setStep(4);
            if (isAdmin){
              navigate('/admin/roundIndicator');
            } else{
            navigate("/user/roundIndicator", { replace: true });
            }
          }}
        >
          다음으로
        </button>
      </div>
    );
  }

  // === 메인 플레이 화면 ===
  return (
    <div className="cjgame-wrap cjgame-play-screen">
      <header className="cjgame-topbar">

        <div className="cjgame-phases">
          {CATEGORIES.map((c, i) => (
            <span
              key={c.key}
              className={`cjgame-phase-dot ${i === phaseIdx ? "cjgame-active" : i < phaseIdx ? "cjgame-done" : ""}`}
            />
          ))}
        </div>
      </header>

      <h2 className="cjgame-title cjgame-center">기본 역량을 인재상으로 드래그해서 배치하세요</h2>
      <p className="cjgame-subtitle cjgame-center">버튼을 클릭하면 설명을 볼 수 있어요</p>

      {/* 중앙: 기본 역량 바구니 (점선 네모 + 상단 라벨) */}
      {
        // --- Basket layout calculations (centered multi-rows) ---
        // (inserted before basket section)
      }
      {
        (() => {
          const totalItems = remainingItems.length;
          const perRow = totalItems >= 7 ? Math.ceil(totalItems / 3) : (totalItems >= 4 ? Math.ceil(totalItems / 2) : totalItems);
          const rows = Math.max(1, Math.ceil(totalItems / Math.max(1, perRow)));
          const spacingX = 190; // px between items horizontally
          const spacingY = 70;  // px between rows
          const chipBaseH = 20; // approximate chip height (min-height 44 + paddings)
          const basketHeight = rows * chipBaseH + (rows - 1) * spacingY;
          return (
            <section className="cjgame-basket" aria-label="기본 역량 바구니">
              <div className="cjgame-basket-label">{currentCategory.label}</div>
              <div className="cjgame-basket-grid" style={{ position: 'relative', height: Math.max(120, basketHeight) }}>
                {remainingItems.map((item, idx) => {
                  const row = Math.floor(idx / Math.max(1, perRow));
                  const col = idx % Math.max(1, perRow);
                  const colsThisRow = (row === rows - 1) ? (totalItems - Math.max(1, perRow) * (rows - 1)) : Math.max(1, perRow);
                  const rowWidth = (colsThisRow - 1) * spacingX;
                  const offsetX = (col * spacingX) - rowWidth / 2; // center of this row at 0
                  const totalHeight = (rows - 1) * spacingY;
                  const offsetY = (row * spacingY) - totalHeight / 2; // center rows around 0
                  return (
                    <div
                      key={item.id}
                      className="cjgame-chip-placer"
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))` }}
                    >
                      <button
                        className={`cjgame-chip cjgame-chip--flip ${hovered === item.id ? 'is-desc' : ''}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.id)}
                        onDragEnd={() => { if (dragGhostRef.current) { document.body.removeChild(dragGhostRef.current); dragGhostRef.current = null; } }}
                        onClick={() => setHovered((v) => (v === item.id ? null : item.id))}
                        title="드래그하거나 클릭해서 설명 보기"
                      >
                        <span className="cjgame-chip-face cjgame-chip-front">{item.id}</span>
                        <span className="cjgame-chip-face cjgame-chip-back">{item.desc}</span>
                      </button>
                    </div>
                  );
                })}
                {remainingItems.length === 0 && (
                  <div className="cjgame-muted cjgame-center">모든 항목을 배치했습니다.</div>
                )}
              </div>
            </section>
          );
        })()
      }

      {/* 하단: 4개 인재상 드롭 영역 */}

      <section className="cjgame-buckets">
        {TRAITS.map((t) => (
          <div
            key={t.key}
            className={`cjgame-bucket trait-${t.key}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropToTrait(e, t.key)}
          >
            <div className="cjgame-bucket-title">
              {t.label}
            </div>
            <div className="cjgame-bucket-hint">{TRAIT_DESCS[t.key]}</div>
            <div className="cjgame-bucket-body">
              {selections[currentCategory.key][t.key].map((id) => (
                <span
                  key={id}
                  className={`cjgame-chip cjgame-chip--small cjgame-chip--${t.key}`}
                  onClick={() => removeFromTrait(id)}
                  title="클릭하면 제거"
                >
                  {id}
                </span>
              ))}
              {selections[currentCategory.key][t.key].length === 0 && (
                <div className="cjgame-muted">여기로 드래그</div>
              )}
            </div>
          </div>
        ))}
        <div className=""></div>
      </section>

      <footer className="cjgame-footer">
        <button className="cjgame-btn cjgame-primary" disabled={!allPlaced} onClick={goNextFromPlay}>
          {phaseIdx < CATEGORIES.length - 1 ? "다음 단계로" : "최종 결과로"}
        </button>
      </footer>
    </div>
  );
}