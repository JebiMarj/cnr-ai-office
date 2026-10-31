import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Avatar } from './Avatar.tsx'
import { StatusPill } from './StatusPill.tsx'
import { formatAgo } from '../data/time.ts'
import type { Agent } from '../data/types.ts'

export function DeskCard({ agent, now, index = 0 }: { agent: Agent; now: number; index?: number }) {
  const signature = `${agent.status}|${agent.currentTask ?? ''}`
  const [updating, setUpdating] = useState(false)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setUpdating(true)
    const timer = window.setTimeout(() => setUpdating(false), 2600)
    return () => window.clearTimeout(timer)
  }, [signature])

  return (
    <article
      className={`panel desk-card${updating ? ' is-updating' : ''}`}
      data-testid="desk-card"
      data-agent={agent.slug}
      data-status={agent.status}
      data-updating={updating ? 'true' : 'false'}
      style={{ '--i': index } as CSSProperties}
    >
      <div className="desk-top">
        <Avatar slug={agent.slug} status={agent.status} />
        <div className="desk-id">
          <h3>{agent.name}</h3>
          <p className="role">{agent.role}</p>
        </div>
      </div>
      <StatusPill status={agent.status} />
      <p className="task" title={agent.currentTask ?? undefined}>
        {agent.currentTask ?? 'No active task'}
      </p>
      <p className="meta">Updated {formatAgo(agent.updatedAt, now)}</p>
    </article>
  )
}
