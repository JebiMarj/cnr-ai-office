import { Avatar } from './Avatar.tsx'
import { formatWait } from '../data/time.ts'
import type { Approval } from '../data/types.ts'

export function ApprovalsDesk({ approvals, now }: { approvals: Approval[]; now: number }) {
  const pending = approvals
    .filter((item) => item.status === 'pending')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))

  return (
    <section className="panel rail-card" data-testid="approvals-desk" aria-labelledby="approvals-heading">
      <div className="section-head">
        <p className="kicker">Waiting on JV</p>
        <h2 id="approvals-heading">Approvals desk</h2>
      </div>
      {pending.length === 0 ? (
        <p className="empty">Nothing is waiting on JV.</p>
      ) : (
        <ol className="stack">
          {pending.map((item) => (
            <li key={item.id} className="approval">
              <Avatar slug={item.agentSlug} size="sm" status="waiting_on_jv" />
              <div className="approval-copy">
                <p className="who">{item.agentName}</p>
                <p className="approval-title">{item.title}</p>
                <p className="wait">{formatWait(item.createdAt, now)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
