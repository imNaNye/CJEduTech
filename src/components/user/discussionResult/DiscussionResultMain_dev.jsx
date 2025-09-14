import { useEffect, useMemo, useState } from "react";
import SavePDFButton from "./SavePDFButton";
import NextSessionButton from "./NextSessionButton";
import "./discussionResult.css";
import { http } from '@/lib/http' ;

export default function DiscussionResultMain() {
  const [roomId, setRoomId] = useState("");
  const [myNickname, setMyNickname] = useState("");
  const [roomResult, setRoomResult] = useState(null); // { perUser, ranking, createdAt }
  const [myResult, setMyResult] = useState(null);     // { rank, score, totalMessages, totalReactions, labels, topReacted }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overallSummary, setOverallSummary] = useState("");
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
        setError(e?.message || "failed_to_load");
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

  if (error || !roomResult) {
    return (
      <div className="discussion-result-main" style={{ padding:"40px" }}>
        <p style={{ color:'#c00', fontWeight:800 }}>결과를 불러오지 못했습니다.</p>
        <pre style={{ background:'#fff', padding:'12px', borderRadius:8, border:'1px solid #eee' }}>{String(error || 'no_data')}</pre>
      </div>
    );
  }

  return (
    <div className="discussion-result-main" style={{ display:"flex", flexDirection:"row", alignItems:"flex-start", gap:"24px" }}>
      {/* 좌측 히어로 섹션 (고정, 비스크롤) */}
      <section className="dr-hero">
        <div className="dr-hero-body">
          <div className="dr-hero-visual">
            {/* TODO: 케이크/보트 모형 이미지 교체 */}
            <img className="dr-hero-img" src="/src/assets/images/discussion/1_cart.png" alt="토론 열기 케이크 시각화" />
          </div>
          <div className="dr-hero-copy">
            <p className="dr-hero-headline">
              대단해요! 이번 토론의 열기 덕에<br/>
              총 <b>{heroTotals.messages}</b>개의 의견과 <b>{heroTotals.reactions}</b>개의 공감이 모였어요.
            </p>
            <div className="dr-hero-summary">
              <div className="dr-hero-summary-text">
                {overallSummary ? (
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{overallSummary}</pre>
                ) : (
                  <span style={{ color: '#888' }}>총평을 준비하고 있습니다…</span>
                )}
              </div>
            </div>
            <div className="dr-hero-actions">
              <SavePDFButton/>
              <NextSessionButton/>
            </div>
          </div>
        </div>
      </section>

      {/* 우측 스크롤 영역: 나의 레포트 + 랭킹 */}
      <div className="dr-scroll-area">
        {/* 나의 레포트 */}
        <section className="dr-my-report card">
          <div className="dr-card-header">
            <h2>{myNickname ? `${myNickname}의 토론 레포트` : '(나의 토론 레포트)'}</h2>
          </div>

          <div className="dr-card-body">
            {/* 좌측: 등수/프로필 */}
            <div className="dr-profile">
              <div className="dr-rank-badge">
                <span className="rank-num">{myResult?.rank ?? '-'}</span>
                <span className="rank-suffix">{rankSuffix(myResult?.rank)}</span>
              </div>
              <div className="dr-avatar">
                <img src="/assets/to-be-decided/my_avatar.jpg" alt="내 프로필" />
              </div>
              <div className="dr-metrics-inline">
                <div className="metric" title="받은 공감 수">
                  <span className="icon">❤️</span>
                  <span className="val">{myResult?.totalReactions ?? 0}</span>
                  <span className="sep">·</span>
                  <span className="icon">💬</span>
                  <span className="val">{myResult?.totalMessages ?? 0}</span>
                </div>
              </div>
            </div>

            {/* 우측: 인재상 분포 */}
            <div className="dr-distribution">
              <div className="dr-donut-wrap">
                {/* TODO: 실제 도넛 차트/이미지로 교체 */}
                <img className="dr-donut" src="/assets/to-be-decided/donut_placeholder.png" alt="인재상 분포 도넛" />
              </div>
              <ul className="dr-traits">
                {myLabelEntries.entries.map(({key,val,pct}) => (
                  <li key={key} className="trait">
                    <img src={`/assets/to-be-decided/badge_${badgeKey(key)}.png`} alt={key} />
                    <span className="name">{key}</span>
                    <span className="pct">{pct}% ({val})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 하단: 참여/베스트 멘트 */}
          <div className="dr-card-footer">
            <div className="dr-participation">
              <div className="pill" title="내가 작성한 메시지 수">
                <span className="icon">💬</span>
                <span className="val">{myResult?.totalMessages ?? 0}건</span>
              </div>
              <div className="pill" title="내 메시지에 달린 반응 합계">
                <span className="icon">🧡</span>
                <span className="val">+{myResult?.totalReactions ?? 0}</span>
              </div>
              <div className="pill" title="내 메시지에 부여된 라벨 합계">
                <span className="icon">🔖</span>
                <span className="val">라벨 {myLabelEntries.sum}건</span>
              </div>
            </div>

            <div className="dr-top-quote">
              <div className="dr-top-quote-head">
                <span>가장 공감을 많이 받은 발언</span>
                <span className="likes">❤️ {myResult?.topReacted?.reactionsCount ?? 0}</span>
              </div>
              <blockquote className="dr-quote">
                {myResult?.topReacted?.text || '베스트 메시지가 없습니다.'}
              </blockquote>
            </div>
          </div>
        </section>

        {/* 전체 랭킹 */}
        <aside className="dr-ranking card">
          <header className="dr-card-header">
            <h3>전체 랭킹</h3>
          </header>
          <ol className="dr-ranking-list">
            {topN.map((r, idx) => (
              <li key={r.nickname} className={`dr-ranking-item ${rankClass(idx)}`}>
                <div className="badge">{rankLabel(r.rank)}</div>
                <img className="avatar" src="/assets/to-be-decided/user1.jpg" alt={`${r.nickname}`} />
                <div className="meta">
                  <div className="name">{r.nickname}</div>
                  <div className="sub">❤️ {r.totalReactions} · 💬 {r.totalMessages}</div>
                </div>
              </li>
            ))}
          </ol>
        </aside>
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