import { useState, useRef, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import VideoFooter from '../../components/user/video/VideoFooter';
import { useRoundStep } from '../../contexts/RoundStepContext';
import { videoByRound } from '../../contents/videoByRound';
import '../../components/user/video/video.css';
import { useNavigate } from 'react-router-dom';

export default function VideoPage({ onComplete }) {
  const { round, step, setStep } = useRoundStep();
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);
  const lockSeekRef = useRef(false);
  const lastTimeRef = useRef(0);
  const [muted] = useState(true);
  const navigate = useNavigate();
  const content = videoByRound[round];

  useEffect(() => {
    setVideoEnded(false);
    const v = videoRef.current;
    if (!v) return;
    // iOS/Safari 호환: 인라인 재생 강제
    v.playsInline = true;
    // 자동 재생 시도 (Muted 필요)
    const tryPlay = () => {
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {/* ignore autoplay block */});
      }
    };
    if (v.readyState >= 2) tryPlay();
    else v.addEventListener('loadeddata', tryPlay, { once: true });
  }, [round]);

  if (!content) return <div>이 라운드의 영상이 없습니다.</div>;

  return (
    <div className='video-page'>
      <PageHeader title={content.title}></PageHeader>
      <section>
        <video
          key={round}
          ref={videoRef}
          src={content.src}
          autoPlay
          playsInline
          muted={muted}
          controls={false}
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          tabIndex={-1}
          style={{ pointerEvents: 'none' }}
          onRateChange={(e) => {
            const v = e.currentTarget;
            if (v.playbackRate !== 1) v.playbackRate = 1;
          }}
          onPause={(e) => {
            // 사용자가 어떤 방식으로든 일시정지되어도 즉시 다시 재생
            const v = e.currentTarget;
            if (!videoEnded) {
              const p = v.play();
              if (p && typeof p.catch === 'function') {
                p.catch(() => {/* ignore */});
              }
            }
          }}
          onTimeUpdate={(e) => {
            if (!lockSeekRef.current) {
              lastTimeRef.current = e.currentTarget.currentTime;
            }
          }}
          onSeeking={(e) => {
            const v = e.currentTarget;
            const allowed = lastTimeRef.current;
            if (!lockSeekRef.current && Math.abs(v.currentTime - allowed) > 0.25) {
              lockSeekRef.current = true;
              v.currentTime = allowed;
              setTimeout(() => { lockSeekRef.current = false; }, 0);
            }
          }}
          onEnded={() => {
            setVideoEnded(true);
          }}
        />
        <button
          className='finish-button'
          disabled={!videoEnded}
          onClick={() => {
            setStep(3);
            navigate('/user/roundIndicator');
          }}
        >
          영상 시청 완료
        </button>
        <VideoFooter/>
      </section>
    </div>
  );
}