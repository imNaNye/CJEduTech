import React, { useEffect, useState } from 'react'
import { useSlides } from './SlideProvider'

export default function ClickableTarget({ id, as: Tag = 'button', className = '', children }) {
  const { page, flipping } = useSlides()
  const [localFlipped, setLocalFlipped] = useState(false)
  const [highlighted, setHighlighted] = useState(false)

  const content = page?.targets?.[id] ?? null
  const title = content?.title ?? id
  const postText = content?.postText ?? ''
  const image = content?.image ?? ''

  // Determine this target's index relative to the page's requiredTargets (fallback to keys order)
  const targetIndex = (() => {
    if (!page) return -1
    if (Array.isArray(page.requiredTargets)) return page.requiredTargets.indexOf(id)
    // fallback: try to find index in Object.keys(page.targets)
    const keys = page.targets ? Object.keys(page.targets) : []
    return keys.indexOf(id)
  })()

  // Combined flipped state: global flipping OR per-target local flip event
  const isFlipped = Boolean(flipping) || localFlipped

  // Reset local flip whenever page changes or id changes
  useEffect(() => {
    setLocalFlipped(false)
  }, [page?.id, id])

  // Listen for flip, highlight, unhighlight, and unflip events for this target index
  useEffect(() => {
    if (targetIndex < 0) return undefined

    const eventName = `flipTarget-${targetIndex}`
    const handler = () => setLocalFlipped(true)

    const highlightEventName = `highlightTarget-${targetIndex}`
    const unhighlightEventName = `unhighlightTarget-${targetIndex}`
    const highlightHandler = () => {
      setHighlighted(true)
    }
    const unhighlightHandler = () => {
      setHighlighted(false)
    }

    const unflipEventName = `unflipTarget-${targetIndex}`
    const unflipHandler = () => setLocalFlipped(false)

    window.addEventListener(eventName, handler)
    window.addEventListener(highlightEventName, highlightHandler)
    window.addEventListener(unhighlightEventName, unhighlightHandler)
    window.addEventListener(unflipEventName, unflipHandler)
    return () => {
      window.removeEventListener(eventName, handler)
      window.removeEventListener(highlightEventName, highlightHandler)
      window.removeEventListener(unhighlightEventName, unhighlightHandler)
      window.removeEventListener(unflipEventName, unflipHandler)
    }
  }, [targetIndex])

  const classes = [
    'target-card',
    className,
    isFlipped ? 'flipped' : '',
    highlighted ? 'highlighted' : ''
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
        <div className="card-inner" style={{ position: 'relative', width: '100%', height: '100%' }}>
          {!isFlipped ? (
            <div className="card-face front" style={frontStyle}>
              {image ? <img className="icon" src={image} alt="" /> : <div className="icon" />}
              <div className="label">{title}</div>
            </div>
          ) : (
            <div className="card-face back" style={backStyle}>
              <div className="desc">{postText}</div>
              <div className="label">{title}</div>
            </div>
          )}
        </div>
      </div>

      {children ? <div style={{ position: 'absolute', inset: 8, pointerEvents: 'none' }}>{children}</div> : null}
    </Tag>
  )
}