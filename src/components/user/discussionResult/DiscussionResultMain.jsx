import { useEffect, useMemo, useState, useRef } from "react";
import SavePDFButton from "./SavePDFButton";
import NextSessionButton from "./NextSessionButton";
import "./discussionResult.css";
import { http } from '@/lib/http' ;
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';

// Dynamically load Chart.js from CDN (no static import)
async function ensureChartJS(){
  if (typeof window !== 'undefined' && window.Chart) return window.Chart;
  const id = 'chartjs-cdn-script';
  if (document.getElementById(id)){
    // wait until it loads
    await new Promise((res) => {
      const s = document.getElementById(id);
      if (s.getAttribute('data-loaded') === 'true') return res();
      s.addEventListener('load', () => res(), { once: true });
      s.addEventListener('error', () => res(), { once: true });
    });
    return window.Chart;
  }
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.id = id;
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.async = true;
    s.onload = () => { s.setAttribute('data-loaded','true'); res(); };
    s.onerror = (e) => { console.error('Chart.js load failed', e); res(); };
    document.head.appendChild(s);
  });
  // optional: register essentials if available
  try {
    const C = window.Chart;
    if (C && C.ArcElement && C.Tooltip && C.Legend) {
      C.register(C.ArcElement, C.Tooltip, C.Legend);
    }
  } catch(e){}
  return window.Chart;
}

import heroSheep from "@/assets/images/discussion/1_sheep.png";
import donutPlaceholder from "@/assets/images/discussion/donut_placeholder.png";
import myAvatar from "@/assets/images/avatar/avatar2.png";
import badgeJustice from "@/assets/images/discussion/badge_1.png";
import badgePassion from "@/assets/images/discussion/badge_2.png";
import badgeCreativity from "@/assets/images/discussion/badge_3.png";
import badgeRespect from "@/assets/images/discussion/badge_4.png";
import user1Avatar from "@/assets/images/avatar/avatar1.png";
import aiIcon from "@/assets/images/discussion/AI_icon.png";

import avatar1 from "@/assets/images/avatar/avatar1.png";
import avatar2 from "@/assets/images/avatar/avatar2.png";
import avatar3 from "@/assets/images/avatar/avatar3.png";
import avatar4 from "@/assets/images/avatar/avatar4.png";
import avatar5 from "@/assets/images/avatar/avatar5.png";
import avatar6 from "@/assets/images/avatar/avatar6.png";
import avatar7 from "@/assets/images/avatar/avatar7.png";
import avatar8 from "@/assets/images/avatar/avatar8.png";
import avatar9 from "@/assets/images/avatar/avatar9.png";
import avatar10 from "@/assets/images/avatar/avatar10.png";
import avatar11 from "@/assets/images/avatar/avatar11.png";
import avatar12 from "@/assets/images/avatar/avatar12.png";

function buildMockRoomResult(nickname = '나'){
  const createdAt = new Date().toISOString();
  const perUser = {
    [nickname]: {
      totalMessages: 18,
      totalReactions: 27,
      labels: { '정직': 8, '열정': 5, '창의': 3, '존중': 2 },
      topReacted: { text: '데이터 기반으로 의사결정하면 설득력이 높아집니다.', reactionsCount: 12 }
    },
    '동료A': { totalMessages: 14, totalReactions: 21, labels: { '정직': 4, '열정': 6, '창의': 2, '존중': 2 }, topReacted: { text: '고객 관점을 더 녹이면 좋겠어요.', reactionsCount: 9 } },
    '동료B': { totalMessages: 9,  totalReactions: 13, labels: { '정직': 2, '열정': 2, '창의': 4, '존중': 1 }, topReacted: { text: '실험을 작게 자주 해보죠.', reactionsCount: 6 } },
    '동료C': { totalMessages: 7,  totalReactions: 8,  labels: { '정직': 1, '열정': 3, '창의': 1, '존중': 2 }, topReacted: { text: '일정을 먼저 확정합시다.', reactionsCount: 4 } },
  };
  const ranking = [
    { nickname, rank: 1, score: 96, totalMessages: perUser[nickname].totalMessages, totalReactions: perUser[nickname].totalReactions },
    { nickname: '동료A', rank: 2, score: 88, totalMessages: perUser['동료A'].totalMessages, totalReactions: perUser['동료A'].totalReactions },
    { nickname: '동료B', rank: 3, score: 80, totalMessages: perUser['동료B'].totalMessages, totalReactions: perUser['동료B'].totalReactions },
    { nickname: '동료C', rank: 4, score: 72, totalMessages: perUser['동료C'].totalMessages, totalReactions: perUser['동료C'].totalReactions },
  ];
  return { perUser, ranking, createdAt };
}

