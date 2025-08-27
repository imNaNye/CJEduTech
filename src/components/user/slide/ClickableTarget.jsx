// src/slides/ClickableTarget.jsx
import React from 'react';
import { useSlides } from './SlideProvider';

export default function ClickableTarget({ id, as: Tag = 'button', onClick, children }) {
  const { markClicked, clickedSet, required, page, isBlocked, msRemaining } = useSlides();
  const isRequired = required.includes(id);
  const isDone = clickedSet.has(id);

  const content = page?.targets?.[id] ?? null;
  const title = content?.title ?? id;
  const postText = content?.postText ?? '';
  const image = content?.image ?? '';

  const handleClick = (e) => {
    if (onClick) onClick(e);
    const res = markClicked(id);
    if (!res?.ok && res?.reason === 'cooldown') {
      // 필요시 안내 로깅/토스트 등
      // console.log(`대기 중: ${res.waitMs}ms`);
    }
  };

  return (
    <Tag onClick={handleClick} disabled={isBlocked} aria-disabled={isBlocked ? 'true' : 'false'}>
      <div>{title} {isRequired ? '(필수)' : null}</div>
      {!isDone ? <img src={image} /> : null}
      <div>{isDone ? postText : null}</div>
      {isBlocked ? <div>다음 클릭까지 {Math.ceil(msRemaining/1000)}초 대기</div> : null}
      {children}
    </Tag>
  );
}