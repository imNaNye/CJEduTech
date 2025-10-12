import React from 'react'
import { useSlides } from './SlideProvider'

export default function ClickableTarget({ id, as: Tag = 'button', className = '', children }) {
  const { page, flipping } = useSlides()

  const content = page?.targets?.[id] ?? null
  const title = content?.title ?? id
  const postText = content?.postText ?? ''
  const image = content?.image ?? ''

  const isFlipped = Boolean(flipping)

  const classes = [
    'target-card',
    className,
    isFlipped ? 'flipped' : ''
  ]
    .filter(Boolean)
    .join(' ')

  // Inline styles to ensure front/back are mutually exclusive even if global CSS is missing
  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    perspective: '1000px',
  }

  const innerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
  }

  const faceBase = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden'
  }

  const frontStyle = {
    ...faceBase,
    transform: 'rotateY(0deg)'
  }

  const backStyle = {
    ...faceBase,
    transform: 'rotateY(180deg)'
  }

  return (
    <Tag type="button" className={classes} disabled aria-disabled="true" style={{ position: 'relative' }}>
      <div style={containerStyle}>
        <div className="card-inner" style={innerStyle}>
          <div className="card-face front" style={frontStyle}>
            {image ? <img className="icon" src={image} alt="" /> : <div className="icon" />}
            <div className="label">{title}</div>
          </div>

          <div className="card-face back" style={backStyle}>
            <div className="desc">{postText}</div>
            <div className="label">{title}</div>
          </div>
        </div>
      </div>

      {children ? <div style={{ position: 'absolute', inset: 8, pointerEvents: 'none' }}>{children}</div> : null}
    </Tag>
  )
}