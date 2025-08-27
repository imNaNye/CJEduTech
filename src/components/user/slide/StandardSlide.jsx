
import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'

export default function StandardSlide() {
  const { page } = useSlides()
  return (
    <section>
      <h2>{page.data.title}</h2>

      {/* ClickableTarget 외 컴포넌트 */}

      {/* 필수 타깃 버튼들 */}
      <ClickableTarget id="standard.a" />
      <ClickableTarget id="standard.b" />
      <ClickableTarget id="standard.c" />
      <ClickableTarget id="standard.d" />
    </section>
  )
}