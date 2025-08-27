// src/routes/SlideRenderer.jsx
import { useSlides } from './SlideProvider.jsx'
import { useSlideProgress } from './useSlideProgress'
import { pageComponentMap } from './pageComponentMap' // page.id -> 컴포넌트 매핑

export default function SlideRenderer() {
  const { page, pageIndex, setPageIndex, config } = useSlides()
  const { clickedCount, requiredCount, remainingIds, allDone } = useSlideProgress()

  if (!page) return <div>끝</div>

  const PageComponent = pageComponentMap[page.id]
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

      {/* 실제 화면 */}
      {PageComponent ? <PageComponent /> : <div>구현되지 않은 페이지: {page.id}</div>}

      <nav>
        <button onClick={() => setPageIndex(i => Math.max(0, i - 1))} disabled={pageIndex === 0}>
          이전
        </button>
        <button onClick={() => setPageIndex(i => Math.min(config.length - 1, i + 1))} disabled={!allDone}>
          다음
        </button>
      </nav>
    </div>
  )
}