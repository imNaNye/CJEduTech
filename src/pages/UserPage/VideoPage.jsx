import { useState, useRef, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import VideoFooter from '../../components/user/video/VideoFooter';
import { useRoundStep } from '../../contexts/RoundStepContext';
import { videoByRound } from '../../contents/videoByRound';
import '../../components/user/video/video.css';
import { useNavigate } from 'react-router-dom';

export default function VideoPage({ onComplete }) {
  const { round, step, setStep, videoId, setVideoId } = useRoundStep();
  const [videoEnded, setVideoEnded] = useState(false);
  const [progress, setProgress] = useState(0); // 0 ~ 100 percent
  const videoRef = useRef(null);
  const lockSeekRef = useRef(false);
  const lastTimeRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const navigate = useNavigate();
  const API_BASE = import.meta.env?.VITE_API_URL || '';
  // 별도의 동영상 CDN/S3/CloudFront를 사용할 경우 .env에 VITE_VIDEO_BASE 를 지정하세요.
  // 지정하지 않으면 API_BASE를 기본 프리픽스로 사용합니다.
  const VIDEO_BASE = import.meta.env?.VITE_VIDEO_BASE || API_BASE;
  const unmuteAndPlay = () => {
    setMuted(false);
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {/* autoplay policy may still block until next gesture */});
      }
    }
  };
  const playlist = videoByRound[round] || [];
  const content = playlist[videoId];
  const videoSrc = content?.src?.startsWith('http') ? content.src : `${VIDEO_BASE}${content?.src || ''}`;

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
  }, [round, videoId]);

  useEffect(() => {
    // Chrome/iOS 정책: 사용자 제스처 이후에만 소리 재생 허용
    const handler = () => {
      if (muted) unmuteAndPlay();
      window.removeEventListener('pointerdown', handler, true);
    };
    window.addEventListener('pointerdown', handler, true);
    return () => window.removeEventListener('pointerdown', handler, true);
  }, [round, videoId, muted]);

  if (!content) return <div>이 라운드의 영상이 없습니다.</div>;
  const isLast = videoId === playlist.length - 1;

  return (
    <div className='video-page'>
      <PageHeader title={`${content.title} (${videoId + 1} / ${playlist.length})`} />
      <section
        className='video-main'
        onClick={() => {
          setClickCount(prev => {
            const next = prev + 1;
            if (next >= 10) {
              navigate('/admin/aiDiscussion');
            }
            return next;
          });
        }}
      >
        <div className="video-player">
          <div className="video-progress">
            <div
              className="video-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!videoEnded && muted && (
            <button
              type="button"
              onClick={unmuteAndPlay}
              style={{
                position: 'absolute', right: 12, top: 12,
                zIndex: 3, padding: '6px 10px', borderRadius: 8,
                border: '0', background: 'rgba(0,0,0,0.55)', color: '#fff',
                fontSize: 12, cursor: 'pointer'
              }}
            >
              🔊 소리 켜기
            </button>
          )}
          <video
            className="video-element"
            key={`${round}-${videoId}`}
            ref={videoRef}
            src={videoSrc}
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
            if (!videoEnded) return;
            else {
              navigate('/admin/aiDiscussion');
            }
          }}
        >
          {videoEnded
            ? (isLast ? '영상 시청 종료' : '영상 시청 종료')
            : '영상은 자동 재생됩니다. 한 번 클릭해서 음소거를 해제해 주세요.'}
        </button>
      </section>
    </div>
  );
}