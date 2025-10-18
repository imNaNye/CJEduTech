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

const CATEGORY_LABELS = {
  personal: '인성',
  attitude: '태도',
  functional: '기능',
};

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

  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter !== 'all') list = list.filter(it => it.category === categoryFilter);
    if (search.trim()) list = list.filter(it => it.id.toLowerCase().includes(search.trim().toLowerCase()));
    return list;
  }, [items, categoryFilter, search]);

  // ===== Test data generator =====
  const PERSONAL = ['정직함','책임감','성실함','배려심','적극성','유연함','이해심','친절함'];
  const ATTITUDE = ['단호함','열정','겸손함','자신감','호기심'];
  const FUNCTIONAL = ['위기관리 능력','소통능력','갈등 해결능력','팀워크 능력','판단력','창의력'];
  const TRAITS = ['integrity','passion','creativity','respect'];
  const CATEGORIES = [
    { key: 'personal', items: PERSONAL },
    { key: 'attitude', items: ATTITUDE },
    { key: 'functional', items: FUNCTIONAL },
  ];

  function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
  function pickN(arr, n){ return shuffle(arr).slice(0, n); }
  function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function buildRandomSelections(){
    const selections = { personal:{}, attitude:{}, functional:{} };
    CATEGORIES.forEach(({ key, items }) => {
      // pick 1~3 items for this category, then assign each to a random trait
      const picked = pickN(items, randInt(1, Math.min(3, items.length)));
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

  return (
    <div className="cjgame-result-page">
      <div className="cjgame-topbar" style={{ alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h2 className="cjgame-title">게임 결과 통계 (관리자)</h2>
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
          <button className="cjgame-btn cjgame-return" disabled={seeding} onClick={seed20}>{seeding ? '생성 중…' : '테스트 데이터 20명 생성'}</button>
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
                {filtered.map((it) => (
                  <tr key={`${it.category}-${it.id}`}>
                    <Td style={{ color:'#666' }}>{CATEGORY_LABELS[it.category] || it.category}</Td>
                    <Td
                      style={{ fontWeight: 700, cursor: 'pointer' }}
                      title="이 기본 역량을 분류한 모든 사람 보기"
                      onClick={() => {
                        const usersByTrait = it.users || {};
                        const counts = it.counts || {};
                        setSelectedCell({
                          type: 'item',
                          id: it.id,
                          usersByTrait,
                          counts,
                        });
                      }}
                    >
                      {it.id}
                    </Td>
                    {TRAIT_META.map(t => (
                      <Td
                        key={t.key}
                        onClick={() => {
                          const users = Array.isArray(it.users?.[t.key]) ? it.users[t.key] : [];
                          console.debug('[Admin] cell click', { item: it.id, trait: t.key, count: it.counts?.[t.key] || 0, usersSample: users.slice(0,5) });
                          setSelectedCell({ id: it.id, traitKey: t.key, traitLabel: t.label, users, type: 'trait' });
                        }}
                        className={`cell-count trait-${t.key}`}
                        style={{ cursor:'pointer', textAlign:'center', fontWeight:600 }}
                        title={`${t.label} : 분류한 인원 보기`}
                      >
                        {Number.isFinite(it.counts?.[t.key]) ? it.counts[t.key] : 0}
                      </Td>
                    ))}
                  </tr>
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
              <div className="cjgame-sidepanel-header" style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:800 }}>{selectedCell.id}</span>
                <span className="cjgame-muted" style={{ fontSize:12 }}>
                  전체 분류 인원: {TRAIT_META.reduce((s,t)=> s + ((selectedCell.counts?.[t.key]||0)), 0)}명
                </span>
              </div>
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