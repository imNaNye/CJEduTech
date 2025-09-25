// src/components/user/slide/ClickableTarget.jsx
import React from 'react'
import { useSlides } from './SlideProvider'

export default function ClickableTarget({ id, as: Tag = 'button', onClick, className = '', children }) {
  const { markClicked, clickedSet, required, page, isBlocked, nextRequiredId } = useSlides()

  const isRequired = required.includes(id)
  const isDone = clickedSet.has(id)
  const isNext = id === nextRequiredId

  const content = page?.targets?.[id] ?? null
  const title = content?.title ?? id
  const postText = content?.postText ?? ''
  const image = content?.image ?? ''

  const handleClick = (e) => {
    if (onClick) onClick(e)
    markClicked(id)
  }

  const classes = [
    'target-card',
    className,
    isBlocked ? 'is-disabled' : '',
    isDone ? 'is-active' : '',
    isNext ? 'is-next' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag type="button" className={classes} onClick={handleClick} disabled={isBlocked} aria-disabled={isBlocked ? 'true' : 'false'}>
      {/* 첫 번째 행: 이미지 또는 설명 텍스트 (고정 높이 영역) */}
      {!isDone ? (
        image ? <img className="icon" src={image} alt="" /> : <div className="icon" />
      ) : (
        <div className="desc">{postText}</div>
      )}

      {/* 두 번째 행: 라벨 */}
      <div className="label">
        {title}
      </div>

      {/* children 사용 시에도 카드 높이 변화가 없도록 별도 레이어로 렌더 */}
      {children ? <div style={{ position: 'absolute', inset: 8, pointerEvents: 'none' }}>{children}</div> : null}
    </Tag>
  )
}