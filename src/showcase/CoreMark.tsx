import type { CSSProperties } from 'react'
import { coreStyle } from './roster.ts'
import './commandCenter.css'

export function CoreMark({ slug, color, size = 36, title }: { slug: string; color: string; size?: number; title?: string }) {
  const spec = coreStyle(slug, color)
  const style = { width: size, height: size, '--core': spec.core, '--ring': spec.ring } as CSSProperties
  if (spec.mark === 'emblem') {
    return (
      <span className="core-mark is-emblem" style={style} title={title}>
        <img src="/jarvis-emblem.svg" alt="" width={size} height={size} />
      </span>
    )
  }
  return (
    <span className={`core-mark${spec.mark === 'gripper' ? ' has-gripper' : ''}`} style={style} title={title}>
      <span className="core-disc" />
      {spec.mark === 'gripper' && (
        <svg className="core-gripper" viewBox="0 0 32 32" aria-hidden>
          <path d="M8 6v9a4 4 0 0 0 4 4h2" />
          <path d="M24 6v9a4 4 0 0 1-4 4h-2" />
          <circle cx="16" cy="23" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      )}
    </span>
  )
}
