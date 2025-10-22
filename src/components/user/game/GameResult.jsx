// Admin Game Result Dashboard
const API_BASE = import.meta.env?.VITE_API_URL || "";

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './game.css';
import { useRoundStep } from '../../../contexts/RoundStepContext';

const TRAIT_META = [
  { key: 'integrity', label: '정직' },
  { key: 'passion', label: '열정' },
  { key: 'creativity', label: '창의' },
  { key: 'respect', label: '존중' },
];

// Reference global variables if present, fallback to defaults for local dev
const CATEGORY_LABELS = (typeof window !== "undefined" && window.CATEGORY_LABELS)
  ? window.CATEGORY_LABELS
  : {
      personal: '인성',
      attitude: '태도',
      functional: '기능',
    };
const TRAIT_DESCS = (typeof window !== "undefined" && window.TRAIT_DESCS)
  ? window.TRAIT_DESCS
  : {
      integrity: "비효율과 부정을 용납하지 않는다",
      passion: "최고와 완벽을 추구한다",
      creativity: "끊임없이 변화하고 혁신한다",
      respect: "서로 이해하고 배려한다",
    };
const CATEGORIES = (typeof window !== "undefined" && window.CATEGORIES)
  ? window.CATEGORIES
  : [
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
export default function GameResult() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null); // { submissions, users }
  const [items, setItems] = useState([]); // [{ id, category, counts, users }]
  const [progress, setProgress] = useState({ sessions: [], submissions: [], incompletes: [] });
  const { round, setRound, setStep,videoId,setVideoId } = useRoundStep();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCell, setSelectedCell] = useState(null); // { id, traitKey, users:[] }

  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ovRes, stRes, prRes] = await Promise.all([
        fetch(`${API_BASE}/api/game/stats/overview`),
        fetch(`${API_BASE}/api/game/stats/element-traits`),
        fetch(`${API_BASE}/api/game/stats/progress`),
      ]);
      if (!ovRes.ok) throw new Error('overview api failed');
      if (!stRes.ok) throw new Error('element-traits api failed');
      if (!prRes.ok) throw new Error('progress api failed');
      const ov = await ovRes.json();
      const st = await stRes.json();
      const pr = await prRes.json();
      setOverview({ submissions: ov.submissions ?? 0, users: ov.users ?? 0 });
      setItems(Array.isArray(st.items) ? st.items : []);
      setProgress({
        sessions: Array.isArray(pr.sessions) ? pr.sessions : [],
        submissions: Array.isArray(pr.submissions) ? pr.submissions : [],
        incompletes: Array.isArray(pr.incompletes) ? pr.incompletes : [],
      });
    } catch (e) {
      console.error('[GameResult] load error', e);
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ==== Description lookups ====
  const ITEM_META_MAP = useMemo(() => {
    const map = {};
    const cats = Array.isArray(CATEGORIES) ? CATEGORIES : [];
    cats.forEach((cat) => {
      const label = cat.label || cat.key;
      const color = cat.color || '#fff1e5';
      const items = Array.isArray(cat.items) ? cat.items : [];
      items.forEach((it) => {
        const id = typeof it === 'string' ? it : it.id;
        const desc = typeof it === 'string' ? '' : (it.desc || '');
        if (id) {
          map[id] = {
            desc,
            category: cat.key,
            categoryLabel: label,
            color
          };
        }
      });
    });
    return map;
  }, []);

  function getItemMeta(id) {
    return ITEM_META_MAP[id] || null;
  }

  function getTraitDesc(traitKey) {
    return (TRAIT_DESCS && TRAIT_DESCS[traitKey]) ? TRAIT_DESCS[traitKey] : '';
  }

  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter !== 'all') list = list.filter(it => it.category === categoryFilter);
    if (search.trim()) list = list.filter(it => it.id.toLowerCase().includes(search.trim().toLowerCase()));
    return list;
  }, [items, categoryFilter, search]);

  // 그룹핑: 인성/태도/기능 순서로 섹션 나누기
  const groupedByCategory = useMemo(() => {
    const order = ['personal', 'attitude', 'functional'];
    const map = { personal: [], attitude: [], functional: [] };
    filtered.forEach(it => { if (map[it.category]) map[it.category].push(it); });
    return order.map(key => ({ key, label: CATEGORY_LABELS[key] || key, rows: map[key] }));
  }, [filtered]);

  // 색상 유틸: 분포(비율)에 따라 셀 배경 농도 조절
  function traitBaseColor(traitKey) {
    switch (traitKey) {
      case 'integrity': return { h: 28, s: 90 }; // 파랑톤
      case 'passion': return { h: 28, s: 90 };    // 레드톤
      case 'creativity': return { h: 28, s: 90 }; // 오렌지톤
      case 'respect': return { h: 28, s: 90 };   // 그린톤
      default: return { h: 0, s: 0 };
    }
  }
  function heatStyleForCell(traitKey, count, rowCounts) {
    const total = TRAIT_META.reduce((s,t)=> s + (rowCounts?.[t.key]||0), 0);
    const ratio = total > 0 ? (count || 0) / total : 0;
    const { h, s } = traitBaseColor(traitKey);
    // 최소 가시성 4%, 최대 30% 투명 배경
    const a = ratio > 0 ? (0.04 + 0.26 * Math.min(1, ratio)) : 0;
    const bg = `hsla(${h} ${s}% 50% / ${a})`;
    return {
      background: bg,
    };
  }

  // ===== Test data generator =====
  // Use global CATEGORIES for test data if possible
  const TRAITS = ['integrity','passion','creativity','respect'];
  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function pickN(arr, n){ return shuffle(arr).slice(0, n); }
  function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function buildRandomSelections(){
    // Use the global CATEGORIES for keys/items, fallback to local default keys if missing
    const cats = Array.isArray(CATEGORIES) ? CATEGORIES : [];
    const selections = {};
    cats.forEach(({ key, items }) => {
      selections[key] = {};
      // Pick 1~3 items for this category, then assign each to a random trait
      // Support both [{id,desc}] and [string] style
      const itemNames = Array.isArray(items)
        ? items.map(it => typeof it === "string" ? it : it.id)
        : [];
      const picked = pickN(itemNames, randInt(1, Math.min(3, itemNames.length)));
      picked.forEach((name) => {
        const trait = TRAITS[randInt(0, TRAITS.length-1)];
        if (!selections[key][trait]) selections[key][trait] = [];
        selections[key][trait].push(name);
      });
    });
    return selections;
  }

  function buildMergedByTrait(selections){
    const merged = { integrity: [], passion: [], creativity: [], respect: [] };
    Object.entries(selections).forEach(([cat, traitObj]) => {
      Object.entries(traitObj).forEach(([trait, list]) => {
        merged[trait] = merged[trait].concat(list || []);
      });
    });
    return merged;
  }

  const seed20 = useCallback(async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const now = Date.now();
      for (let i=1;i<=20;i++){
        const nickname = `테스트유저${String(i).padStart(2,'0')}`;
        const sessionId = `seed-${now}-${i}`;
        const startedAt = now + i;
        const selections = buildRandomSelections();
        const merged = buildMergedByTrait(selections);
        // start
        await fetch(`${API_BASE}/api/game/start`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, sessionId, startedAt })
        });
        // submit
        await fetch(`${API_BASE}/api/game/submit`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, sessionId, selectionsByCategory: selections, mergedByTrait: merged, submittedAt: startedAt + 1000 })
        });
      }
      await load();
      alert('테스트 데이터 20명이 생성되었습니다.');
    } catch (e) {
      console.error('[seed20] failed', e);
      alert('테스트 데이터 생성 중 오류가 발생했습니다. 콘솔을 확인하세요.');
    } finally {
      setSeeding(false);
    }
  }, [seeding, load]);

  async function resetAllGameData() {
    if (!confirm('모든 게임 기록을 초기화하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/game/reset-all`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Reset failed');
      await load();
      alert('게임 기록이 초기화되었습니다.');
    } catch (err) {
      console.error('[resetAllGameData] failed', err);
      alert('초기화 중 오류 발생');
    }
  }

  return (
    <div className="cjgame-result-page">
      <div className="cjgame-topbar" style={{ alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h2 className="cjgame-title">게임 결과 통계</h2>
          <p className="cjgame-subtitle">제출된 결과를 기준으로 기본 역량 → 인재상 분포를 집계합니다.</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          {overview && (
            <>
              <KPI label="참여자 수" value={overview.users} />
              <KPI label="제출 수" value={overview.submissions} />
            </>
          )}
          <button className="cjgame-btn cjgame-return" onClick={load}>새로고침</button>
          <button className="cjgame-btn cjgame-return" onClick={resetAllGameData}>기록 초기화</button>
          <button className="cjgame-btn cjgame-primary" onClick={()=> {
            
            
            setStep(4);
            navigate('/admin/roundIndicator');

          }}>게임 종료</button>
        </div>
      </div>

      {loading && <div className="cjgame-center">로딩 중…</div>}
      {error && <div className="cjgame-center" style={{ color:'#d33' }}>{error}</div>}

      {!loading && !error && (
        <div className="cjgame-layout">
          {/* Left: table with its own scroll */}
          <div className="cjgame-table-scroll">
            <table className="cjgame-admin-table" style={{ width:'100%', borderCollapse:'separate', borderSpacing:0 }}>
              <thead>
                <tr>
                  <Th style={{ width: 60 }}>분류(요소)</Th>
                  <Th style={{ width: 60 }}>기본 역량</Th>
                  {TRAIT_META.map(t => (
                    <Th key={t.key} className={`trait-${t.key}`}>{t.label}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedByCategory.map(section => (
                  <>
                    {/* 섹션 헤더 */}
                    <tr key={`section-${section.key}`}>
                      <Td colSpan={2 + TRAIT_META.length} style={{
                        position:'sticky', top: 44, zIndex: 0,
                        background:'#fff', borderBottom:'1px solid #eee',
                        fontWeight: 800, color:'#333', paddingTop:16
                      }}>
                        {section.label}
                      </Td>
                    </tr>
                    {/* 섹션 내용 */}
                    {section.rows.map((it) => (
                      <tr key={`${it.category}-${it.id}`}>
                        <Td style={{ color:'#999' }}>{CATEGORY_LABELS[it.category] || it.category}</Td>
                        <Td
                        className='cell-count'
                          style={{ fontWeight: 700, cursor: 'pointer' }}
                          title="이 기본 역량을 분류한 모든 사람 보기"
                          onClick={() => {
                            const usersByTrait = it.users || {};
                            const counts = it.counts || {};
                            setSelectedCell({ type: 'item', id: it.id, usersByTrait, counts });
                          }}
                        >
                          {it.id}
                        </Td>
                        {TRAIT_META.map(t => (
                          <Td
                            key={t.key}
                            onClick={() => {
                              const users = Array.isArray(it.users?.[t.key]) ? it.users[t.key] : [];
                              setSelectedCell({ id: it.id, traitKey: t.key, traitLabel: t.label, users, type: 'trait' });
                            }}
                            className={`cell-count trait-${t.key}`}
                            style={{ cursor:'pointer', textAlign:'center', fontWeight:600, ...heatStyleForCell(t.key, it.counts?.[t.key]||0, it.counts||{}) }}
                            title={`${t.label} : 분류한 인원 보기`}
                          >
                            {Number.isFinite(it.counts?.[t.key]) ? it.counts[t.key] : 0}
                          </Td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr><Td colSpan={2 + TRAIT_META.length} style={{ textAlign:'center', color:'#888' }}>표시할 항목이 없습니다.</Td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Right: Incomplete list */}
          <div className="cjgame-result-card" style={{ minWidth: 320, maxWidth: 360, flex: '0 0 360px' }}>
            <div className="cjgame-result-card-header" style={{ fontSize: 18, textAlign: 'left' }}>미완료 세션</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ color:'#666', marginBottom: 6 }}>시작했지만 제출하지 않은 인원: <b>{progress.incompletes.length}</b>명</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {progress.incompletes.length === 0 ? (
                  <span className="cjgame-muted">없음</span>
                ) : (
                  progress.incompletes.map((s, idx) => (
                    <span key={`${s.session_id}-${idx}`} className="cjgame-chip cjgame-chip--small" title={new Date(Number(s.started_at) || Date.now()).toLocaleString()}>
                      {s.nickname || '게스트'}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCell && (
        <div className="cjgame-sidepanel">
          {selectedCell.type === 'item' ? (
            <>
              <div className="cjgame-sidepanel-header" style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontWeight:800 }}>{selectedCell.id}</span>
                <span className="cjgame-muted" style={{ fontSize:12 }}>
                  전체 분류 인원: {TRAIT_META.reduce((s,t)=> s + ((selectedCell.counts?.[t.key]||0)), 0)}명
                </span>
              </div>
              {(() => {
                const meta = getItemMeta(selectedCell.id);
                return (
                  <div className="cjgame-sidepanel-desc" style={{ fontSize:18, color:'black', background:'#fff7ed', border:'1px solid #ffe3c7', borderRadius:8, padding:'8px 10px', margin:'8px 12px' }}>
                    <div style={{ fontWeight:700, marginBottom:4 }}>{selectedCell.id}</div>
                    <div>{meta?.desc || '설명 없음'}</div>
                  </div>
                );
              })()}
              <div className="cjgame-sidepanel-body" style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
                {TRAIT_META.map(t => {
                  const list = Array.isArray(selectedCell.usersByTrait?.[t.key]) ? selectedCell.usersByTrait[t.key] : [];
                  return (
                    <div key={t.key}>
                      <div style={{ fontWeight:700, marginBottom:6 }} className={`trait-${t.key}`}>{t.label} · {list.length}명</div>
                      {list.length === 0 ? (
                        <span className="cjgame-muted">없음</span>
                      ) : (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                          {list.map((u, i) => (
                            <span key={`${t.key}-${u}-${i}`} className={`cjgame-chip cjgame-chip--small cjgame-chip--${t.key}`}>{u}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className={`cjgame-sidepanel-header trait-${selectedCell.traitKey}`}>
                {selectedCell.id} · {selectedCell.traitLabel} (총 {selectedCell.users.length}명)
              </div>
              {(() => {
                const meta = getItemMeta(selectedCell.id);
                return (
                  <div className="cjgame-sidepanel-desc" style={{ fontSize:18, color:'black', background:'#fff7ed', border:'1px solid #ffe3c7', borderRadius:8, padding:'8px 10px', margin:'8px 12px' }}>
                    <div style={{ fontWeight:700, marginBottom:4 }}>{selectedCell.id}</div>
                    <div>{meta?.desc || '설명 없음'}</div>
                  </div>
                );
              })()}
              <div className="cjgame-sidepanel-desc" style={{ fontSize:18, color:'black', background:'#eef6ff', border:'1px solid #d7e9ff', borderRadius:8, padding:'8px 10px', margin:'8px 12px' }}>
                <div style={{ fontWeight:700, marginBottom:4 }}>{selectedCell.traitLabel}</div>
                <div>{getTraitDesc(selectedCell.traitKey) || '설명 없음'}</div>
              </div>
              <div className="cjgame-sidepanel-body">
                {selectedCell.users.length === 0 ? (
                  <span className="cjgame-muted">해당 분류를 한 사용자가 없습니다.</span>
                ) : (
                  selectedCell.users.map((u, i) => (
                    <span key={`${u}-${i}`} className={`cjgame-chip cjgame-chip--small cjgame-chip--${selectedCell.traitKey}`}>{u}</span>
                  ))
                )}
              </div>
            </>
          )}
          <div className="cjgame-sidepanel-footer">
            <button className="cjgame-btn cjgame-return" onClick={()=>setSelectedCell(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value }){
  return (
    <div className="cjgame-result-card" style={{ padding:12, minWidth: 140, textAlign:'center' }}>
      <div style={{ fontSize:12, color:'#666' }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800 }}>{value ?? 0}</div>
    </div>
  );
}

function Th({ children, className = '', style }){
  return (
    <th
      className={className}
      style={{
        padding:'12px 10px', textAlign:'center', background:'#fafafa', borderBottom:'1px solid #eee',
        position:'sticky', top:0, zIndex:1, ...style
      }}
    >{children}</th>
  );
}

function Td({ children, style, colSpan, className='', ...rest }){
  return (
    <td
      colSpan={colSpan}
      className={className}
      style={{ padding:'10px 10px', borderBottom:'1px solid #f0f0f0', ...style }}
      {...rest}
    >{children}</td>
  );
}