import { BrandMark, brand } from '../brand.tsx'
import { floorCensus } from '../data/labels.ts'
import { formatManilaClock } from '../data/time.ts'
import type { OfficeSnapshot } from '../data/types.ts'

const CONNECTION_LABEL = {
  live: 'Live',
  demo: 'Demo',
  connecting: 'Connecting',
  offline: 'Offline',
} as const

export function Header({ snapshot, now }: { snapshot: OfficeSnapshot; now: number }) {
  const census = floorCensus(snapshot.agents)
  return (
    <header className="site-header">
      <div className="brand">
        <BrandMark />
        <div className="brand-copy">
          <p className="kicker">{brand.company}</p>
          <h1>{brand.name}</h1>
        </div>
      </div>
      <div className="header-meta">
        <p className="clock">
          <span>Manila</span>
          {formatManilaClock(new Date(now))}
        </p>
        {census ? <p className="census">{census}</p> : null}
        <p className={`connection connection-${snapshot.connection}`} data-testid="connection-badge">
          <span className="status-dot" data-status={snapshot.connection === 'live' || snapshot.connection === 'demo' ? 'working' : 'offline'} />
          {CONNECTION_LABEL[snapshot.connection]}
        </p>
      </div>
    </header>
  )
}
