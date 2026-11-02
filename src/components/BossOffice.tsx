import { Avatar } from './Avatar.tsx'
import { StatusPill } from './StatusPill.tsx'
import { floorTitle } from '../data/labels.ts'
import { bossFocus, bossShiftLine, displayStatus } from '../data/shift.ts'
import { formatAgo } from '../data/time.ts'
import type { Agent } from '../data/types.ts'

export function BossOffice({ agent, now }: { agent: Agent; now: number }) {
  const moment = new Date(now)
  const status = displayStatus(agent, moment)
  return (
    <section className="panel boss" data-testid="boss-office" data-status={status} data-slug={agent.slug}>
      <div className="boss-copy">
        <div className="boss-identity">
          <Avatar slug={agent.slug} size="lg" status={status} />
          <div>
            <p className="kicker">{agent.slug === 'marj' ? 'VP office' : 'Corner office'}</p>
            <h2 className="boss-name">{floorTitle(agent)}</h2>
            <p className="role">{agent.role}</p>
          </div>
        </div>
        {agent.subtitle ? <p className="subtitle">{agent.subtitle}</p> : null}
        <StatusPill status={status} />
        <p className="focus">{bossFocus(agent, moment)}</p>
        <p className="meta">{bossShiftLine(agent, moment)}</p>
        <p className="meta">Updated {formatAgo(agent.updatedAt, now)}</p>
      </div>
    </section>
  )
}
