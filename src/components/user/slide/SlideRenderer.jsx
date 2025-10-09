import { useEffect } from 'react'
import { useSlides } from './SlideProvider.jsx'
import { useSlideProgress } from './useSlideProgress'
import { pageComponentMap } from './pageComponentMap'
import './slide.css';
import { useNavigate } from 'react-router-dom'
import { RoundStepProvider, useRoundStep } from '../../../contexts/RoundStepContext.jsx'
import PageHeader from '@/components/common/PageHeader.jsx';

export default function SlideRenderer() {
  const { page, pageIndex, setPageIndex, config } = useSlides()
  const { clickedCount, requiredCount, remainingIds, allDone } = useSlideProgress()
  const navigate = useNavigate()   // 👈 추가
  const { round, setRound, step, setStep } = useRoundStep()

  const lastIndex = config.length - 1

  if (!page) return <div>끝</div>

  useEffect(() => {
    if (pageIndex === lastIndex && allDone) {
      setRound(1)
      setStep(2)
      navigate('/user/afterSlide')
    }
  }, [pageIndex, lastIndex, allDone, navigate, setRound, setStep])

  setStep(2)
  setRound(1)

  const PageComponent = pageComponentMap[page.id]

  const handleNext = () => {
    if (pageIndex === config.length - 1 && allDone) {
      // 모든 슬라이드 끝났으면 원하는 경로로 이동
      setRound(1)
      setStep(2)
      navigate('/user/afterSlide') 
    } else {
      // 아직 마지막이 아니면 다음 슬라이드로
      setPageIndex(i => Math.min(config.length - 1, i + 1))
    }
  }

  return (
    <div className="slide-div">
      <PageHeader title='CJ인 인재상 교육'></PageHeader>
      {PageComponent ? <PageComponent /> : <div>구현되지 않은 페이지: {page.id}</div>}
    </div>
  )
}