import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { brand } from '../brand.tsx'
import { floorTitle, STATUS_LABEL } from '../data/labels.ts'
import { isExecutive } from '../data/shift.ts'
import { agentColor, FloorChip, Wall } from './draw.tsx'
import {
  Blotter,
  DeskTop,
  DoorLeaf,
  furnishings,
  GlassPane,
  Keyboard,
  Monitor,
  OfficeChair,
  SkylineWindow,
} from './furniture.tsx'
import { Person } from './people.tsx'
import {
  AWAY,
  EXIT,
  FLOOR,
  ROOMS,
  bubbleText,
  buildFloorLabels,
  deskPoint,
  floorViewBox,
  isWaiting,
  placeLabels,
  poly,
  poseView,
  project,
  retarget,
  roomOf,
  settle,
  shortRole,
  stepPoses,
  tilePoints,
  zoneFor,
  type BodyPose,
  type FloorAgent,
  type Pose,
  type RoomId,
  type Vec,
} from './motion.ts'

type Props = {
  agents: FloorAgent[]
  selectedSlug?: string | null
  onSelect: (slug: string) => void
  /** Test hook. When set, the floor draws these poses instead of the live walk. */
  poses?: Pose[]
}

type Sprite = { key: string; depth: number; node: ReactNode }

export function OfficeFloor({ agents, selectedSlug = null, onSelect, poses: poseOverride }: Props) {
  const live = usePoses(agents)
  const poses = poseOverride ?? live
  const poseBySlug = new Map(poses.map((pose) => [pose.slug, pose]))
  const scrollRef = useRef<HTMLDivElement>(null)
  const gid = useId().replace(/:/g, '')

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollWidth > el.clientWidth + 24) {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.38
    }
  }, [])

  const sprites: Sprite[] = []
  for (const agent of agents) {
    const feet = deskPoint(agent.slug, agent.isBoss)
    const zone = zoneFor(agent)
    sprites.push({
      key: `desk-${agent.slug}`,
      depth: feet.x + feet.y - 0.9,
      node: (
        <Desk
          key={agent.slug}
          agent={agent}
          feet={feet}
          selected={selectedSlug === agent.slug}
          occupancy={zone === 'offline' ? 'empty' : zone === 'desk' ? 'here' : 'away'}
          onSelect={onSelect}
        />
      ),
    })
  }

  for (const piece of furnishings()) sprites.push(piece)

  for (const agent of agents) {
    const pose = poseBySlug.get(agent.slug)
    if (!pose) continue
    const view = poseView(pose)
    if (!view) continue
    const waiting = isWaiting(agent)
    const gait: BodyPose = view.walking ? 'walk' : pose.body
    sprites.push({
      key: `who-${agent.slug}`,
      depth: view.x + view.y + 0.35,
      node: (
        <Character
          key={agent.slug}
          agent={agent}
          view={view}
          gait={gait}
          waiting={waiting}
          selected={selectedSlug === agent.slug}
          onSelect={onSelect}
        />
      ),
    })
  }

  sprites.sort((a, b) => a.depth - b.depth)

  const personAt: Record<string, Vec | null> = {}
  for (const agent of agents) {
    const pose = poseBySlug.get(agent.slug)
    const view = pose ? poseView(pose) : null
    personAt[agent.slug] = view ? { x: view.x, y: view.y } : null
  }
  const labels = placeLabels(buildFloorLabels(agents, personAt, selectedSlug))

  return (
    <div className="office-shell panel" data-testid="office-floor">
      <div className="office-scroll" ref={scrollRef}>
        <svg className="iso-svg" viewBox={floorViewBox()} role="group" aria-label="Isometric office floor">
          <Defs id={gid} />
          <CityGlow />
          <Slab />
          <Tiles />
          <Rugs />
          <Walls />
          <NeonRim />
          <GlassRooms />
          <ZoneTitles />
          {sprites.map((sprite) => (
            <g key={sprite.key}>{sprite.node}</g>
          ))}
          <g className="floor-labels">
            {labels.map((label) => {
              const agent = agents.find((item) => item.slug === label.slug)
              if (!agent) return null
              return (
                <FloorChip
                  key={label.id}
                  x={label.x}
                  y={label.y}
                  w={label.w}
                  h={label.h}
                  name={floorTitle(agent)}
                  role={shortRole(agent.slug, agent.role)}
                  task={bubbleText(agent)}
                  status={agent.status}
                  expanded={selectedSlug === agent.slug && label.kind === 'person'}
                  kind={label.kind}
                  slug={agent.slug}
                />
              )
            })}
          </g>
        </svg>
      </div>
      <p className="pan-hint">Swipe to look around the floor.</p>
    </div>
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
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return reduced
}

