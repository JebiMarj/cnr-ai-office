import { Avatar } from './Avatar.tsx'
import { FloorPlan } from './FloorPlan.tsx'
import { StatusPill } from './StatusPill.tsx'
import { bossFocus, bossShiftLine, displayStatus } from '../data/shift.ts'
import { formatAgo } from '../data/time.ts'
import { toSceneAgents } from '../data/scene.ts'
import type { Agent, OfficeSnapshot } from '../data/types.ts'

export function BossOffice({
  agent,
  snapshot,
  now,
}: {
  agent: Agent
  snapshot: OfficeSnapshot
  now: number
}) {
  const moment = new Date(now)
  const status = displayStatus(agent, moment)
  return (
    <section className="panel boss" data-testid="boss-office" data-status={status}>
      <div className="boss-copy">
        <div className="boss-identity">
          <Avatar slug={agent.slug} size="lg" />
          <div>
            <p className="kicker">Corner office</p>
            <h2 className="boss-name">{agent.name}</h2>
            <p className="role">{agent.role}</p>
          </div>
        </div>
        {agent.subtitle ? <p className="subtitle">{agent.subtitle}</p> : null}
        <StatusPill status={status} />
        <p className="focus">{bossFocus(agent, moment)}</p>
        <p className="meta">{bossShiftLine(agent, moment)}</p>
        <p className="meta">Updated {formatAgo(agent.updatedAt, now)}</p>
      </div>
      <FloorPlan agents={toSceneAgents(snapshot, moment)} />
    </section>
  )
}
