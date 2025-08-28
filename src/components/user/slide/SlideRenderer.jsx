// src/components/user/slide/SlideRenderer.jsx
import { useSlides } from './SlideProvider.jsx'
import { useSlideProgress } from './useSlideProgress'
import { pageComponentMap } from './pageComponentMap'
import { useNavigate } from 'react-router-dom'   // 👈 추가

export default function SlideRenderer() {
  const { page, pageIndex, setPageIndex, config } = useSlides()
  const { clickedCount, requiredCount, remainingIds, allDone } = useSlideProgress()
  const navigate = useNavigate()   // 👈 추가

  if (!page) return <div>끝</div>

  const PageComponent = pageComponentMap[page.id]

  const handleNext = () => {
    if (pageIndex === config.length - 1 && allDone) {
      // 모든 슬라이드 끝났으면 원하는 경로로 이동
      navigate('/user/quiz') 
    } else {
      // 아직 마지막이 아니면 다음 슬라이드로
      setPageIndex(i => Math.min(config.length - 1, i + 1))
    }
  }

  return (
    <div>
      <header>
        <div>페이지 {pageIndex + 1} / {config.length}</div>
        <div>필수 {clickedCount}/{requiredCount}</div>
        {!allDone && remainingIds.length > 0 ? (
          <div>남은 항목: {remainingIds.join(', ')}</div>
        ) : null}
        {allDone && page.timeoutSec > 0 ? (
          <div>{page.timeoutSec}초 뒤 자동 이동</div>
        ) : null}
      </header>

      {PageComponent ? <PageComponent /> : <div>구현되지 않은 페이지: {page.id}</div>}

      <nav>
        <button onClick={() => setPageIndex(i => Math.max(0, i - 1))} disabled={pageIndex === 0}>
          이전
        </button>
        <button onClick={handleNext} disabled={!allDone}>
          다음
        </button>
      </nav>
    </div>
  )
}