function onKey(event: KeyboardEvent, slug: string, onSelect: (slug: string) => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onSelect(slug)
  }
}

function labelFor(agent: FloorAgent): string {
  const status = STATUS_LABEL[agent.status] ?? agent.status
  const task = agent.currentTask ? ` ${agent.currentTask}` : ''
  return `${floorTitle(agent)}, ${agent.role}. ${status}.${task}`
}

function Desk({
  agent,
  feet,
  selected,
  occupancy,
  onSelect,
}: {
  agent: FloorAgent
  feet: Vec
  selected: boolean
  occupancy: 'here' | 'away' | 'empty'
  onSelect: (slug: string) => void
}) {
  const exec = isExecutive(agent)
  const color = agentColor(agent.slug)
  const wide = exec ? 1.85 : 1.5
  const deep = exec ? 0.95 : 0.78
  const x = feet.x - wide / 2
  const y = feet.y - (exec ? 2.25 : 2.05)
  const h = exec ? 22 : 20
  const offline = occupancy === 'empty'
  return (
    <g
      className={offline ? 'desk is-offline' : selected ? 'desk is-selected' : 'desk'}
      data-desk={agent.slug}
      data-occupancy={occupancy}
      data-status={agent.status}
    >
      <DeskTop x={x} y={y} w={wide} d={deep} h={h} wood={exec ? '#5c3d2e' : '#6a4632'} />
      <Blotter x={x + 0.28} y={y + 0.18} w={wide - 0.55} d={deep - 0.32} h={h} />
      <Monitor x={feet.x} y={y + 0.22} color={color} wide={exec} lift={h + 2} />
      <Keyboard x={feet.x - 0.05} y={y + deep - 0.22} lift={h + 1} />
      <OfficeChair x={feet.x} y={feet.y + 0.05} exec={exec} />
      {selected ? <polygon points={tilePoints(x - 0.12, y - 0.08, wide + 0.24, deep + 1.7)} className="select-ring" /> : null}
      <polygon
        points={tilePoints(x - 0.15, y - 0.1, wide + 0.3, deep + 1.8)}
        className="iso-hit"
        role="button"
        tabIndex={0}
        aria-label={labelFor(agent)}
        onClick={() => onSelect(agent.slug)}
        onKeyDown={(event) => onKey(event, agent.slug, onSelect)}
      />
    </g>
  )
}

function Character({
  agent,
  view,
  gait,
  waiting,
  selected,
  onSelect,
}: {
  agent: FloorAgent
  view: { x: number; y: number; left: boolean; walking: boolean }
  gait: BodyPose
  waiting: boolean
  selected: boolean
  onSelect: (slug: string) => void
}) {
  const at = project(view.x, view.y)
  const exec = isExecutive(agent)
  const scale = exec ? 1.06 : 1
  const flip = view.left ? `scale(${-scale} ${scale})` : `scale(${scale})`
  return (
    <g
      className={agent.status === 'away' && exec ? 'person is-away' : 'person'}
      data-character={agent.slug}
      data-zone={zoneFor(agent)}
      data-status={agent.status}
      data-walking={view.walking ? 'true' : 'false'}
      data-gait={gait}
      data-waiting={waiting ? 'true' : 'false'}
      data-x={view.x.toFixed(2)}
      data-y={view.y.toFixed(2)}
      transform={`translate(${at.x} ${at.y})`}
      role="button"
      tabIndex={0}
      aria-label={labelFor(agent)}
      onClick={() => onSelect(agent.slug)}
      onKeyDown={(event) => onKey(event, agent.slug, onSelect)}
    >
      {selected ? <ellipse cx="0" cy="2" rx="18" ry="8" className="select-pool" /> : null}
      {waiting ? <ellipse cx="0" cy="2" rx="16" ry="7" className="wait-pool" /> : null}
      <g transform={flip}>
        <g className={gait === 'walk' || gait === 'treadmill' ? 'bob' : undefined} transform={gait === 'sit' ? 'translate(0 6)' : undefined}>
          <Person slug={agent.slug} gait={gait} />
        </g>
      </g>
    </g>
  )
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={brand.colors.pink} />
        <stop offset="1" stopColor={brand.colors.gold} />
      </linearGradient>
    </defs>
  )
}

