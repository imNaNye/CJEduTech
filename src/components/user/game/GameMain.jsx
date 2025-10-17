import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStep } from '../../../contexts/RoundStepContext';
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
  integrity: "사실과 원칙에 기반해 투명하게 행동하고 신뢰를 쌓는 태도.",
  passion: "목표를 향해 주도적으로 몰입하고 끈기 있게 실행하는 태도.",
  creativity: "고정관념을 넘어 새로운 관점과 해법을 제시하는 태도.",
  respect: "타인의 다양성과 권리를 인정하고 배려하는 태도.",
};
// 게임 카테고리(인성 → 태도 → 기능)
const CATEGORIES = [
  {
    key: "personal",
    label: "인성적 요소",
    color: "#ffefe4",
    items: [
      { id: "이해심", desc: "상대의 입장을 이해하고 배려하는 마음." },
      { id: "유머감각", desc: "분위기를 부드럽게 전환시키는 표현력." },
      { id: "끈기", desc: "끝까지 포기하지 않고 해내는 태도." },
      { id: "성실함", desc: "주어진 일을 꾸준히 책임감 있게 수행." },
      { id: "다재다능함", desc: "여러 업무를 유연히 소화하는 역량." },
      { id: "배려심", desc: "타인을 먼저 생각하고 양보하는 태도." },
      { id: "관찰력", desc: "상황의 핵심을 빠르게 포착." },
      { id: "단호함", desc: "원칙에 따라 과감히 의사결정." },
    ],
  },
  {
    key: "attitude",
    label: "태도적 요소",
    color: "#ffe6d5",
    items: [
      { id: "정직함", desc: "사실에 근거해 투명하게 행동." },
      { id: "책임감", desc: "결과를 스스로 감당하려는 자세." },
      { id: "절제력", desc: "감정과 욕구를 조절하는 힘." },
      { id: "부지런함", desc: "주도적으로 움직이고 실행." },
      { id: "신중함", desc: "충분한 검토 후 결정을 내림." },
    ],
  },
  {
    key: "functional",
    label: "기능적 요소",
    color: "#ffe0a8",
    items: [
      { id: "위기관리능력", desc: "예상 밖 상황을 침착히 수습." },
      { id: "시간관리능력", desc: "우선순위와 일정 운용 능력." },
      { id: "설득력", desc: "타인을 논리적으로 이끄는 능력." },
      { id: "팀워크능력", desc: "협업을 통해 성과를 창출." },
      { id: "유연함", desc: "상황 변화에 맞춰 접근 방식을 조정." },
      { id: "창의성", desc: "기존 틀을 넘어 새로운 해법을 제시." },
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
  const [step, setLevel] = useState("guide"); // guide | play | mid | final | wait
  const [phaseIdx, setPhaseIdx] = useState(0); // 0: 인성, 1: 태도, 2: 기능
  const [hovered, setHovered] = useState(null); // {id}
  const [selections, setSelections] = useState(makeEmptySelections);
  const [activeTraitInfo, setActiveTraitInfo] = useState(null);

  const dragGhostRef = useRef(null);

const navigate = useNavigate();
  const { round, setRound, setStep } = useRoundStep();

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
        onClick={() => setLevel("play")}
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
        <p className="cjgame-subtitle">각 인재상에 배치된 기본 역량을 확인해 주세요.</p>
        <div className="cjgame-result-grid">
          {TRAITS.map((t) => (
            <div key={t.key} className="cjgame-result-card">
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
          <button className="cjgame-btn" onClick={restart}>
            다시하기
          </button>
          <button className="cjgame-btn cjgame-primary" onClick={() => setLevel("wait")}>
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
            navigate("/user/roundIndicator", { replace: true });
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
        <div className="cjgame-badge" style={{ background: currentCategory.color }}>
          {currentCategory.label}
        </div>
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

      {/* 중앙: 아직 배치되지 않은 기본 역량 버튼들 */}
      <section className="cjgame-pool">
        {remainingItems.map((item) => (
          <button
            key={item.id}
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
        ))}
        {remainingItems.length === 0 && (
          <div className="cjgame-muted cjgame-center">모든 항목을 배치했습니다.</div>
        )}
      </section>

      {/* 하단: 4개 인재상 드롭 영역 */}

      <section className="cjgame-buckets">
        {TRAITS.map((t) => (
          <div
            key={t.key}
            className={`cjgame-bucket trait-${t.key}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropToTrait(e, t.key)}
          >
            <div
              className="cjgame-bucket-title"
              onClick={() => setActiveTraitInfo(prev => (prev === t.key ? null : t.key))}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveTraitInfo(prev => (prev === t.key ? null : t.key)); }}
              title="클릭하면 설명 보기"
            >
              {t.label}
            </div>
            {activeTraitInfo === t.key && (
              <div className="cjgame-bucket-hint">{TRAIT_DESCS[t.key]}</div>
            )}
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