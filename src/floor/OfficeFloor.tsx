import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { brand } from '../brand.tsx'
import { STATUS_LABEL } from '../data/labels.ts'
import { Figure, FloorChip, Plant, Prism, Wall, agentColor } from './draw.tsx'
import {
  AWAY,
  EXIT,
  FLOOR,
  ROOMS,
  advancePose,
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
  settle,
  shortRole,
  tilePoints,
  zoneFor,
  type FloorAgent,
  type Pose,
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
      el.scrollLeft = (el.scrollWidth - el.clientWidth) * 0.42
    }
  }, [])

  const sprites: Sprite[] = []
  for (const agent of agents) {
    const feet = deskPoint(agent.slug, agent.isBoss)
    const zone = zoneFor(agent)
    sprites.push({
      key: `desk-${agent.slug}`,
      depth: feet.x + feet.y - 0.85,
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

  sprites.push(
    { key: 'shelf-west', depth: 0.4 + 7.4, node: <Bookcase key="shw" x={0.28} y={4.85} /> },
    { key: 'shelf-office', depth: 16.2 + 3.6, node: <Bookcase key="sho" x={16.15} y={3.15} /> },
    { key: 'sofa-a', depth: 0.45 + 13.55 + 2.2, node: <Sofa key="sa" x={0.45} y={13.55} /> },
    { key: 'sofa-b', depth: 4.05 + 13.55 + 2.2, node: <Sofa key="sb" x={4.05} y={13.55} /> },
    { key: 'coffee-bar', depth: 0.4 + 11.3, node: <CoffeeBar key="bar" /> },
    { key: 'coffee', depth: 2.35 + 12.15 + 2.4, node: <CoffeeTable key="ct" /> },
    { key: 'conf-table', depth: 13.55 + 9.7 + 3.8, node: <ConferenceTable key="conf" /> },
    { key: 'plant-a', depth: 0.55 + 14.35, node: <Plant key="pa" x={0.55} y={14.35} /> },
    { key: 'plant-b', depth: 6.45 + 14.2, node: <Plant key="pb" x={6.45} y={14.2} scale={0.9} /> },
    { key: 'plant-c', depth: 16.9 + 0.85, node: <Plant key="pc" x={16.9} y={0.85} scale={0.85} /> },
    { key: 'plant-d', depth: 16.55 + 13.45, node: <Plant key="pd" x={16.55} y={13.45} scale={0.8} /> },
    { key: 'plant-e', depth: 11.15 + 6.4, node: <Plant key="pe" x={11.15} y={6.4} scale={0.75} /> },
    { key: 'plant-f', depth: 0.7 + 1.15, node: <Plant key="pf" x={0.7} y={1.15} scale={0.8} /> },
    { key: 'lamp', depth: 0.6 + 10.55, node: <FloorLamp key="lamp" x={0.6} y={10.55} /> },
    { key: 'post-office', depth: 17.55 + 4.35, node: <Post key="po" x={17.45} y={4.22} /> },
    { key: 'post-conf', depth: 17.55 + 13.7, node: <Post key="pcn" x={17.45} y={13.65} /> },
  )

  for (const agent of agents) {
    const pose = poseBySlug.get(agent.slug)
    if (!pose) continue
    const view = poseView(pose)
    if (!view) continue
    const waiting = isWaiting(agent)
    sprites.push({
      key: `who-${agent.slug}`,
      depth: view.x + view.y + 0.35,
      node: (
        <Character
          key={agent.slug}
          agent={agent}
          view={view}
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
          <polygon points={tilePoints(ROOMS.lounge.x, ROOMS.lounge.y, ROOMS.lounge.w, ROOMS.lounge.h)} className="rug" />
          <polygon points={tilePoints(ROOMS.office.x + 0.15, ROOMS.office.y + 0.15, ROOMS.office.w - 0.3, ROOMS.office.h - 0.3)} className="office-rug" />
          <Walls />
          <NeonRim />
          <GlassRooms />
          {sprites.map((sprite) => (
            <g key={sprite.key}>{sprite.node}</g>
          ))}
          <ZoneTitles />
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
                  name={agent.name}
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
  const sig = agents.map((agent) => `${agent.slug}:${agent.status}:${agent.isBoss ? 1 : 0}`).join('|')
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
      let moving = false
      const next = ref.current.map((pose) => {
        const stepped = advancePose(pose, dt, false)
        if (stepped !== pose) moving = true
        return stepped
      })
      if (!moving) return
      ref.current = next
      setPoses(next)
      frame = window.requestAnimationFrame(tick)
    }
    if (ref.current.some((pose) => pose.traveled < pose.length - 0.001 && pose.length > 0)) {
      frame = window.requestAnimationFrame(tick)
    }
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
  return `${agent.name}, ${agent.role}. ${status}.${task}`
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
  const color = agentColor(agent.slug)
  const wide = agent.isBoss ? 1.9 : 1.55
  const deep = agent.isBoss ? 1.0 : 0.82
  const x = feet.x - wide / 2
  const y = feet.y - (agent.isBoss ? 2.35 : 2.15)
  const offline = occupancy === 'empty'
  return (
    <g
      className={offline ? 'desk is-offline' : selected ? 'desk is-selected' : 'desk'}
      data-desk={agent.slug}
      data-occupancy={occupancy}
      data-status={agent.status}
    >
      <Prism x={x} y={y} w={wide} d={deep} h={agent.isBoss ? 18 : 15} top={agent.isBoss ? '#342838' : '#2a2433'} south="#1a1522" east="#241c2e" />
      <polygon points={tilePoints(x, y, wide, deep)} fill="none" stroke={color} strokeWidth="1.4" opacity="0.85" transform={`translate(0 ${agent.isBoss ? -18 : -15})`} />
      <Monitor feet={feet} color={color} boss={agent.isBoss} />
      <Keyboard feet={feet} />
      <Tower feet={feet} color={color} />
      <Chair feet={feet} boss={agent.isBoss} />
      {selected ? <polygon points={tilePoints(x - 0.15, y - 0.1, wide + 0.3, 2.3)} className="select-ring" /> : null}
      <polygon
        points={tilePoints(x - 0.1, y - 0.05, 1.8, 2.05)}
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

function Monitor({ feet, color, boss }: { feet: Vec; color: string; boss: boolean }) {
  const p = project(feet.x, feet.y - (boss ? 2.05 : 1.85))
  const w = boss ? 30 : 22
  return (
    <g transform={`translate(${p.x} ${p.y - (boss ? 20 : 16)})`}>
      <rect x={-w / 2} y="-24" width={w} height={boss ? 18 : 15} rx="2" fill="#0c0a10" stroke={color} strokeWidth="1.3" />
      <rect x={-w / 2 + 3} y="-21" width={w - 6} height={boss ? 12 : 9} rx="1" fill={color} className="screen-glow" opacity="0.92" />
      <rect x="-2.5" y="-6" width="5" height="7" fill="#2a2433" />
    </g>
  )
}

function Keyboard({ feet }: { feet: Vec }) {
  return <Prism x={feet.x - 0.28} y={feet.y - 1.15} w={0.56} d={0.28} h={3} top="#3a3344" south="#221c28" east="#2c2634" />
}

function Tower({ feet, color }: { feet: Vec; color: string }) {
  return (
    <g>
      <Prism x={feet.x + 0.55} y={feet.y - 1.7} w={0.28} d={0.28} h={16} top="#2a2432" south="#16121c" east="#221c28" />
      <circle cx={project(feet.x + 0.7, feet.y - 1.55).x} cy={project(feet.x + 0.7, feet.y - 1.55).y - 10} r="1.6" fill={color} className="screen-glow" />
    </g>
  )
}

function Chair({ feet, boss }: { feet: Vec; boss: boolean }) {
  const w = boss ? 0.72 : 0.58
  return (
    <g>
      <Prism x={feet.x - w / 2} y={feet.y - 0.15} w={w} d={boss ? 0.55 : 0.46} h={boss ? 11 : 8} top={boss ? '#4a3040' : '#3a3144'} south="#241c2c" east="#2e2638" />
      <Prism x={feet.x - w / 2 + 0.06} y={feet.y - 0.02} w={w - 0.12} d={0.12} h={boss ? 22 : 16} top="#2a2230" south="#1a1520" east="#221c28" />
    </g>
  )
}

function Sofa({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Prism x={x} y={y} w={2.15} d={0.72} h={12} top="#3a2434" south="#2a1828" east="#4a2c3e" />
      <polygon points={tilePoints(x + 0.12, y + 0.1, 1.9, 0.42)} fill="#5a3048" transform="translate(0 -14)" />
    </g>
  )
}

function CoffeeTable() {
  return (
    <g>
      <Prism x={2.25} y={12.05} w={1.85} d={0.95} h={11} top="#3a2e28" south="#241910" east="#2e2218" />
      <Cup x={2.6} y={12.3} />
      <Cup x={3.35} y={12.45} />
    </g>
  )
}

function CoffeeBar() {
  return (
    <g>
      <Prism x={0.4} y={10.45} w={2.5} d={0.72} h={16} top="#2c2420" south="#1a1412" east="#241c18" />
      <Prism x={0.7} y={10.55} w={0.45} d={0.4} h={24} top="#3a241c" south="#24140e" east="#2e1c14" />
      <Cup x={1.7} y={10.7} />
      <Cup x={2.15} y={10.78} />
      <Prism x={0.55} y={11.25} w={0.38} d={0.38} h={10} top="#3a3144" south="#241c2c" east="#2a2430" />
      <Prism x={2.15} y={11.3} w={0.38} d={0.38} h={10} top="#3a3144" south="#241c2c" east="#2a2430" />
    </g>
  )
}

function Bookcase({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Prism x={x} y={y} w={0.55} d={1.7} h={28} top="#3a2a24" south="#241810" east="#2e2218" />
      <Prism x={x + 0.08} y={y + 0.15} w={0.36} d={0.4} h={34} top={brand.colors.pink} south="#8a2040" east="#a02848" />
      <Prism x={x + 0.08} y={y + 0.65} w={0.36} d={0.45} h={32} top={brand.colors.gold} south="#8a6420" east="#a07828" />
      <Prism x={x + 0.08} y={y + 1.15} w={0.36} d={0.35} h={30} top={brand.colors.orange} south="#8a4e10" east="#a06018" />
    </g>
  )
}

function Cup({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g transform={`translate(${p.x} ${p.y - 12})`}>
      <rect x="-3" y="-6" width="6" height="6" rx="1" fill={brand.colors.paper} />
      <rect x="-2.2" y="-5" width="4.4" height="2" fill={brand.colors.orange} />
    </g>
  )
}

function ConferenceTable() {
  return (
    <g>
      <Prism x={13.55} y={9.55} w={2.7} d={1.45} h={15} top="#241c30" south="#16121e" east="#1e1828" />
      <polygon
        points={tilePoints(13.55, 9.55, 2.7, 1.45)}
        fill="none"
        stroke={brand.colors.pink}
        strokeWidth="1.6"
        opacity="0.9"
        transform="translate(0 -15)"
      />
      {[0, 1, 2, 3].map((i) => (
        <Prism key={`n${i}`} x={13.85 + i * 0.58} y={9.22} w={0.4} d={0.28} h={8} top="#3a3144" south="#241c2c" east="#2e2638" />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <Prism key={`s${i}`} x={13.9 + i * 0.58} y={11.08} w={0.4} d={0.28} h={8} top="#3a3144" south="#241c2c" east="#2e2638" />
      ))}
      <Prism x={13.28} y={9.95} w={0.28} d={0.42} h={8} top="#3a3144" south="#241c2c" east="#2e2638" />
      <Prism x={16.28} y={10.05} w={0.28} d={0.42} h={8} top="#3a3144" south="#241c2c" east="#2e2638" />
    </g>
  )
}

function Post({ x, y }: { x: number; y: number }) {
  return <Prism x={x} y={y} w={0.22} d={0.22} h={58} top={brand.colors.gold} south="#3a2818" east="#4a3420" />
}

function FloorLamp({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      <ellipse cx="0" cy="0" rx="16" ry="7" fill={brand.colors.orange} opacity="0.18" />
      <rect x="-1.5" y="-28" width="3" height="28" fill="#3a3144" />
      <ellipse cx="0" cy="-30" rx="8" ry="4" fill={brand.colors.gold} className="screen-glow" />
    </g>
  )
}

function Character({
  agent,
  view,
  waiting,
  selected,
  onSelect,
}: {
  agent: FloorAgent
  view: { x: number; y: number; left: boolean; walking: boolean }
  waiting: boolean
  selected: boolean
  onSelect: (slug: string) => void
}) {
  const at = project(view.x, view.y)
  const color = agentColor(agent.slug)
  const away = agent.isBoss && agent.status === 'away'
  return (
    <g
      className={away ? 'person is-away' : 'person'}
      data-character={agent.slug}
      data-zone={zoneFor(agent)}
      data-status={agent.status}
      data-walking={view.walking ? 'true' : 'false'}
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
        <g transform={view.left ? `scale(${agent.isBoss ? -1.28 : -1.05} ${agent.isBoss ? 1.28 : 1.05})` : `scale(${agent.isBoss ? 1.28 : 1.05})`}>
          <g className={view.walking ? 'bob' : undefined}>
            <Figure slug={agent.slug} color={color} />
          </g>
        </g>
    </g>
  )
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-city`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor={brand.colors.pink} stopOpacity="0.9" />
        <stop offset="0.48" stopColor={brand.colors.orange} stopOpacity="0.75" />
        <stop offset="1" stopColor="#140c18" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id={`${id}-lip`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={brand.colors.pink} />
        <stop offset="1" stopColor={brand.colors.gold} />
      </linearGradient>
      <radialGradient id={`${id}-bokeh`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor={brand.colors.orange} stopOpacity="0.55" />
        <stop offset="1" stopColor={brand.colors.orange} stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-glow`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

function CityGlow() {
  const door = project(EXIT.x, EXIT.y)
  const pad = project(AWAY.x, AWAY.y)
  return (
    <g className="city-glow" aria-hidden="true">
      <circle cx={door.x - 80} cy={pad.y + 20} r="54" fill={brand.colors.pink} opacity="0.18" />
      <circle cx={door.x + 70} cy={pad.y + 10} r="46" fill={brand.colors.orange} opacity="0.16" />
      <circle cx={pad.x} cy={pad.y + 36} r="70" fill={brand.colors.gold} opacity="0.08" />
    </g>
  )
}

function Slab() {
  const south = skirt(0, FLOOR.rows, FLOOR.cols, FLOOR.rows, 26)
  const east = skirt(FLOOR.cols, 0, FLOOR.cols, FLOOR.rows, 26)
  return (
    <g className="slab">
      <polygon points={south} />
      <polygon points={east} />
    </g>
  )
}

function skirt(x0: number, y0: number, x1: number, y1: number, drop: number): string {
  const a = project(x0, y0)
  const b = project(x1, y1)
  return poly([a, b, { x: b.x, y: b.y + drop }, { x: a.x, y: a.y + drop }])
}

function Tiles() {
  const tiles: ReactNode[] = []
  for (let y = 0; y < FLOOR.rows; y += 1) {
    for (let x = 0; x < FLOOR.cols; x += 1) {
      tiles.push(<polygon key={`${x}-${y}`} points={tilePoints(x, y)} fill={tileFill(x, y)} className="floor-tile" />)
    }
  }
  for (let y = FLOOR.rows; y < FLOOR.rows + 2; y += 1) {
    for (let x = 7; x < 11; x += 1) {
      tiles.push(<polygon key={`out-${x}-${y}`} points={tilePoints(x, y)} fill={y === 12 ? '#1a1520' : '#120e16'} />)
    }
  }
  return <g className="tiles">{tiles}</g>
}

function tileFill(x: number, y: number): string {
  const n = (x * 3 + y * 5) % 4
  const office = contains(ROOMS.office, x, y)
  const conf = contains(ROOMS.conference, x, y)
  const lounge = contains(ROOMS.lounge, x, y)
  if (office) return n % 2 ? '#34283f' : '#2c2236'
  if (conf) return n % 2 ? '#2b2438' : '#241c30'
  if (lounge) return n % 2 ? '#3a2a36' : '#312430'
  return ['#191621', '#211b2a', '#16131c', '#241e2e'][n]!
}

function contains(room: { x: number; y: number; w: number; h: number }, x: number, y: number): boolean {
  return x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h
}

function Walls() {
  const { cols, rows } = FLOOR
  return (
    <g className="walls">
      <Wall x0={0} y0={0} x1={cols} y1={0} h={78} fill="#14111a" lip={brand.colors.gold} />
      <Wall x0={0} y0={0} x1={0} y1={rows} h={78} fill="#1c1722" lip={brand.colors.pink} />
      <Window />
      <Wall x0={0} y0={rows} x1={7} y1={rows} h={28} fill="#14111a" lip={brand.colors.pink} />
      <Wall x0={11} y0={rows} x1={cols} y1={rows} h={28} fill="#14111a" lip={brand.colors.pink} />
      <Wall x0={cols} y0={0} x1={cols} y1={rows} h={36} fill="#1a1520" lip={brand.colors.gold} />
      <Door />
    </g>
  )
}

function Window() {
  const a = project(4.2, 0)
  const b = project(11.2, 0)
  const h1 = 64
  const h2 = 26
  const logo = project(1.15, 0.05)
  return (
    <g className="skyline">
      <polygon
        points={poly([
          { x: a.x, y: a.y - h1 },
          { x: b.x, y: b.y - h1 },
          { x: b.x, y: b.y - h2 },
          { x: a.x, y: a.y - h2 },
        ])}
        fill={brand.colors.pink}
        opacity="0.32"
      />
      <polygon
        points={poly([
          { x: a.x, y: a.y - h1 },
          { x: b.x, y: b.y - h1 },
          { x: b.x, y: b.y - 44 },
          { x: a.x, y: a.y - 44 },
        ])}
        fill={brand.colors.orange}
        opacity="0.24"
      />
      <image href={brand.logo.small} x={logo.x - 16} y={logo.y - 62} width="34" height="34" />
      <text x={logo.x + 46} y={logo.y - 40} className="wall-sign">
        CREATE & REACH
      </text>
    </g>
  )
}

function NeonRim() {
  return (
    <polygon
      className="neon-rim"
      points={poly([
        project(0, 0),
        project(FLOOR.cols, 0),
        project(FLOOR.cols, FLOOR.rows),
        project(0, FLOOR.rows),
      ])}
    />
  )
}

function Door() {
  const a = project(7.15, FLOOR.rows)
  const b = project(10.85, FLOOR.rows)
  return (
    <g className="exit-door">
      <polygon points={poly([a, b, { x: b.x, y: b.y - 36 }, { x: a.x, y: a.y - 36 }])} fill="#0e0c12" />
      <polyline
        points={poly([
          { x: a.x, y: a.y - 36 },
          { x: b.x, y: b.y - 36 },
        ])}
        fill="none"
        stroke={brand.colors.gold}
        strokeWidth="1.6"
      />
    </g>
  )
}

function GlassRooms() {
  const office = ROOMS.office
  const conf = ROOMS.conference
  const officeSouth = office.y + office.h
  const confEast = conf.x + conf.w
  return (
    <g className="glass">
      <Glass x0={office.x + 1.35} y0={officeSouth} x1={office.x + office.w} y1={officeSouth} />
      <Glass x0={office.x} y0={office.y} x1={office.x} y1={officeSouth - 0.15} />
      <Glass x0={conf.x} y0={conf.y} x1={confEast} y1={conf.y} />
      <Glass x0={conf.x} y0={conf.y + 1.15} x1={conf.x} y1={conf.y + conf.h} />
      <Glass x0={confEast} y0={conf.y} x1={confEast} y1={conf.y + conf.h} />
    </g>
  )
}

function Glass({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const a = project(x0, y0)
  const b = project(x1, y1)
  const h = 64
  return (
    <g className="glass-pane">
      <polygon
        points={poly([a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }])}
        fill="rgba(246,241,232,0.07)"
        stroke={brand.colors.gold}
        strokeWidth="1.6"
      />
      <polyline
        points={poly([
          { x: a.x, y: a.y - h },
          { x: b.x, y: b.y - h },
        ])}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
      />
    </g>
  )
}

function ZoneTitles() {
  const office = project(13.15, 0.28)
  const lounge = project(1.55, 10.55)
  const conf = project(14.9, 10.15)
  return (
    <g className="zone-titles" aria-hidden="true">
      <text x={office.x} y={office.y - 58} textAnchor="middle">
        CORNER OFFICE
      </text>
      <text x={lounge.x} y={lounge.y - 22} textAnchor="middle">
        LOUNGE
      </text>
      <text x={conf.x} y={conf.y - 18} textAnchor="middle">
        CONFERENCE
      </text>
    </g>
  )
}