function CityGlow() {
  const door = project(EXIT.x, EXIT.y)
  const pad = project(AWAY.x, AWAY.y)
  return (
    <g className="city-glow" aria-hidden="true">
      <circle cx={door.x - 70} cy={pad.y + 16} r="48" fill={brand.colors.pink} opacity="0.16" />
      <circle cx={door.x + 64} cy={pad.y + 8} r="40" fill={brand.colors.orange} opacity="0.14" />
    </g>
  )
}

function Slab() {
  return (
    <g className="slab">
      <polygon points={skirt(0, FLOOR.rows, FLOOR.cols, FLOOR.rows, 26)} />
      <polygon points={skirt(FLOOR.cols, 0, FLOOR.cols, FLOOR.rows, 26)} />
    </g>
  )
}

function skirt(x0: number, y0: number, x1: number, y1: number, drop: number): string {
  const a = project(x0, y0)
  const b = project(x1, y1)
  return poly([a, b, { x: b.x, y: b.y + drop }, { x: a.x, y: a.y + drop }])
}

function Tiles() {
  const groups: Record<string, ReactNode[]> = { wood: [], tile: [], rubber: [], carpet: [] }
  for (let y = 0; y < FLOOR.rows; y += 1) {
    for (let x = 0; x < FLOOR.cols; x += 1) {
      const kind = surfaceAt(x, y)
      groups[kind]!.push(
        <polygon key={`${x}-${y}`} points={tilePoints(x, y)} fill={tileFill(kind, x, y)} className={`floor-tile tile-${kind}`} />,
      )
    }
  }
  for (let y = FLOOR.rows; y < FLOOR.rows + 2; y += 1) {
    for (let x = 6; x < 11; x += 1) {
      groups.wood!.push(<polygon key={`out-${x}-${y}`} points={tilePoints(x, y)} fill="#120e16" />)
    }
  }
  return (
    <g className="tiles">
      <g data-surface="wood">{groups.wood}</g>
      <g data-surface="tile">{groups.tile}</g>
      <g data-surface="rubber">{groups.rubber}</g>
      <g data-surface="carpet">{groups.carpet}</g>
    </g>
  )
}

function surfaceAt(x: number, y: number): 'wood' | 'tile' | 'rubber' | 'carpet' {
  const room = roomOf({ x: x + 0.5, y: y + 0.5 })
  if (room === 'pantry') return 'tile'
  if (room === 'gym') return 'rubber'
  if (room === 'lounge' || room === 'rest' || room === 'library' || room === 'conference' || room === 'vp') return 'carpet'
  return 'wood'
}

function tileFill(kind: 'wood' | 'tile' | 'rubber' | 'carpet', x: number, y: number): string {
  if (kind === 'tile') return (x + y) % 2 ? '#4a4036' : '#3d342c'
  if (kind === 'rubber') return (x + y) % 2 ? '#1a1e26' : '#151920'
  if (kind === 'carpet') return (x * 3 + y) % 2 ? '#2c2233' : '#261c2c'
  const plank = ['#3a2c22', '#34281f', '#413024'][y % 3]!
  return (x + y) % 2 ? plank : shade(plank)
}

