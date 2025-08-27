
import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'

export default function AttitudeSlide() {
  const { page } = useSlides()
  return (
    <section>
      <h2>{page.data.title}</h2>

      {/* ClickableTarget 외 컴포넌트 */}

      {/* 필수 타깃 버튼들 */}
      <ClickableTarget id="attitude.a" />
      <ClickableTarget id="attitude.b" />
      <ClickableTarget id="attitude.c" />
      <ClickableTarget id="attitude.d" />
      <ClickableTarget id="attitude.e" />
    </section>
  )
}