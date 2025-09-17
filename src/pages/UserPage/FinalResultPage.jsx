import badgeJustice from '@/assets/badges/justice.png';
import badgePassion from '@/assets/badges/passion.png';
import badgeRespect from '@/assets/badges/respect.png';
import badgeCreativity from '@/assets/badges/creativity.png';
import '../../components/user/finalResult/finalResult.css';
import PageHeader from '../../components/common/PageHeader';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import myAvatar from "@/assets/images/avatar/avatar2.png";

import { http } from '@/lib/http' ;
import { quizApi } from '@/api/quiz' ;
export default function FinalResultPage() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const roomId = useMemo(() => search.get('roomId') || location.state?.roomId || localStorage.getItem('roomId') || 'general', [location.search, location.state]);
  const nickname = useMemo(() => search.get('nickname') || location.state?.nickname || localStorage.getItem('nickname') || '', [location.search, location.state]);
  const learnedAtStr = useMemo(() => new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' }), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const donutRef = useRef(null);
  const lineRef = useRef(null);
  const barsRef = useRef(null);
  const donutChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barsChartRef = useRef(null);

  async function ensureChartJS(){
    if (window.Chart) return window.Chart;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
    return window.Chart;
  }

  function buildMockSections(){
    const rnd = (min, max) => Math.floor(Math.random()*(max-min+1))+min;
    const rounds = [1,2,3];
    const personaByRound = rounds.map(r => ({
      round_number: r,
      labels: { '정직': rnd(8,20), '창의': rnd(4,12), '존중': rnd(4,12), '열정': rnd(4,12) }
    }));
    const participationByRound = rounds.map(r => ({
      round_number: r,
      totalMessages: rnd(80,140),
      totalReactions: rnd(150,300),
      myMessages: rnd(8,25),
      myReactions: rnd(10,60)
    }));
    const totals = { '정직':0,'창의':0,'존중':0,'열정':0 };
    personaByRound.forEach(r => { Object.keys(totals).forEach(k => totals[k]+=r.labels[k]); });
    const sum = Object.values(totals).reduce((a,b)=>a+b,0) || 1;
    const personaIntegrated = {
      counts: totals,
      percentages: Object.fromEntries(Object.entries(totals).map(([k,v])=>[k, Math.round(v/sum*1000)/10]))
    };
    return {
      overall: { rank: 1, score: 123.4, totalMessages: participationByRound.reduce((a,b)=>a+b.myMessages,0), totalReactions: participationByRound.reduce((a,b)=>a+b.myReactions,0) },
      aiSummary: "명확한 기준과 효과적인 요약이 돋보였습니다. '비용, 시간, 영향도'를 기준으로 대안을 비교하는 발언들은 효율적 의사결정의 중요성을 잘 보여주었습니다. 실무에서 이러한 접근 방식을 계속 활용해 주시길 기대합니다.",
      personaIntegrated,
      personaByRound,
      participationByRound,
      top3Statements: [
        { nickname:'홍길동', text:'가설을 검증하기 위한 증거를 제시했습니다.', reactionsCount:28, createdAt:Date.now(), round_number:1 },
        { nickname:'이몽룡', text:'팀 합의를 이끌어낸 포인트를 정리했습니다.', reactionsCount:24, createdAt:Date.now(), round_number:2 },
        { nickname:'성춘향', text:'반박에 대한 명확한 근거를 제시했습니다.', reactionsCount:20, createdAt:Date.now(), round_number:3 },
      ],
      ranking: []
    };
  }

  function buildMockQuiz(){
    // 3라운드 기준 임시 퀴즈 데이터
    return [1,2,3].map((r)=>({ round_number:r, totalQuestions:10, correctCount: 6 + ((r%3)), correctRate: 60 + (r*8) }));
  }

  useEffect(() => {
    let aborted = false;
    async function fetchData(){
      const mock = { sections: buildMockSections() };
      setData(mock);
      setQuiz({ rounds: buildMockQuiz() });
      setLoading(false);
    }
    fetchData();
    return () => { aborted = true };
  }, [roomId, nickname]);

  const sections = data?.sections;
  const overall = sections?.overall || { rank:null, score:null, totalMessages:0, totalReactions:0 };
  const personaIntegrated = sections?.personaIntegrated || { counts:{}, percentages:{} };
  const personaByRound = sections?.personaByRound || [];
  const participation = sections?.participationByRound || [];
  const top3 = sections?.top3Statements || [];
  const aiSummary = sections?.aiSummary || '';

  // 유틸
  const pct = (v) => typeof v === 'number' ? `${v}%` : (Number(v)||0)+"%";
  const p = personaIntegrated.percentages;

  const pComputed = p && Object.keys(p).length ? p : (()=>{
    const counts = personaIntegrated.counts || {};
    const sum = Object.values(counts).reduce((a,b)=>a+(b||0),0) || 1;
    return Object.fromEntries(Object.entries(counts).map(([k,v])=>[k, Math.round(((v||0)/sum)*1000)/10]));
  })();

  // 랭크/아바타 티어/퍼센타일 유틸
  const totalParticipants = Array.isArray(sections?.ranking) ? sections.ranking.length : 0;
  const topPercent = (overall?.rank && totalParticipants) ? Math.round((overall.rank/totalParticipants)*1000)/10 : null; // 상위 X%
  const rankTier = (r) => {
    if (!r) return 'normal';
    if (r === 1) return 'gold';
    if (r === 2) return 'silver';
    if (r === 3) return 'bronze';
    return 'normal';
  };
  const avatarTierClass = `frp-avatar--${rankTier(overall?.rank)}`;
  const rankBadgeClass = `frp-rank-badge--${rankTier(overall?.rank)}`;

  // 학습 완수율 (전체 진행률) - 추후 실제 값 연동 가능
  const overallProgress = 100; // TODO: 서버 값 연동 시 대체
  const detailSteps = [
    { key: 'theory', label: '이론 학습', value: 100 },
    { key: 'quiz', label: '퀴즈 풀이', value: 100 },
    { key: 'video', label: '영상 시청', value: 100 },
    { key: 'discussion', label: '토론 진행', value: 100 },
  ];

  useEffect(() => {
    if (!sections) return;
    let alive = true;
    (async () => {
      const Chart = await ensureChartJS();
      if (!alive) return;

      // Colors aligned with CSS swatches
      const C = {
        justice: '#f39c12', // 정직
        passion: '#e74c3c', // 열정
        respect: '#ff7f50', // 존중
        creativity: '#f1c40f', // 창의
        round1: '#3a7bd5',
        round2: '#ff6b6b',
        round3: '#f4a261',
      };

      // --- Donut (integrated persona) ---
      const donutCtx = donutRef.current?.getContext('2d');
      if (donutCtx){
        donutChartRef.current?.destroy?.();
        const labels = ['정직','열정','존중','창의'];
        const vals = labels.map(k => Number(pComputed?.[k]||0));

        // Create rank-based size mapping: 1st=156, 2nd/3rd=122, 4th=76
        const sorted = [...vals].map((v,i)=>({ v, i })).sort((a,b)=> b.v - a.v);
        const sizeMap = {};
        sorted.forEach((o, rank) => {
          if (rank === 0) sizeMap[o.i] = 156;
          else if (rank === 1 || rank === 2) sizeMap[o.i] = 122;
          else sizeMap[o.i] = 76;
        });

        // --- Badge images for persona labels (Vite-safe asset paths) ---
        const badgeSources = {
          '정직': badgeJustice,
          '열정': badgePassion,
          '존중': badgeRespect,
          '창의': badgeCreativity,
        };
        const badgeImages = {};
        Object.entries(badgeSources).forEach(([k, src]) => {
          const img = new Image();
          img.src = src; // vite 빌드 시, 실제 경로로 교체
          badgeImages[k] = img;
        });

        // After badgeImages, build rank-based badgeSizes array
        const badgeSizes = vals.map((_, i) => sizeMap[i]);

        // --- Compute dynamic side padding based on largest badge + label block ---
        const maxBadge = Math.max(...badgeSizes);
        const labelBlockH = 24; // label + gap height allowance
        const sideBandPad = Math.ceil(maxBadge/2) + labelBlockH + 16; // half badge + label + margin

        // Plugin: pin badges to left/right bands with single-elbow connectors, max 2 per side
        const badgePlugin = {
          id: 'persona-badges',
          afterDatasetsDraw(chart){
            const { ctx, chartArea } = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) return;

            // Geometry (donut center & radius)
            const base = meta.data[0].getProps(['x','y','outerRadius'], true);
            const cx = base.x, cy = base.y, R = base.outerRadius;

            // Build items from arcs (anchor points)
            const items = meta.data.map((arc, idx) => {
              const label = chart.data.labels[idx];
              const img = badgeImages[label];
              if (!img) return null;
              const props = arc.getProps(['x','y','startAngle','endAngle','innerRadius','outerRadius'], true);
              const angle = (props.startAngle + props.endAngle) / 2;
              const ax = props.x + Math.cos(angle) * (props.outerRadius + 6);
              const ay = props.y + Math.sin(angle) * (props.outerRadius + 6);
              const onRight = Math.cos(angle) >= 0; // initial side by anchor
              const size0 = badgeSizes[idx] || 76;
              const value = Math.round((pComputed?.[label] ?? 0) * 10) / 10;
              return { idx, label, img, angle, ax, ay, onRight, size0, value };
            }).filter(Boolean);

            // Split into sides
            let left = items.filter(it => !it.onRight);
            let right = items.filter(it =>  it.onRight);

            // Rebalance so each side has at most 2 badges.
            function rebalance(from, to, isRightFrom){
              // Move the item(s) whose anchor X is closest to center first
              while (from.length > 2){
                from.sort((a,b) => Math.abs(a.ax - cx) - Math.abs(b.ax - cx));
                const mv = from.shift();
                mv.onRight = !isRightFrom;
                to.push(mv);
              }
            }
            // Prefer to move overflow from the more crowded side first
            if (right.length > 2) rebalance(right, left, true);
            if (left.length  > 2) rebalance(left,  right, false);

            // Final sort by Y for neat vertical stacking
            left.sort((a,b)=> a.ay - b.ay);
            right.sort((a,b)=> a.ay - b.ay);

            // Lay out a side with stacking and (if needed) uniform downscale to fit
            function layoutSide(sideItems, isRight){
              if (!sideItems.length) return [];
              const bandTop = chartArea.top + 12;
              const bandBot = chartArea.bottom - 12;
              const bandH = bandBot - bandTop;

              const gap = 12;
              const minSize = 48;
              const sumSizes = sideItems.reduce((s,it)=> s + it.size0, 0);
              const need = sumSizes + gap*(sideItems.length-1);
              const scale = need > bandH
                ? Math.max((bandH - gap*(sideItems.length-1)) / Math.max(sumSizes,1), minSize/Math.max(...sideItems.map(it=>it.size0)))
                : 1;

              const laid = sideItems.map(it => ({
                ...it,
                size: Math.round(it.size0 * scale),
                // base X will be pushed outside the donut in a moment
                bx: isRight ? (chartArea.right - 16) : (chartArea.left + 16),
                by: Math.max(bandTop + Math.round(it.size0*scale)/2, Math.min(bandBot - Math.round(it.size0*scale)/2, it.ay))
              }));

              // Forward pass (push down)
              for (let i=1;i<laid.length;i++){
                const prev = laid[i-1];
                const cur = laid[i];
                const minGap = (prev.size/2 + cur.size/2 + gap);
                if (cur.by - prev.by < minGap){ cur.by = prev.by + minGap; }
              }
              // Backward pass (pull up)
              for (let i=laid.length-2;i>=0;i--){
                const next = laid[i+1];
                const cur = laid[i];
                const minGap = (cur.size/2 + next.size/2 + gap);
                if (next.by > bandBot){ next.by = bandBot - next.size/2; }
                if (next.by - cur.by < minGap){ cur.by = next.by - minGap; }
                if (cur.by < bandTop + cur.size/2){ cur.by = bandTop + cur.size/2; }
              }

              // Push X outside donut with margin, stay inside chartArea edges
              laid.forEach(cur => {
                const margin = 24;
                cur.bx = isRight
                  ? Math.max(cx + R + margin + cur.size/2, chartArea.right - 16 - cur.size/2)
                  : Math.min(cx - R - margin - cur.size/2, chartArea.left + 16 + cur.size/2);
              });

              return laid;
            }

            const laidL = layoutSide(left, false);
            const laidR = layoutSide(right, true);
            const laidAll = [...laidL, ...laidR];

            // Draw (elbow connector + badge + label)
            laidAll.forEach(it => {
              const { img, label, value, ax, ay, bx, by, size, onRight } = it;
              if (!img.complete){ img.onload = () => chart.draw(); return; }
              ctx.save();

              const elbowX = onRight ? (bx - size/2 - 10) : (bx + size/2 + 10);
              const elbowY = ay;
              const endX   = onRight ? (bx - size/2 - 4)  : (bx + size/2 + 4);
              const endY   = by;

              // anchor dot
              ctx.beginPath();
              ctx.arc(ax, ay, 3, 0, Math.PI*2);
              ctx.fillStyle = 'rgba(0,0,0,0.35)';
              ctx.fill();

              // elbow polyline
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(elbowX, elbowY);
              ctx.lineTo(endX, endY);
              ctx.lineWidth = 2;
              ctx.lineJoin = 'round';
              ctx.strokeStyle = 'rgba(0,0,0,0.35)';
              ctx.stroke();

              // badge image
              ctx.drawImage(img, bx - size/2, by - size/2, size, size);

              // label under badge
              ctx.font = '14px sans-serif';
              ctx.fillStyle = '#333';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillText(`${label} ${value}%`, bx, by + size/2 + 6);

              ctx.restore();
            });
          }
        };

        donutChartRef.current = new Chart(donutCtx, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{
              data: vals,
              backgroundColor: [C.justice, C.passion, C.respect, C.creativity],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: true,
            cutout: '65%',
            layout: { padding: { left: sideBandPad, right: sideBandPad, top: 50, bottom: 50 } },
            plugins: { legend: { display: false }, tooltip: { enabled: true } }
          },
          plugins: [badgePlugin]
        });
      }

      // --- Persona by Round (LINE: x=인재상 4가지, series=라운드) ---
      const lineCtx = lineRef.current?.getContext('2d');
      if (lineCtx){
        lineChartRef.current?.destroy?.();
        const traitLabels = ['정직','열정','존중','창의'];
        const colorPool = [C.round1, C.round2, C.round3, '#9b59b6', '#16a085'];
        const datasets = (personaByRound || []).map((r, idx) => ({
          label: `R${r.round_number ?? (idx+1)}`,
          data: traitLabels.map(t => Number(r?.labels?.[t] || 0)),
          borderColor: colorPool[idx % colorPool.length],
          backgroundColor: colorPool[idx % colorPool.length],
          tension: 0,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 4,
        }));
        lineChartRef.current = new Chart(lineCtx, {
          type: 'line',
          data: { labels: traitLabels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: true,
            plugins: { legend: { display: true, position: 'bottom' } },
            interaction: { mode: 'nearest', intersect: false },
            scales: {
              x: { },
              y: { beginAtZero: true, ticks: { precision: 0 } }
            }
          }
        });
      }

      // --- Bars (participation per round + quiz rates) ---
      const barsCtx = barsRef.current?.getContext('2d');
      if (barsCtx){
        barsChartRef.current?.destroy?.();
        const labels = (participation || []).map(r => `R${r.round_number ?? ''}`);
        const mine = (participation || []).map(r => r.myMessages || 0);
        const qRates = (quiz?.rounds || []).map(r => r.correctRate || 0);
        barsChartRef.current = new Chart(barsCtx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: '나의 메시지 수', data: mine, backgroundColor: '#3a7bd5', yAxisID: 'y' },
              { label: '퀴즈 정답률(%)', data: qRates, type: 'bar', backgroundColor: '#2ecc71', yAxisID: 'y1' },
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: true,
            plugins: { legend: { display: true, position: 'bottom' } },
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: '메시지 수' } },
              y1: { beginAtZero: true, suggestedMax: 100, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => v + '%' }, title: { display: true, text: '정답률(%)' } }
            }
          }
        });
      }
    })();

    return () => {
      alive = false;
      donutChartRef.current?.destroy?.();
      lineChartRef.current?.destroy?.();
      barsChartRef.current?.destroy?.();
    };
  }, [sections, quiz]);

  if (loading){
    return (
      <div className="final-result-page">
        <div className="frp-topbar">
          <h2 className="frp-topbar__title">{nickname ? `${nickname}의 학습 레포트` : '학습 레포트'}</h2>
          <div className="frp-topbar__date">학습일: {learnedAtStr}</div>
        </div>
        <div style={{padding:20}}>결과를 불러오는 중…</div>
      </div>
    );
  }
  if (error){
    return (
      <div className="final-result-page">
        <div className="frp-topbar">
          <h2 className="frp-topbar__title">{nickname ? `${nickname}의 학습 레포트` : '학습 레포트'}</h2>
          <div className="frp-topbar__date">학습일: {learnedAtStr}</div>
        </div>
        <div style={{padding:20,color:'#c0392b'}}>{error}</div>
      </div>
    );
  }

  return (
    
    <div className="final-result-page">
            <PageHeader title={"전체 결과 대시보드"} />
      <div className="frp-topbar">
        <h2 className="frp-topbar__title">{nickname ? `${nickname}의 학습 레포트` : '학습 레포트'}</h2>
        <div className="frp-topbar__date">학습일: {learnedAtStr}</div>
      </div>

      {/* SECTION 1: 통합 등수/점수 + AI 요약 + 학습 완수율(총괄 메시지/반응을 진행률처럼 표시) */}
      <section className="frp-section frp-section--1">
        <article className="frp-card frp-rank">
          <header className="frp-card__header">
            <h3>통합 등수 및 점수</h3>
          </header>
          <div className="frp-rank__body">
            <div className="frp-avatarWrap">
              <div className={`frp-avatar ${avatarTierClass}`} aria-label={overall.rank ? `${overall.rank}위 아바타` : '아바타'}>

              <img className="avatar-small" src={myAvatar} alt="내 프로필" />
              </div>
              {overall.rank ? (
                <div className={`frp-rank-badge ${rankBadgeClass}`} title={`순위 ${overall.rank}위`}>
                  {overall.rank}
                </div>
              ) : null}
            </div>
            <div className="frp-avatar__footer">
              <div className="frp-avatar__score">
                <strong>{overall.score != null ? `${Math.round(overall.score*10)/10} 점` : '—'}</strong>
                {topPercent != null && <span className="frp-avatar__percent">상위 {topPercent}%</span>}
              </div>
            </div>
          </div>
        </article>

        <article className="frp-card frp-ai-summary">
          <header className="frp-card__header">
            <h3>AI 요약</h3>
          </header>
          <div className="frp-ai-summary__body">
            {aiSummary ? (
              <p>{aiSummary}</p>
            ) : (
              <p className="frp-muted">요약이 없습니다. (내 발화가 부족하거나 AI 요약 비활성화)</p>
            )}
          </div>
        </article>

        <article className="frp-card frp-completion">
          <header className="frp-card__header">
            <h3>학습 완수율</h3>
          </header>
          <div className="frp-completion__body">
            {/* 전체 진행률 (상단 영역) */}
            <div className="frp-completion__overall">
              <div className="frp-completion__title">전체 진행률</div>
              <div className="frp-progress frp-progress--lg" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="frp-progress__bar" style={{ width: `${Math.min(overallProgress,100)}%` }} />
                <span className="frp-progress__label">전체 진행률 {overallProgress}%</span>
              </div>
            </div>

            {/* 세부 진행 (하단 영역) */}
            <div className="frp-completion__details">
              <ul className="frp-circle-list">
                {detailSteps.map(s => (
                  <li key={s.key} className="frp-circle">
                    <div className="frp-circle__ring">
                      <div className="frp-circle__value">{s.value}%</div>
                    </div>
                    <div className="frp-circle__label">{s.label}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>

      {/* SECTION 2: 인재상 통합 분포(도넛) + 라운드별 인재상 분포(꺾은선-플레이스홀더) */}
      <section className="frp-section frp-section--2">
        <article className="frp-card frp-donut">
          <header className="frp-card__header"><h3>인재상 통합 분포</h3></header>
          <div className="frp-donut__wrap">
            <canvas ref={donutRef} className="frp-donut__chart" aria-label="인재상 도넛" />
          </div>
        </article>

        <article className="frp-card frp-line">
          <header className="frp-card__header"><h3>라운드별 인재상 분포</h3></header>
          <div className="frp-line__chart" aria-hidden="false">
            <canvas ref={lineRef} style={{width:'100%', height:'100%'}} />
          </div>
          <footer className="frp-card__footer frp-legend--inline">
            {personaByRound.length ? personaByRound.map((r, i) => (
              <span key={r.round_number ?? i} className={`dot ${i===0?'dot--r1': i===1?'dot--r2':'dot--r3'}`}></span>
            )) : <span className="frp-muted">데이터 없음</span>}
            <span style={{marginLeft:6}}>라운드별 시리즈</span>
          </footer>
        </article>
      </section>

      {/* SECTION 3: 라운드별 참여도 + 공감 TOP3 */}
      <section className="frp-section frp-section--3">
        <div className="frp-col">
          <article className="frp-card frp-bars">
            <header className="frp-card__header"><h3>라운드별 토론 참여도</h3></header>
            <div className="frp-bars__chart" aria-hidden="false">
              <canvas ref={barsRef} style={{width:'100%', height:'100%'}} />
            </div>
            <footer className="frp-card__footer frp-legend--inline">
              <span className="dot dot--quiz" /> 나의 메시지 수
              <span className="dot dot--participation" /> 퀴즈 정답률(%)
            </footer>
          </article>
        </div>

        <aside className="frp-col">
          <article className="frp-card frp-top3">
            <header className="frp-card__header"><h3>공감을 많이 받은 발언 TOP3</h3></header>
            <ol className="frp-top3__list">
              {top3.length ? top3.map((m, i) => (
                <li key={i}>
                  <div className="badge">{i+1}</div>
                  <div className="frp-top3__content">
                    <p>{m.text}</p>
                    <div className="frp-top3__meta">
                      <span className="frp-top3__count">공감 {m.reactionsCount ?? 0}</span>
                    </div>
                  </div>
                </li>
              )) : (
                <li>
                  <div className="badge">-</div>
                  <div className="frp-top3__content"><p className="frp-muted">데이터 없음</p></div>
                </li>
              )}
            </ol>
          </article>
        </aside>
      </section>
    </div>
  );
}