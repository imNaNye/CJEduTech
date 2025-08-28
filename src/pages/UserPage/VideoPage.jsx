import PageHeader from '../../components/common/PageHeader';
import VideoPlayer from '../../components/user/video/VideoPlayer';
import VideoFooter from '../../components/user/video/VideoFooter';
import { useRoundStep } from '../../contexts/RoundStepContext';
import { videoByRound } from '../../contents/videoByRound';
import '../../components/user/video/video.css';

export default function VideoPage({ onComplete }) {
  const { round } = useRoundStep();
  const content = videoByRound[round];

  if (!content) return <div>이 라운드의 영상이 없습니다.</div>;

  return (
    <section>
      <h2>{content.title}</h2>
      {/* 기존 플레이어 자리에 src만 라운드별로 바꿔 꽂기 */}
      <video src={content.src} controls />
      {/* 완료 버튼(또는 플레이어의 onEnded 이벤트로 onComplete 호출) */}
      <button onClick={onComplete}>영상 시청 완료</button>
    </section>
  );
}