import type { SceneAgent } from '../data/scene.ts'

export function FloorPlan({ agents }: { agents: SceneAgent[] }) {
  return (
    <div className="floor-plan" aria-hidden="true">
      <p className="floor-plan-label">Floor 1</p>
      {agents.map((agent) => (
        <span
          key={agent.slug}
          className="floor-dot"
          data-slug={agent.slug}
          data-status={agent.status}
          data-boss={agent.isBoss ? 'true' : 'false'}
          style={{ left: `${agent.deskX}%`, top: `${agent.deskY}%` }}
          title={`${agent.name} · ${agent.status}`}
        />
      ))}
    </div>
  )
}