function buildMockMyResult(nickname = '나', room){
  const u = room.perUser[nickname];
  const me = room.ranking.find(r => r.nickname === nickname) || { rank: 1, score: 96 };
  return {
    roomId: 'mock-room',
    rank: me.rank,
    score: me.score,
    totalMessages: u.totalMessages,
    totalReactions: u.totalReactions,
    labels: u.labels,
    topReacted: u.topReacted,
    createdAt: room.createdAt,
  };
}

export default function DiscussionResultMain() {
    const avatars = [
      { id: 'avatar1', src: avatar1 },
      { id: 'avatar2', src: avatar2 },
      { id: 'avatar3', src: avatar3 },
      { id: 'avatar4', src: avatar4 },
      { id: 'avatar5', src: avatar5 },
      { id: 'avatar6', src: avatar6 },
      { id: 'avatar7', src: avatar7 },
      { id: 'avatar8', src: avatar8 },
      { id: 'avatar9', src: avatar9 },
      { id: 'avatar10', src: avatar10 },
      { id: 'avatar11', src: avatar11 },
      { id: 'avatar12', src: avatar12 },
    ];
  function findAvatarById(id) {
    const found = avatars.find(a => a.id === id);
    console.log("found:",id);
    return found ? found.src : avatar1;
  }
  const { nickname, avatarUrl } = useUser();
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [myNickname, setMyNickname] = useState("");
  const [roomResult, setRoomResult] = useState(null); // { perUser, ranking, createdAt }
  const [myResult, setMyResult] = useState(null);     // { rank, score, totalMessages, totalReactions, labels, topReacted }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overallSummary, setOverallSummary] = useState("");

  const donutRef = useRef(null);
  const donutChartRef = useRef(null);

  const badgeMap = {
    justice: badgeJustice,
    passion: badgePassion,
    creativity: badgeCreativity,
    respect: badgeRespect
  };

  useEffect(() => {
    const rid = sessionStorage.getItem("lastRoomId") || "";
    const nick = sessionStorage.getItem("myNickname") || localStorage.getItem("nickname") || "";
    setRoomId(rid);
    setMyNickname(nick);

    async function load() {
      try {
        setLoading(true);
        setError("");
        if (!rid) throw new Error("roomId_missing");
        // fetch room & my results in parallel (http.get returns parsed JSON or throws)
        const roomReq = http.get(`/api/chat/result/${encodeURIComponent(rid)}`);
        const myReq = nick ? http.get(`/api/chat/my-result?nickname=${encodeURIComponent(nick)}`) : Promise.resolve(null);
        const [roomOutcome, myOutcome] = await Promise.allSettled([roomReq, myReq]);

        if (roomOutcome.status !== 'fulfilled') throw roomOutcome.reason || new Error('room_result_error');
        const roomData = roomOutcome.value;
        setRoomResult(roomData);
        console.log("[DiscussionResultMain] roomData", roomData);

                // --- Overall summary (once per room) ---
        try {
          // 1) 조회
          const getRes = await http.get(`/api/review/${encodeURIComponent(rid)}/overall-summary`);
          setOverallSummary(getRes?.summaryText || "");
        } catch (e1) {
          // 2) 없으면 생성(1회)
          try {
            const postRes = await http.post(`/api/review/${encodeURIComponent(rid)}/overall-summary`, {});
            setOverallSummary(postRes?.summaryText || "");
          } catch (e2) {
            setOverallSummary("");
          }
        }

        if (myOutcome.status === 'fulfilled' && myOutcome.value) {
          setMyResult(myOutcome.value);
          console.log("[DiscussionResultMain] myResult", myOutcome.value);
        } else {
          // fallback: derive my result from room perUser
          if (nick && roomData && roomData.perUser && roomData.perUser[nick]) {
            const u = roomData.perUser[nick];
            setMyResult({
              roomId: rid,
              rank: (roomData.ranking || []).find(r => r.nickname === nick)?.rank ?? undefined,
              score: (roomData.ranking || []).find(r => r.nickname === nick)?.score ?? undefined,
              totalMessages: u.totalMessages,
              totalReactions: u.totalReactions,
              labels: u.labels,
              topReacted: u.topReacted,
              createdAt: roomData.createdAt,
            });
          }
        }
      } catch (e) {
        // Fallback to mock data when API fails
        const nickSafe = nick || '나';
        const mockRoom = buildMockRoomResult(nickSafe);
        const mockMe = buildMockMyResult(nickSafe, mockRoom);
        setRoomResult(mockRoom);
        setMyResult(mockMe);
        console.log("[DiscussionResultMain] mockRoom", mockRoom);
        console.log("[DiscussionResultMain] mockMe", mockMe);
        setOverallSummary('토론 전반에 걸쳐 활발한 참여가 이루어졌습니다. 특히 정직과 열정 관련 메시지가 두드러졌으며, 팀 내 의사결정에 긍정적 영향을 주었습니다.');
        setError('');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Aggregate totals for hero copy (전체)
  const heroTotals = useMemo(() => {
    if (!roomResult) return { users: 0, messages: 0, reactions: 0, labels: 0 };
    const perUser = roomResult.perUser || {};
    let users = 0, messages = 0, reactions = 0, labels = 0;
    for (const nick of Object.keys(perUser)) {
      users += 1;
      const u = perUser[nick];
      messages += Number(u.totalMessages || 0);
      reactions += Number(u.totalReactions || 0);
      labels += Object.values(u.labels || {}).reduce((a,b)=>a+(b||0),0);
    }
    return { users, messages, reactions, labels };
  }, [roomResult]);

  const myLabelEntries = useMemo(() => {
    const L = myResult?.labels || { "정직":0, "열정":0, "창의":0, "존중":0 };
    const sum = Object.values(L).reduce((a,b)=>a+(b||0),0) || 1;
    const entries = ["정직","열정","창의","존중"].map(k => ({ key:k, val: Number(L[k]||0), pct: Math.round((Number(L[k]||0)/sum)*100) }));
    return { entries, sum };
  }, [myResult]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!donutRef.current) return;
      // destroy previous
      try { donutChartRef.current?.destroy?.(); } catch {}
      donutChartRef.current = null;

      const Chart = await ensureChartJS();
      if (!Chart || !alive) return;

      const labels = ['정직','열정','창의','존중'];
      const raw = labels.map(k => Number(myResult?.labels?.[k] || 0));
      for (let i = 0; i < raw.length; i++) raw[i] = Math.max(0, raw[i] || 0);
      const total = raw.reduce((a,b)=>a+b,0);
      const ctx = donutRef.current.getContext('2d');

      if (!total){
        // Placeholder when no data
        donutChartRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: { labels: ['데이터 없음'], datasets: [{ data: [1], backgroundColor: ['#EDEDED'], borderWidth: 0 }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            layout: { padding: { left: 24, right: 24, top: 30, bottom: 30 } },
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
          }
        });
      } else {
        // Percentages & rank-based colors
        const vals = raw.map(v => Math.round((v / total) * 100));
        const RANK_COLORS = ['#FF6620', '#FFCE7B', '#FFE3B3', '#EDEDED'];
        const sortedForColor = vals.map((v,i)=>({ v, i })).sort((a,b)=> b.v - a.v);
        const colorByIndex = Array(vals.length);
        const rankByIndex = Array(vals.length);
        sortedForColor.forEach((o, rank) => { colorByIndex[o.i] = RANK_COLORS[rank] || RANK_COLORS[3]; rankByIndex[o.i] = rank; });

        // Rank-based badge sizes
        const SIZE_BY_RANK = [156, 122, 122, 76];
        const badgeSizes = vals.map((_, i) => SIZE_BY_RANK[rankByIndex[i]] || 76);

        // Badge images (정직/열정/창의/존중)
        const badgeSources = {
          '정직': badgeJustice,
          '열정': badgePassion,
          '창의': badgeCreativity,
          '존중': badgeRespect,
        };
        const badgeImages = {};
        Object.entries(badgeSources).forEach(([k, src]) => {
          const img = new Image();
          img.src = src; // Vite handles asset path
          badgeImages[k] = img;
        });

        // Dynamic side padding based on largest badge
        const maxBadge = Math.max(...badgeSizes);
        const labelBlockH = 24;
        const sideBandPad = Math.ceil(maxBadge/2) + labelBlockH + 16;

        const nonZeroCount = vals.filter(v=>v>0).length;
        const useBadges = nonZeroCount >= 2;
        const layoutPadding = useBadges
          ? { left: sideBandPad, right: sideBandPad, top: 50, bottom: 50 }
          : { left: 24, right: 24, top: 30, bottom: 30 };

        // Plugin: external badges + one-elbow connector + inline tooltip text
        const badgePlugin = {
          id: 'persona-badges',
          afterDatasetsDraw(chart){
            if (!useBadges) return;
            const { ctx, chartArea } = chart;
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) return;

            const base = meta.data[0].getProps(['x','y','outerRadius'], true);
            const cx = base.x, cy = base.y, R = base.outerRadius;

            const items = meta.data.map((arc, idx) => {
              const label = chart.data.labels[idx];
              const img = badgeImages[label];
              if (!img) return null;
              const props = arc.getProps(['x','y','startAngle','endAngle','innerRadius','outerRadius'], true);
              const angle = (props.startAngle + props.endAngle) / 2;
              const ax = props.x + Math.cos(angle) * (props.outerRadius + 6);
              const ay = props.y + Math.sin(angle) * (props.outerRadius + 6);
              const onRight = Math.cos(angle) >= 0;
              const size0 = badgeSizes[idx] || 76;
              const value = vals[idx];
              return { idx, label, img, angle, ax, ay, onRight, size0, value };
            }).filter(Boolean);

            let left = items.filter(it => !it.onRight);
            let right = items.filter(it =>  it.onRight);

            function rebalance(from, to, isRightFrom){
              while (from.length > 2){
                from.sort((a,b) => Math.abs(a.ax - cx) - Math.abs(b.ax - cx));
                const mv = from.shift();
                mv.onRight = !isRightFrom;
                to.push(mv);
              }
            }
            if (right.length > 2) rebalance(right, left, true);
            if (left.length  > 2) rebalance(left,  right, false);

            left.sort((a,b)=> a.ay - b.ay);
            right.sort((a,b)=> a.ay - b.ay);

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
                bx: isRight ? (chartArea.right - 16) : (chartArea.left + 16),
                by: Math.max(bandTop + Math.round(it.size0*scale)/2, Math.min(bandBot - Math.round(it.size0*scale)/2, it.ay))
              }));

              for (let i=1;i<laid.length;i++){
                const prev = laid[i-1];
                const cur = laid[i];
                const minGap = (prev.size/2 + cur.size/2 + gap);
                if (cur.by - prev.by < minGap){ cur.by = prev.by + minGap; }
              }
              for (let i=laid.length-2;i>=0;i--){
                const next = laid[i+1];
                const cur = laid[i];
                const minGap = (cur.size/2 + next.size/2 + gap);
                if (next.by > bandBot){ next.by = bandBot - next.size/2; }
                if (next.by - cur.by < minGap){ cur.by = next.by - minGap; }
                if (cur.by < bandTop + cur.size/2){ cur.by = bandTop + cur.size/2; }
              }

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

            laidAll.forEach(it => {
              const { img, label, value, ax, ay, bx, by, size, onRight, idx } = it;
              if (!img.complete){ img.onload = () => chart.draw(); return; }
              ctx.save();

              const elbowX = onRight ? (bx - size/2 - 10) : (bx + size/2 + 10);
              const elbowY = ay;
              const endX   = onRight ? (bx - size/2 - 4)  : (bx + size/2 + 4);
              const endY   = by;

              // anchor dot
              ctx.beginPath();
              ctx.arc(ax, ay, 3, 0, Math.PI*2);
              ctx.fillStyle = '#FF6E37';
              ctx.fill();

              // elbow polyline
              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(elbowX, elbowY);
              ctx.lineTo(endX, endY);
              ctx.lineWidth = 2;
              ctx.lineJoin = 'round';
              ctx.strokeStyle = '#FF6E37';
              ctx.stroke();

              // badge image
              ctx.drawImage(img, bx - size/2, by - size/2, size, size);

              // one-line label under badge (centered)
              const labelText = `${label} `;
              const percentText = `${value}%`;
              ctx.font = '14px sans-serif';
              ctx.textBaseline = 'top';
              ctx.textAlign = 'left';
              const wLabel = ctx.measureText(labelText).width;
              const wPercent = ctx.measureText(percentText).width;
              const totalW = wLabel + wPercent;
              const baseY = by + size/2 + 6;
              let startX = bx - totalW / 2;

              // label
              ctx.fillStyle = '#555';
              ctx.fillText(labelText, startX, baseY);

              // percent with segment color (rank color)
              const segColor = (chart.data.datasets?.[0]?.backgroundColor?.[idx]) || '#FF6620';
              ctx.fillStyle = segColor;
              ctx.fillText(percentText, startX + wLabel, baseY);

              ctx.restore();
            });
          }
        };

        donutChartRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: { labels, datasets: [{ data: vals, backgroundColor: colorByIndex, borderWidth: 0 }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: true,
            cutout: '65%',
            layout: { padding: layoutPadding },
            plugins: { legend: { display: false }, tooltip: { enabled: true } }
          },
          plugins: useBadges ? [badgePlugin] : []
        });
      }
    })();
    return () => { alive = false; try { donutChartRef.current?.destroy?.(); } catch {} };
  }, [myResult]);

  // Ranking list (top 10)
  const ranking = roomResult?.ranking || [];
  const topN = ranking.slice(0, 10);

  if (loading) {
    return (
      <div className="discussion-result-main" style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"80vh" }}>
        <div>결과를 불러오는 중…</div>
      </div>
    );
  }

  if (error && !roomResult) {
    // 이 경우는 모의 데이터까지 생성되지 못했을 때만
    return (
      <div className="discussion-result-main" style={{ padding:"40px" }}>
        <p style={{ color:'#c00', fontWeight:800 }}>결과를 불러오지 못했습니다.</p>
        <pre style={{ background:'#fff', padding:'12px', borderRadius:8, border:'1px solid #eee' }}>{String(error || 'no_data')}</pre>
      </div>
    );
  }

  return (
    <div className="discussion-result-main">
      {/* 좌측 히어로 섹션 (고정, 비스크롤) */}
      <section className="dr-hero">
        <div className="dr-hero-body">

          <div className="dr-hero-copy">
            <p className="dr-hero-headline">
              멋진데요? 열띤 토론 덕에
뚜레주르의 ‘겹겹이초코퐁당’이
수레만큼 가득 모였어요.
            </p>
          <div className="dr-hero-visual">
            {/* TODO: 케이크/보트 모형 이미지 교체 */}
            <img className="dr-hero-img" src={heroSheep} alt="토론 열기 케이크 시각화" />
          </div>
            <div className="dr-hero-summary">
                      <img className="badge-img" src={aiIcon} alt="aiIcon"/>
              <div className="dr-hero-summary-text">
                {overallSummary ? 
                  overallSummary
                 : 
                  "총평을 준비하고 있습니다…"
                }
              </div>
            </div>
            <div className="dr-hero-actions">
              <SavePDFButton/>
              <NextSessionButton/>
              <button
                type="button"
                className="next-session-button"
                onClick={() => navigate('/user/loadResult')}
              >
                최종 결과
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 우측 스크롤 영역: 나의 레포트 + 랭킹 */}
      <div className="dr-scroll-area">
        {/* 나의 레포트 */}
        <section className="dr-my-report card">
          <div className="dr-card-header">
            <h2>{myNickname ? `나의 첫번째 토론 레포트` : '나의 토론 레포트'}</h2>
          </div>

          <div className="dr-card-body-2x2">
            {/* 1: 나의 등수/프로필 */}
            <div className="dr-profile">
              <div className="dr-top-quote-head">
                <span>나의 등수</span>
              </div>
