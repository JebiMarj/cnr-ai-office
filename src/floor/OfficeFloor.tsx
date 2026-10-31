import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { floorTitle, STATUS_LABEL } from '../data/labels.ts'
import { lookFor } from './looks.ts'
import {
  bubbleText,
  buildFloorLabels,
  isWaiting,
  placementFor,
  poseView,
  retarget,
  settle,
  shortRole,
  stepPoses,
  zoneFor,
  type FloorAgent,
  type Pose,
} from './motion.ts'
import type { OfficeView } from './scene/OfficeCanvas.tsx'

const OfficeCanvas = lazy(() => import('./scene/OfficeCanvas.tsx'))

type Props = {
  agents: FloorAgent[]
  selectedSlug?: string | null
  onSelect: (slug: string) => void
  /** Test hook. When set, the floor uses these poses instead of the live walk. */
  poses?: Pose[]
}

type WebglState = 'pending' | 'ready' | 'missing'

export function OfficeFloor({ agents, selectedSlug = null, onSelect, poses: poseOverride }: Props) {
  const live = usePoses(agents)
  const poses = poseOverride ?? live
  const view = useRef<OfficeView>(null)
  const labels = useRef<HTMLDivElement>(null)
  const [webgl, setWebgl] = useState<WebglState>('pending')

  useEffect(() => {
    setWebgl(detectWebgl() ? 'ready' : 'missing')
  }, [])

  const personAt: Record<string, { x: number; y: number } | null> = {}
  for (const agent of agents) {
    const pose = poses.find((item) => item.slug === agent.slug)
    const sample = pose ? poseView(pose) : null
    personAt[agent.slug] = sample ? { x: sample.x, y: sample.y } : null
  }
  const specs = buildFloorLabels(agents, personAt, selectedSlug)

  return (
    <div className="office-shell panel" data-testid="office-floor">
      <div className="office-stage">
        {webgl === 'ready' ? (
          <Suspense fallback={<p className="floor-fallback">Opening the office…</p>}>
            <OfficeCanvas
              ref={view}
              agents={agents}
              poses={poses}
              selected={selectedSlug}
              onSelect={onSelect}
              labelRoot={labels}
            />
          </Suspense>
        ) : (
          <p className="floor-fallback" role="status">
            {webgl === 'missing'
              ? 'This browser cannot open the 3D office. The floor board is still available.'
              : 'Opening the office…'}
          </p>
        )}
        <div className="floor-labels" ref={labels}>
          {specs.map((spec) => {
            const agent = agents.find((item) => item.slug === spec.slug)
            if (!agent) return null
            const expanded = selectedSlug === agent.slug && spec.kind === 'person'
            return (
              <button
                key={spec.id}
                type="button"
                className={expanded ? 'floor-chip is-open' : 'floor-chip'}
                data-floor-label={spec.id}
                data-open={expanded ? 'true' : 'false'}
                style={{ width: spec.w, height: spec.h }}
                onClick={() => onSelect(agent.slug)}
              >
                <span className="tag-dot" data-status={agent.status} />
                <span className="tag-name">{floorTitle(agent)}</span>
                <span className="label-detail">{shortRole(agent.slug, agent.role)}</span>
                <span className="label-detail">{bubbleText(agent)}</span>
              </button>
            )
          })}
        </div>
        <FloorRoster agents={agents} poses={poses} onSelect={onSelect} />
      </div>
      <div className="floor-tools">
        <button type="button" className="board-toggle" onClick={() => view.current?.reset()} disabled={webgl !== 'ready'}>
          Reset view
        </button>
        <p className="pan-hint">Drag to look around. Pinch or scroll to zoom.</p>
      </div>
    </div>
  )
}

function FloorRoster({
  agents,
  poses,
  onSelect,
}: {
  agents: FloorAgent[]
  poses: Pose[]
  onSelect: (slug: string) => void
}) {
  return (
    <ul className="floor-roster" aria-hidden="true">
      {agents.map((agent) => {
        const pose = poses.find((item) => item.slug === agent.slug)
        const view = pose ? poseView(pose) : null
        const place = placementFor(agent)
        const occupancy = place.zone === 'offline' ? 'empty' : place.zone === 'desk' ? 'here' : 'away'
        return (
          <li key={agent.slug}>
            <button type="button" data-desk={agent.slug} data-occupancy={occupancy} data-status={agent.status} onClick={() => onSelect(agent.slug)}>
              {floorTitle(agent)} desk
            </button>
            {view && pose ? (
              <button
                type="button"
                data-character={agent.slug}
                data-figure="human"
                data-outfit={lookFor(agent.slug).outfit}
                data-zone={zoneFor(agent)}
                data-status={agent.status}
                data-walking={view.walking ? 'true' : 'false'}
                data-gait={view.walking ? 'walk' : pose.body}
                data-waiting={isWaiting(agent) ? 'true' : 'false'}
                data-x={view.x.toFixed(2)}
                data-y={view.y.toFixed(2)}
                aria-label={`${floorTitle(agent)}, ${agent.role}. ${STATUS_LABEL[agent.status] ?? agent.status}. ${agent.currentTask ?? ''}`}
                onClick={() => onSelect(agent.slug)}
              >
                {floorTitle(agent)}
              </button>
            ) : null}
          </li>
        )
      })}
      <li className="floor-key">
        Corner office. VP office. Kitchenette. Meeting room. Lounge. Reception. Storage. Restroom. Wood floor. Tile floor. Carpet.
      </li>
    </ul>
  )
}

function usePoses(agents: FloorAgent[]): Pose[] {
  const reduced = useReducedMotion()
  const sig = agents.map((agent) => `${agent.slug}:${agent.status}:${agent.isBoss ? 1 : 0}:${agent.isHuman ? 1 : 0}`).join('|')
  const [poses, setPoses] = useState(() => settle(agents))
  const ref = useRef(poses)
  const agentsRef = useRef(agents)
  agentsRef.current = agents

  useEffect(() => {
    const next = retarget(ref.current, agentsRef.current, reduced)
    ref.current = next
    setPoses(next)
  }, [sig, reduced])

  useEffect(() => {
    if (reduced) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const stepped = stepPoses(ref.current, agentsRef.current, dt, false)
      ref.current = stepped.poses
      if (stepped.paint) setPoses(stepped.poses)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [sig, reduced])

  return poses
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return reduced
}

function detectWebgl(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const ok = Boolean(gl)
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}
