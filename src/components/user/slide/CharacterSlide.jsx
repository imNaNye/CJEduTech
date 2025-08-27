
import { useSlides } from './SlideProvider'
import ClickableTarget from './ClickableTarget'

export default function  CharacterSlide() {
  const { page } = useSlides()
  return (
    <section>
      <h2>{page.data?.title}</h2>

      {/* ClickableTarget 외 컴포넌트 */}

      {/* 필수 타깃 버튼들 */}
      <ClickableTarget id="character.a" />
      <ClickableTarget id="character.b" />
      <ClickableTarget id="character.c" />
      <ClickableTarget id="character.d" />
      <ClickableTarget id="character.e" />
      <ClickableTarget id="character.f" />
      <ClickableTarget id="character.g" />
      <ClickableTarget id="character.h" />
    </section>
  )
}