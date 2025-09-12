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
  const [progress, setProgress] = useState(0); // 0 ~ 100 percent
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
    v.playsInline = true;
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
      <PageHeader title={content.title} />
      <section className='video-main'>
        <div className="video-player">
          <div className="video-progress">
            <div
              className="video-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <video
            className="video-element"
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
              const v = e.currentTarget;
              if (!videoEnded) {
                const p = v.play();
                if (p && typeof p.catch === 'function') {
                  p.catch(() => {/* ignore */});
                }
              }
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (!lockSeekRef.current) {
                lastTimeRef.current = v.currentTime;
              }
              if (v.duration) {
                setProgress((v.currentTime / v.duration) * 100);
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
        </div>
        <button
          className='finish-button'
          disabled={!videoEnded}
          onClick={() => {
            setStep(3);
            navigate('/user/roundIndicator');
          }}
        >
          {videoEnded
            ? "영상 시청 종료"
            : "영상은 자동 재생됩니다. 조작이 불가하니 집중해서 시청해 주세요."}
        </button>
        <VideoFooter/> 
      </section>
    </div>
  );
}