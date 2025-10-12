import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'
import './slide.css'

export default function AbilitySlide() {
  const { page, pageIndex, config } = useSlides()
  const title = page?.data?.title || ''
  const text = page?.data?.text || ''
  const targetIds = Object.keys(page?.targets || {})

  return (
    <div className="slide-page">
      <div className="slide-card">
        <div className="slide-indicator">
          슬라이드 {pageIndex + 1} / {config.length}
        </div>
        {text && (
          <p className="slide-subtitle" dangerouslySetInnerHTML={{ __html: text }} />
        )}
        {title && (
          <h2
            className="slide-title"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}

        <div className="target-grid" data-count={targetIds.length}>
          {targetIds.map((id) => (
            <ClickableTarget key={id} id={id} className="target-card" />
          ))}
        </div>

      </div>
      <p className="slide-footer">화면 아무곳이나 클릭하여 슬라이드를 재생해 주세요!</p>
    </div>
  )
}