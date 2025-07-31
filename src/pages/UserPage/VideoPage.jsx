import PageHeader from '../../components/common/PageHeader';
import VideoPlayer from '../../components/user/video/VideoPlayer';
import VideoFooter from '../../components/user/video/VideoFooter';
import '../../components/user/video/video.css';

export default function VideoPage() {
  return (
    <div className="video-page">
      <PageHeader title="시나리오 영상 시청" />
      <main className="video-main">
        <VideoPlayer />
        <VideoFooter />
      </main>
    </div>
  );
}