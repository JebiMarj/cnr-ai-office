import type { SceneAgent } from '../data/scene.ts'

export function FloorPlan({ agents }: { agents: SceneAgent[] }) {
  return (
    <div className="floor-plan" aria-hidden="true">
      <div className="floor-iso" />
      <p className="floor-plan-label">Floor 1</p>
      {agents.map((agent) => (
        <span
          key={agent.slug}
          className={`floor-marker${agent.deskY < 38 ? ' label-above' : ''}`}
          data-status={agent.status}
          data-boss={agent.isBoss ? 'true' : 'false'}
          style={{ left: `${10 + agent.deskX * 0.8}%`, top: `${16 + agent.deskY * 0.7}%` }}
          title={`${agent.name} · ${agent.status}`}
        >
          <span className="floor-dot" />
          <span className="floor-name">{agent.name}</span>
        </span>
      ))}
    </div>
  )
}
