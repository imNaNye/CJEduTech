
import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'

export default function SkillSlide() {
  const { page } = useSlides()
  return (
    <section>
      <h2>{page.data.title}</h2>

      {/* ClickableTarget 외 컴포넌트 */}

      {/* 필수 타깃 버튼들 */}
      <ClickableTarget id="skill.a" />
      <ClickableTarget id="skill.b" />
      <ClickableTarget id="skill.c" />
      <ClickableTarget id="skill.d" />
      <ClickableTarget id="skill.e" />
      <ClickableTarget id="skill.f" />
      
    </section>
  )
}