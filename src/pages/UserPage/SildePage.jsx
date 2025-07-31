// src/pages/UserPage/SlidePage.jsx
import PageHeader from '../../components/common/PageHeader.jsx';
import SlideIntroLayout from '../../components/user/slide/SlideIntroLayout.jsx';
import '../../components/user/slide/slide.css';

export default function SlidePage() {
  return (
    <div className="slide-page">
      <PageHeader title="인트로 슬라이드" />
      <SlideIntroLayout />
    </div>
  );
}