function shade(hex: string): string {
  return hex === '#3a2c22' ? '#32261d' : hex === '#34281f' ? '#2e231b' : '#3a2b22'
}

function Rugs() {
  return (
    <g className="rugs">
      <Carpet room="lounge" />
      <Carpet room="rest" />
      <Carpet room="library" />
      <Carpet room="vp" />
      <Carpet room="office" />
      <Carpet room="conference" />
      <polygon points={roomPoly('gym', 0.35)} className="rubber-mat" data-surface="rubber-mat" />
    </g>
  )
}

function Carpet({ room }: { room: RoomId }) {
  return <polygon points={roomPoly(room, 0.28)} className={`rug rug-${room}`} />
}

function roomPoly(id: RoomId, inset: number): string {
  const room = ROOMS[id]
  return tilePoints(room.x + inset, room.y + inset, room.w - inset * 2, room.h - inset * 2)
}

function Walls() {
  const { cols, rows } = FLOOR
  return (
    <g className="walls">
      <Wall x0={0} y0={0} x1={cols} y1={0} h={84} fill="#14111a" lip={brand.colors.gold} />
      <Wall x0={0} y0={0} x1={0} y1={rows} h={72} fill="#1c1722" lip={brand.colors.pink} />
      <WorkWindow />
      <SkylineWindow
        x0={16.55}
        x1={20.7}
        marker="vp-window"
        towers={[
          { t: 0.08, w: 0.18, h: 28 },
          { t: 0.32, w: 0.16, h: 40 },
          { t: 0.56, w: 0.2, h: 24 },
        ]}
      />
      <SkylineWindow
        x0={21.25}
        x1={25.55}
        marker="city-window"
        towers={[
          { t: 0.02, w: 0.16, h: 36 },
          { t: 0.2, w: 0.12, h: 52 },
          { t: 0.34, w: 0.14, h: 30 },
          { t: 0.5, w: 0.18, h: 58 },
          { t: 0.7, w: 0.12, h: 34 },
          { t: 0.84, w: 0.12, h: 44 },
        ]}
      />
      <Wall x0={0} y0={rows} x1={7.15} y1={rows} h={28} fill="#14111a" lip={brand.colors.pink} />
      <Wall x0={9.85} y0={rows} x1={cols} y1={rows} h={28} fill="#14111a" lip={brand.colors.pink} />
      <Wall x0={cols} y0={0} x1={cols} y1={rows} h={36} fill="#1a1520" lip={brand.colors.gold} />
      <Entry />
    </g>
  )
}

function WorkWindow() {
  const a = project(6.2, 0)
  const b = project(15.6, 0)
  const logo = project(6.55, 0.05)
  return (
    <g className="skyline" data-prop="work-window">
      <polygon points={poly([shift(a, 70), shift(b, 70), shift(b, 28), shift(a, 28)])} fill={brand.colors.pink} opacity="0.28" />
      <polygon points={poly([shift(a, 70), shift(b, 70), shift(b, 48), shift(a, 48)])} fill={brand.colors.orange} opacity="0.18" />
      <polyline points={poly([shift(a, 70), shift(b, 70)])} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
      <image href={brand.logo.small} x={logo.x - 8} y={logo.y - 64} width="28" height="28" />
      <text x={logo.x + 28} y={logo.y - 44} className="wall-sign">
        CREATE & REACH
      </text>
    </g>
  )
}

function shift(p: Vec, lift: number): Vec {
  return { x: p.x, y: p.y - lift }
}

function Entry() {
  const a = project(7.15, FLOOR.rows)
  const b = project(9.85, FLOOR.rows)
  return (
    <g className="exit-door" data-prop="entry-door">
      <polygon points={poly([a, b, shift(b, 36), shift(a, 36)])} fill="#0e0c12" />
      <polyline points={poly([shift(a, 36), shift(b, 36)])} fill="none" stroke={brand.colors.gold} strokeWidth="1.6" />
      <circle cx={(a.x + b.x) / 2 + 6} cy={(a.y + b.y) / 2 - 16} r="1.3" fill={brand.colors.gold} />
    </g>
  )
}

