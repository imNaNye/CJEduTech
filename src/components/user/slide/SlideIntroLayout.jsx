//Context+Footer 감싸는 구조용 컴포넌트
// src/components/user/slide/SlideIntroLayout.jsx
import SlideContent from './SlideContent.jsx';
import SlideFooter from './SlideFooter.jsx';

export default function SlideIntroLayout() {
  return (
    <main className="slide-intro-layout">
      <SlideContent />
      <SlideFooter />
    </main>
  );
}