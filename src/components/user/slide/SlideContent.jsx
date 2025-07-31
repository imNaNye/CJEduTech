//슬라이드 본문 텍스트+이미지


export default function SlideContent() {
  return (
    <div className="slide-content">
      <img className="slide-image" src="/slides/sample-slide.png" alt="슬라이드 이미지" />
      <p className="slide-text">이것은 임시 슬라이드 내용입니다. 실제 콘텐츠가 여기에 표시됩니다.</p>
    </div>
  );
}