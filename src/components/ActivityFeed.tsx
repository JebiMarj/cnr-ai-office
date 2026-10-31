import { Avatar } from './Avatar.tsx'
import { STATUS_LABEL } from '../data/labels.ts'
import { formatAgo } from '../data/time.ts'
import type { Activity } from '../data/types.ts'

export function ActivityFeed({ activities, now }: { activities: Activity[]; now: number }) {
  const rows = [...activities].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 12)
  return (
    <section className="panel rail-card" data-testid="activity-feed" aria-labelledby="activity-heading">
      <div className="section-head">
        <p className="kicker">Recent</p>
        <h2 id="activity-heading">Activity</h2>
      </div>
      {rows.length === 0 ? (
        <p className="empty">The floor is quiet.</p>
      ) : (
        <ol className="stack feed-list">
          {rows.map((item) => (
            <li key={item.id} className="activity-row">
              <Avatar slug={item.agentSlug} size="sm" status={item.status} />
              <div className="activity-copy">
                <p className="who">{item.agentName}</p>
                <p className="activity-title">{item.taskTitle}</p>
                <p className="meta">
                  <span className="status-dot" data-status={item.status} />
                  {STATUS_LABEL[item.status] ?? item.status}
                  <span aria-hidden="true"> · </span>
                  {formatAgo(item.updatedAt, now)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
