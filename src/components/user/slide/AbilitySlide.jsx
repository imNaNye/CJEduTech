
import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'

export default function AbilitySlide() {
  const { page } = useSlides()
  return (
    <section>
      <h2>{page.data.title}</h2>

      {/* ClickableTarget 외 컴포넌트 */}
        <p>{page.data.text}</p>
      {/* 필수 타깃 버튼들 */}
      <ClickableTarget id="ability.a" />
      <ClickableTarget id="ability.b" />
      <ClickableTarget id="ability.c" />
    </section>
  )
}