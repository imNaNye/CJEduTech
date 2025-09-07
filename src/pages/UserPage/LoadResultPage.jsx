import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../components/user/finalResult/loadResultPage.css';

export default function LoadResultPage(){
  const navigate = useNavigate();
  const location = useLocation();
  const search = new URLSearchParams(location.search);

  const initialRoomId = useMemo(() => (
    search.get('roomId') || location.state?.roomId || localStorage.getItem('roomId') || ''
  ), [location.search, location.state]);

  const initialNickname = useMemo(() => (
    search.get('nickname') || location.state?.nickname || localStorage.getItem('nickname') || ''
  ), [location.search, location.state]);

  const [roomId] = useState(initialRoomId);
  const [nickname] = useState(initialNickname);
  const [status, setStatus] = useState('init'); // init | requesting | success | error
  const [message, setMessage] = useState('최종 결과를 준비하고 있습니다…');

  useEffect(() => {
    let aborted = false;
    async function run(){
      if (!roomId){
        setStatus('error');
        setMessage('roomId가 없습니다. URL 파라미터 또는 state로 전달해주세요.');
        return;
      }
      setStatus('requesting');
      setMessage('라운드 기록을 합산 중…');
      try{
        const res = await fetch(`/api/review/${encodeURIComponent(roomId)}/final-result?force=${encodeURIComponent('true')}`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ nickname })
        });
        if (!res.ok){ throw new Error(`HTTP ${res.status}`); }
        const data = await res.json();
        if (aborted) return;
        setStatus('success');
        setMessage('완료되었습니다. 결과 페이지로 이동합니다…');
        // FinalResultPage로 이동 (라우트 경로는 프로젝트 라우터에 맞춰 조정)
        navigate(`/user/finalResult?roomId=${encodeURIComponent(roomId)}&nickname=${encodeURIComponent(nickname||'')}`,
          { replace: true, state: { roomId, nickname, finalSeed: Date.now(), serverCached: !!data.cached } });
      }catch(err){
        console.error('[final-result] create failed', err);
        if (aborted) return;
        setStatus('error');
        setMessage('최종 결과 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
    run();
    return () => { aborted = true };
  }, [roomId, nickname, navigate]);

  return (
    <div className="load-page">
      <div className={`loader ${status}`} aria-busy={status==='requesting'} />
      <p className="load-message">{message}</p>
      <div className="load-meta">
        <div><b>roomId</b>: {roomId||'-'}</div>
        <div><b>nickname</b>: {nickname||'-'}</div>
      </div>
    </div>
  );
}