<div className="my-avatar-wrap">
  <img className="avatar avatar--lg" src={findAvatarById(avatarUrl)} alt="내 프로필" />
  <div className="badge badge--overlay-lg">{rankLabel(myResult?.rank)}</div>
</div>
            </div>

            {/* 2: 인재상 분포 */}
            <div className="dr-distribution">
              <div className="dr-top-quote-head">
                <span>인재상 분포</span>
              </div>
              <div className="dr-donut-wrap">
                <canvas ref={donutRef} className="dr-donut-canvas" aria-label="인재상 분포 차트"></canvas>
              </div>
            </div>

            {/* 3: 참여 횟수 */}
            <div className="dr-participation">
               <div className="dr-top-quote-head">
                <span>참여 횟수</span>
              </div>
                  <div className="result-summary-box">
      <span className="result-summary-item lk"><i className="icon"/>+{myResult?.totalReactions || 0}건</span>
      <span className="result-summary-item ch"><i className="icon"/>+{myResult?.totalMessages || 0}건</span>
    </div>
                      <div className="result-category-summary-box">
      <span className="result-category-summary-item j"><i className="icon"/>+{myResult?.labels["정직"] || 0}건</span>
      <span className="result-category-summary-item p"><i className="icon"/>+{myResult?.labels["열정"] || 0}건</span>
      <span className="result-category-summary-item c"><i className="icon"/>+{myResult?.labels["창의"] || 0}건</span>
      <span className="result-category-summary-item r"><i className="icon"/>+{myResult?.labels["존중"] || 0}건</span>
    </div>
            </div>

            

            {/* 4: 가장 공감을 많이 받은 발언 */}
            <div className="dr-top-quote">
              <div className="dr-top-quote-head">
                <span>가장 공감을 많이 받은 발언</span>
                                <span className="likes-badge">
                  <i className="icon" />
                  {myResult?.topReacted?.reactionsCount ?? 0}
                </span>
                </div>
              <div className="dr-quote">
                {myResult?.topReacted?.text || '베스트 메시지가 없습니다.'}
              </div>
            </div>
          </div>
        </section>

        {/* 전체 랭킹 
        <aside className="dr-ranking card">
          <header className="dr-card-header">
            <h3>전체 랭킹</h3>
          </header>
          <ol className="dr-ranking-list">
            {topN.map((r, idx) => (
              <li key={r.nickname} className={`dr-ranking-item ${rankClass(idx)}`}>
                <div className="avatar-wrap">
                  <img className="avatar" src={user1Avatar} alt={`${r.nickname}`} />
                  <div className="badge badge--overlay">{rankLabel(r.rank)}</div>
                </div>
                <div className="meta">
                  <div className="name">{r.nickname}</div>
                  <div className="sub">❤️ {r.totalReactions} · 💬 {r.totalMessages}</div>
                </div>
              </li>
            ))}
          </ol>
        </aside>*/}
      </div>
    </div>
  );
}

function rankSuffix(rank){
  if (!rank || typeof rank !== 'number') return '';
  if (rank === 1) return 'ST';
  if (rank === 2) return 'ND';
  if (rank === 3) return 'RD';
  return 'TH';
}
function rankLabel(rank){
  if (!rank || typeof rank !== 'number') return '-';
  if (rank === 1) return '1ST';
  if (rank === 2) return '2ND';
  if (rank === 3) return '3RD';
  return `${rank}TH`;
}
function rankClass(idx){
  if (idx === 0) return 'first';
  if (idx === 1) return 'second';
  if (idx === 2) return 'third';
  return '';
}
function badgeKey(k){
  // 정직/열정/창의/존중 → justice/passion/creativity/respect (파일명 키 예시)
  if (k === '정직') return 'justice';
  if (k === '열정') return 'passion';
  if (k === '창의') return 'creativity';
  if (k === '존중') return 'respect';
  return 'badge';
}
