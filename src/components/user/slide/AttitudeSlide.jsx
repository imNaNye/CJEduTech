import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'
import './slide.css'

export default function AttitudeSlide() {
  const { page } = useSlides()
  const title = page?.data?.title || ''
  const text = page?.data?.text || ''
  const targetIds = Object.keys(page?.targets || {})

  return (
    <div className="slide-page">
      <div className="slide-card">
        {text && (
          <p className="slide-subtitle" dangerouslySetInnerHTML={{ __html: text }} />
        )}
        {title && (
          <h2 className="slide-title" dangerouslySetInnerHTML={{ __html: title }} />
        )}

        <div className="target-grid" data-count={targetIds.length}>
          {targetIds.map((id) => (
            <ClickableTarget key={id} id={id} className="target-card" />
          ))}
        </div>

      </div>
      <p className="slide-footer">슬라이드는 자동 전환되며, 종료 후 퀴즈 화면으로 전환됩니다.</p>
    </div>
  )
}