function NeonRim() {
  return (
    <polygon
      className="neon-rim"
      points={poly([project(0, 0), project(FLOOR.cols, 0), project(FLOOR.cols, FLOOR.rows), project(0, FLOOR.rows)])}
    />
  )
}

function GlassRooms() {
  const office = ROOMS.office
  const vp = ROOMS.vp
  const conf = ROOMS.conference
  const library = ROOMS.library
  const pantry = ROOMS.pantry
  return (
    <g className="glass">
      <GlassPane x0={library.x + library.w} y0={library.y} x1={library.x + library.w} y1={2.55} />
      <GlassPane x0={library.x + library.w} y0={4.05} x1={library.x + library.w} y1={library.y + library.h} />
      <DoorLeaf x0={library.x + library.w} y0={2.7} x1={library.x + library.w} y1={3.9} />
      <GlassPane x0={pantry.x + pantry.w} y0={pantry.y} x1={pantry.x + pantry.w} y1={8.45} />
      <GlassPane x0={pantry.x + pantry.w} y0={9.85} x1={pantry.x + pantry.w} y1={pantry.y + pantry.h} />
      <DoorLeaf x0={pantry.x + pantry.w} y0={8.55} x1={pantry.x + pantry.w} y1={9.7} />
      <GlassPane x0={vp.x} y0={vp.y} x1={vp.x} y1={vp.y + vp.h} />
      <GlassPane x0={vp.x} y0={vp.y + vp.h} x1={17.15} y1={vp.y + vp.h} />
      <GlassPane x0={18.7} y0={vp.y + vp.h} x1={vp.x + vp.w} y1={vp.y + vp.h} />
      <DoorLeaf x0={17.25} y0={vp.y + vp.h} x1={18.55} y1={vp.y + vp.h} />
      <GlassPane x0={office.x} y0={office.y} x1={office.x} y1={office.y + office.h} />
      <GlassPane x0={office.x} y0={office.y + office.h} x1={21.35} y1={office.y + office.h} />
      <GlassPane x0={23.05} y0={office.y + office.h} x1={office.x + office.w} y1={office.y + office.h} />
      <DoorLeaf x0={21.45} y0={office.y + office.h} x1={22.9} y1={office.y + office.h} />
      <GlassPane x0={conf.x} y0={conf.y} x1={conf.x + conf.w} y1={conf.y} />
      <GlassPane x0={conf.x} y0={conf.y} x1={conf.x} y1={conf.y + conf.h} />
      <GlassPane x0={conf.x} y0={conf.y + conf.h} x1={20.2} y1={conf.y + conf.h} />
      <GlassPane x0={22.2} y0={conf.y + conf.h} x1={conf.x + conf.w} y1={conf.y + conf.h} />
      <DoorLeaf x0={20.3} y0={conf.y + conf.h} x1={22.05} y1={conf.y + conf.h} />
    </g>
  )
}

function ZoneTitles() {
  const spot = (x: number, y: number, lift: number) => {
    const p = project(x, y)
    return { x: p.x, y: p.y - lift }
  }
  const titles: Array<[string, number, number, number]> = [
    ['LIBRARY', 2.6, 0.45, 18],
    ['PANTRY', 2.5, 7.05, 16],
    ['VP OFFICE', 18.5, 0.4, 52],
    ['CORNER OFFICE', 23.3, 0.4, 62],
    ['CONFERENCE', 22.2, 7.3, 18],
    ['LOUNGE', 3.4, 13.2, 16],
    ['REST', 12.1, 13.2, 16],
    ['GYM', 19.5, 13.35, 16],
    ['RECEPTION', 12.4, 18.55, 8],
  ]
  return (
    <g className="zone-titles" aria-hidden="true">
      {titles.map(([label, x, y, lift]) => {
        const at = spot(x, y, lift)
        return (
          <text key={label} x={at.x} y={at.y} textAnchor="middle">
            {label}
          </text>
        )
      })}
    </g>
  )
}
