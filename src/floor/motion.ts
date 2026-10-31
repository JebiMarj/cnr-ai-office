import { floorTitle, STATUS_LABEL } from '../data/labels.ts'
import { toSceneAgents } from '../data/scene.ts'
import { isExecutive } from '../data/shift.ts'
import type { OfficeSnapshot } from '../data/types.ts'

/**
 * Isometric floor. World x grows east and y grows south.
 * People walk the aisle graph. Idle bots tour the lounge, rest room,
 * library, pantry, and gym on a seeded schedule.
 */

export type Vec = { x: number; y: number }

export type ZoneId = 'desk' | 'lounge' | 'conference' | 'away' | 'offline'

export type BodyPose = 'sit' | 'stand' | 'walk' | 'treadmill'

export type FloorAgent = {
  slug: string
  name: string
  role: string
  status: string
  isBoss: boolean
  isHuman: boolean
  rank: number
  currentTask: string | null
}

export type Pose = {
  slug: string
  status: string
  zone: ZoneId
  points: Vec[]
  length: number
  traveled: number
  hideOnArrival: boolean
  /** Seconds left at the current stop. Idle wander only. */
  dwell: number
  /** Index into that person's seeded tour. */
  beat: number
  body: BodyPose
}

export const TILE_W = 68
export const TILE_H = 34
export const WALK_SPEED = 4.8

export const FLOOR = { cols: 26, rows: 22 }

const NORTH = 6.45
const SOUTH = 12.25
export const CORRIDOR_Y = [NORTH, SOUTH] as const

export const ROOMS = {
  library: { x: 0.3, y: 0.28, w: 5.15, h: 5.85 },
  vp: { x: 16.35, y: 0.28, w: 4.55, h: 5.85 },
  office: { x: 21.05, y: 0.28, w: 4.65, h: 5.85 },
  pantry: { x: 0.3, y: 6.85, w: 5.15, h: 5.05 },
  conference: { x: 18.55, y: 7.05, w: 7.1, h: 4.95 },
  lounge: { x: 0.3, y: 13.05, w: 7.0, h: 4.85 },
  rest: { x: 9.6, y: 13.05, w: 5.2, h: 4.85 },
  gym: { x: 15.0, y: 13.15, w: 10.65, h: 4.75 },
  reception: { x: 10.15, y: 18.4, w: 4.9, h: 2.15 },
} as const

export type RoomId = keyof typeof ROOMS

const SHORT_ROLE: Record<string, string> = {
  jv: 'Chief Executive',
  marj: 'Vice President',
  alex: 'Executive assistant',
  mechanicus: 'GHL builder',
  sage: 'Solutions architect',
  dev: 'Full-stack dev',
  tech: 'IT support',
  gia: 'Growth & creative',
}

const DESKS: Record<string, Vec> = {
  alex: { x: 7.7, y: 3.05 },
  sage: { x: 10.55, y: 3.05 },
  dev: { x: 13.4, y: 3.05 },
  mechanicus: { x: 7.7, y: 9.45 },
  tech: { x: 10.55, y: 9.45 },
  gia: { x: 13.4, y: 9.45 },
  marj: { x: 18.55, y: 3.15 },
  jv: { x: 23.25, y: 3.15 },
}

const LOUNGE_SPOTS: Vec[] = [
  { x: 1.45, y: 14.7 },
  { x: 3.25, y: 14.6 },
  { x: 5.35, y: 14.75 },
  { x: 1.55, y: 16.35 },
  { x: 3.35, y: 16.25 },
  { x: 5.45, y: 16.4 },
]

const LOUNGE_ORDER = ['alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia']

const CONF_SEATS: Record<string, Vec> = {
  jv: { x: 23.55, y: 9.15 },
  marj: { x: 20.35, y: 10.35 },
}

export type IdlePose = 'sit' | 'stand' | 'treadmill'
export type IdleRoom = 'lounge' | 'rest' | 'library' | 'pantry' | 'gym'

export type IdlePlace = {
  id: string
  room: IdleRoom
  point: Vec
  pose: IdlePose
}

function idle(id: string, room: IdleRoom, point: Vec, pose: IdlePose): IdlePlace {
  return { id, room, point, pose }
}

const PLACES: IdlePlace[] = [
  ...LOUNGE_SPOTS.map((point, index) => idle(`lounge-${index}`, 'lounge', point, 'sit')),
  idle('rest-0', 'rest', { x: 10.45, y: 14.7 }, 'sit'),
  idle('rest-1', 'rest', { x: 12.15, y: 14.6 }, 'sit'),
  idle('rest-2', 'rest', { x: 13.7, y: 14.85 }, 'sit'),
  idle('rest-3', 'rest', { x: 11.15, y: 16.35 }, 'sit'),
  idle('rest-4', 'rest', { x: 13.05, y: 16.25 }, 'sit'),
  idle('library-0', 'library', { x: 2.35, y: 4.55 }, 'sit'),
  idle('library-1', 'library', { x: 4.05, y: 4.85 }, 'sit'),
  idle('pantry-coffee', 'pantry', { x: 1.65, y: 8.2 }, 'stand'),
  idle('pantry-0', 'pantry', { x: 2.45, y: 10.55 }, 'sit'),
  idle('pantry-1', 'pantry', { x: 4.05, y: 10.7 }, 'sit'),
  idle('gym-tread', 'gym', { x: 16.85, y: 15.75 }, 'treadmill'),
  idle('gym-weights', 'gym', { x: 19.55, y: 15.85 }, 'stand'),
  idle('gym-bench', 'gym', { x: 22.35, y: 16.15 }, 'sit'),
]

const CREW = ['alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia'] as const

const BIAS: Record<string, IdleRoom[]> = {
  alex: ['rest', 'pantry', 'library', 'gym', 'lounge'],
  mechanicus: ['gym', 'rest', 'pantry', 'library', 'lounge'],
  sage: ['library', 'gym', 'rest', 'pantry', 'lounge'],
  dev: ['gym', 'library', 'pantry', 'rest', 'lounge'],
  tech: ['pantry', 'library', 'gym', 'rest', 'lounge'],
  gia: ['rest', 'pantry', 'gym', 'library', 'lounge'],
}

const NODES: Record<string, Vec> = {
  westN: { x: 5.85, y: NORTH },
  aAlex: { x: 7.7, y: NORTH },
  v1n: { x: 9.1, y: NORTH },
  aSage: { x: 10.55, y: NORTH },
  v2n: { x: 11.95, y: NORTH },
  aDev: { x: 13.4, y: NORTH },
  spineN: { x: 15.15, y: NORTH },
  vpDoor: { x: 17.9, y: NORTH },
  officeDoor: { x: 22.15, y: NORTH },
  eastN: { x: 24.3, y: NORTH },
  vLib: { x: 5.85, y: 3.25 },
  libDoor: { x: 5.35, y: 3.25 },
  libHub: { x: 3.55, y: 3.45 },
  vPan: { x: 5.85, y: 9.15 },
  panDoor: { x: 5.35, y: 9.15 },
  panHub: { x: 3.25, y: 9.25 },
  corLounge: { x: 3.55, y: SOUTH },
  vWestS: { x: 5.85, y: SOUTH },
  sMech: { x: 7.7, y: SOUTH },
  hall: { x: 8.45, y: SOUTH },
  v1s: { x: 9.1, y: SOUTH },
  sTech: { x: 10.55, y: SOUTH },
  v2s: { x: 11.95, y: SOUTH },
  sGia: { x: 13.4, y: SOUTH },
  spineS: { x: 15.15, y: SOUTH },
  gymDoor: { x: 17.2, y: SOUTH },
  confDoor: { x: 21.15, y: SOUTH },
  loungeHub: { x: 3.55, y: 13.7 },
  loungeWest: { x: 0.95, y: 15.55 },
  restHub: { x: 12.05, y: 13.65 },
  restSide: { x: 10.05, y: 15.5 },
  gymHub: { x: 18.15, y: 13.8 },
  confJv: CONF_SEATS.jv,
  confMarj: CONF_SEATS.marj,
  hallMid: { x: 8.45, y: 16.4 },
  hallSouth: { x: 8.45, y: 18.55 },
  exitDoor: { x: 8.45, y: 21.45 },
  away: { x: 8.45, y: 23.15 },
  awayJv: { x: 7.15, y: 23.15 },
  awayMarj: { x: 9.85, y: 23.15 },
}

const AWAY_SPOTS: Record<string, Vec> = {
  jv: NODES.awayJv!,
  marj: NODES.awayMarj!,
}

for (const [slug, point] of Object.entries(DESKS)) NODES[`desk:${slug}`] = point
for (const place of PLACES) NODES[`place:${place.id}`] = place.point

const LINKS: Array<[string, string]> = [
  ['desk:alex', 'aAlex'],
  ['desk:sage', 'aSage'],
  ['desk:dev', 'aDev'],
  ['desk:mechanicus', 'sMech'],
  ['desk:tech', 'sTech'],
  ['desk:gia', 'sGia'],
  ['desk:marj', 'vpDoor'],
  ['desk:jv', 'officeDoor'],
  ['westN', 'aAlex'],
  ['aAlex', 'v1n'],
  ['v1n', 'aSage'],
  ['aSage', 'v2n'],
  ['v2n', 'aDev'],
  ['aDev', 'spineN'],
  ['spineN', 'vpDoor'],
  ['vpDoor', 'officeDoor'],
  ['officeDoor', 'eastN'],
  ['vLib', 'westN'],
  ['vLib', 'libDoor'],
  ['libDoor', 'libHub'],
  ['vPan', 'westN'],
  ['vPan', 'panDoor'],
  ['panDoor', 'panHub'],
  ['vPan', 'vWestS'],
  ['v1n', 'v1s'],
  ['v2n', 'v2s'],
  ['spineN', 'spineS'],
  ['corLounge', 'vWestS'],
  ['vWestS', 'sMech'],
  ['sMech', 'hall'],
  ['hall', 'v1s'],
  ['v1s', 'sTech'],
  ['sTech', 'v2s'],
  ['v2s', 'sGia'],
  ['sGia', 'spineS'],
  ['spineS', 'gymDoor'],
  ['gymDoor', 'confDoor'],
  ['corLounge', 'loungeHub'],
  ['loungeHub', 'loungeWest'],
  ['v2s', 'restHub'],
  ['restHub', 'restSide'],
  ['gymDoor', 'gymHub'],
  ['confDoor', 'confJv'],
  ['confDoor', 'confMarj'],
  ['hall', 'hallMid'],
  ['hallMid', 'hallSouth'],
  ['hallSouth', 'exitDoor'],
  ['exitDoor', 'away'],
  ['exitDoor', 'awayJv'],
  ['exitDoor', 'awayMarj'],
]

const HUB: Record<IdleRoom, string> = {
  lounge: 'loungeHub',
  rest: 'restHub',
  library: 'libHub',
  pantry: 'panHub',
  gym: 'gymHub',
}

for (const place of PLACES) {
  const around =
    place.room === 'lounge' && place.point.y > 15.5
      ? 'loungeWest'
      : place.room === 'rest' && place.point.y > 15.5
        ? 'restSide'
        : HUB[place.room]
  LINKS.push([around, `place:${place.id}`])
}

const GRAPH: Record<string, string[]> = {}
for (const [a, b] of LINKS) {
  ;(GRAPH[a] ??= []).push(b)
  ;(GRAPH[b] ??= []).push(a)
}

const beatCache = new Map<number, Map<string, IdlePlace>>()

export function idlePlaces(): readonly IdlePlace[] {
  return PLACES
}

export function roomOf(point: Vec): RoomId | null {
  for (const [id, room] of Object.entries(ROOMS) as Array<[RoomId, (typeof ROOMS)[RoomId]]>) {
    if (point.x >= room.x && point.x < room.x + room.w && point.y >= room.y && point.y < room.y + room.h) {
      return id
    }
  }
  return null
}

export function project(x: number, y: number): Vec {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2),
  }
}

export function floorViewBox(): string {
  const pts = [
    project(0, 0),
    project(FLOOR.cols, 0),
    project(0, FLOOR.rows),
    project(FLOOR.cols, FLOOR.rows),
    project(NODES.awayJv!.x, NODES.awayJv!.y),
    project(NODES.awayMarj!.x, NODES.awayMarj!.y),
  ]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs) - 28
  const maxX = Math.max(...xs) + 36
  const minY = Math.min(...ys) - 150
  const maxY = Math.max(...ys) + 36
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}

export function poly(points: Vec[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

export function tilePoints(x: number, y: number, w = 1, h = 1): string {
  return poly([project(x, y), project(x + w, y), project(x + w, y + h), project(x, y + h)])
}

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function pathLength(points: Vec[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += dist(points[i - 1]!, points[i]!)
  return total
}

export function zoneFor(agent: { isBoss: boolean; isHuman?: boolean; status: string }): ZoneId {
  if (isExecutive(agent)) {
    if (agent.status === 'in_meeting') return 'conference'
    if (agent.status === 'away') return 'away'
    return 'desk'
  }
  if (agent.status === 'idle') return 'lounge'
  if (agent.status === 'offline') return 'offline'
  return 'desk'
}

export function isWaiting(agent: { isBoss: boolean; isHuman?: boolean; status: string }): boolean {
  return !isExecutive(agent) && agent.status === 'waiting_on_jv'
}

export function shortRole(slug: string, role: string): string {
  return SHORT_ROLE[slug] ?? role
}

export function bubbleText(agent: FloorAgent): string {
  const task = agent.currentTask?.trim()
  if (!isExecutive(agent) && agent.status === 'waiting_on_jv') return clip(task || 'Waiting on JV')
  if (isExecutive(agent) && agent.status === 'away') return 'Out of office'
  if (isExecutive(agent) && agent.status === 'in_meeting') return clip(task || 'In a meeting')
  if (agent.status === 'idle') return clip(task || 'Taking a break')
  if (agent.status === 'offline') return 'Offline'
  if (task) return clip(task)
  if (isExecutive(agent) && agent.status === 'online') return 'On the floor'
  return clip(STATUS_LABEL[agent.status] ?? agent.status)
}

function clip(text: string): string {
  return text.length > 28 ? `${text.slice(0, 26)}…` : text
}

export type LabelKind = 'person' | 'desk'

export type LabelSpec = {
  id: string
  kind: LabelKind
  slug: string
  anchorX: number
  anchorY: number
  w: number
  h: number
  lift: number
}

export type PlacedLabel = LabelSpec & { x: number; y: number }

const NEAR_DESK = 1.45

export function labelSize(name: string, expanded: boolean): { w: number; h: number } {
  const compact = Math.max(62, Math.min(132, name.length * 7.2 + 22))
  if (!expanded) return { w: compact, h: 18 }
  return { w: Math.max(compact, 148), h: 46 }
}

export function showDeskLabel(person: Vec | null, desk: Vec): boolean {
  if (!person) return true
  return dist(person, desk) >= NEAR_DESK
}

export function labelsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  gap = 6,
): boolean {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x && a.y < b.y + b.h + gap && a.y + a.h + gap > b.y
}

export function placeLabels(specs: LabelSpec[]): PlacedLabel[] {
  const placed: PlacedLabel[] = []
  const ordered = [...specs].sort((a, b) => a.anchorY - b.anchorY || a.anchorX - b.anchorX)
  for (const spec of ordered) {
    let x = spec.anchorX - spec.w / 2
    let y = spec.anchorY - spec.lift - spec.h
    for (let step = 0; step < 18; step += 1) {
      if (!placed.some((other) => labelsOverlap({ x, y, w: spec.w, h: spec.h }, other))) break
      y -= 12
      if (step % 3 === 2) x += step % 6 === 2 ? 18 : -18
    }
    placed.push({ ...spec, x, y })
  }
  return placed
}

export function buildFloorLabels(
  agents: Array<{ slug: string; name: string; isBoss: boolean }>,
  personAt: Record<string, Vec | null>,
  selected: string | null,
): LabelSpec[] {
  const specs: LabelSpec[] = []
  for (const agent of agents) {
    const desk = deskPoint(agent.slug, agent.isBoss)
    const person = personAt[agent.slug] ?? null
    const expanded = selected === agent.slug
    const title = floorTitle(agent)
    if (person) {
      const screen = project(person.x, person.y)
      const size = labelSize(title, expanded)
      const stagger = agent.slug.length % 2 === 0 ? 12 : -12
      specs.push({
        id: `person:${agent.slug}`,
        kind: 'person',
        slug: agent.slug,
        anchorX: screen.x + stagger,
        anchorY: screen.y,
        w: size.w,
        h: size.h,
        lift: expanded ? 96 : 78,
      })
    }
    if (showDeskLabel(person, desk)) {
      const screen = project(desk.x, desk.y - 1.85)
      const size = labelSize(title, false)
      specs.push({
        id: `desk:${agent.slug}`,
        kind: 'desk',
        slug: agent.slug,
        anchorX: screen.x,
        anchorY: screen.y,
        w: size.w,
        h: size.h,
        lift: 8,
      })
    }
  }
  return specs
}

export function loungeSlot(slug: string): number {
  const known = LOUNGE_ORDER.indexOf(slug)
  if (known >= 0) return known
  let hash = 0
  for (const char of slug) hash = (hash + char.charCodeAt(0)) % LOUNGE_SPOTS.length
  return hash
}

export function deskPoint(slug: string, isBoss: boolean): Vec {
  const known = DESKS[slug]
  if (known) return known
  if (isBoss) return DESKS.jv!
  return { x: 12.2, y: 4.2 }
}

export function placementFor(agent: { slug: string; isBoss: boolean; isHuman?: boolean; status: string }): {
  zone: ZoneId
  point: Vec | null
} {
  const zone = zoneFor(agent)
  if (zone === 'offline') return { zone, point: null }
  if (zone === 'lounge') return { zone, point: LOUNGE_SPOTS[loungeSlot(agent.slug)]! }
  if (zone === 'conference') return { zone, point: CONF_SEATS[agent.slug] ?? CONF_SEATS.jv! }
  if (zone === 'away') return { zone, point: AWAY_SPOTS[agent.slug] ?? NODES.away! }
  return { zone, point: deskPoint(agent.slug, agent.isBoss) }
}

export function nearestNode(point: Vec): string {
  let best = 'spineN'
  let bestD = Infinity
  for (const [id, node] of Object.entries(NODES)) {
    const d = dist(point, node)
    if (d < bestD) {
      bestD = d
      best = id
    }
  }
  return best
}

export function bfs(start: string, goal: string): string[] {
  if (start === goal) return [start]
  const queue = [start]
  const prev = new Map<string, string | null>([[start, null]])
  for (let head = 0; head < queue.length; head += 1) {
    const current = queue[head]!
    for (const next of GRAPH[current] ?? []) {
      if (prev.has(next)) continue
      prev.set(next, current)
      if (next === goal) {
        const path = [goal]
        let cursor: string | null = current
        while (cursor) {
          path.push(cursor)
          cursor = prev.get(cursor) ?? null
        }
        return path.reverse()
      }
      queue.push(next)
    }
  }
  return [start]
}

export function sameWalkway(from: Vec, to: Vec): boolean {
  const goal = nearestNode(to)
  const ids = bfs(nearestNode(from), goal)
  return ids[ids.length - 1] === goal
}

function compress(points: Vec[]): Vec[] {
  const out: Vec[] = []
  for (const point of points) {
    const prev = out[out.length - 1]
    if (!prev || dist(prev, point) > 0.04) out.push(point)
  }
  return out.length > 0 ? out : points.slice(0, 1)
}

export function route(from: Vec, to: Vec): Vec[] {
  const ids = bfs(nearestNode(from), nearestNode(to))
  return compress([from, ...ids.map((id) => NODES[id]!), to])
}

export function samplePath(points: Vec[], distance: number): { x: number; y: number; left: boolean } {
  if (points.length === 0) return { x: 0, y: 0, left: false }
  if (points.length === 1) return { x: points[0]!.x, y: points[0]!.y, left: false }
  const total = pathLength(points)
  if (distance >= total - 1e-6) {
    const last = points[points.length - 1]!
    const prev = points[points.length - 2] ?? last
    return { x: last.x, y: last.y, left: last.x - prev.x - (last.y - prev.y) < 0 }
  }
  let remain = Math.max(0, Math.min(distance, total))
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!
    const b = points[i]!
    const len = dist(a, b)
    if (remain <= len || i === points.length - 1) {
      const t = len === 0 ? 1 : Math.min(1, remain / len)
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        left: b.x - a.x - (b.y - a.y) < 0,
      }
    }
    remain -= len
  }
  const last = points[points.length - 1]!
  return { x: last.x, y: last.y, left: false }
}

export function poseView(pose: Pose): { x: number; y: number; left: boolean; walking: boolean } | null {
  if (pose.points.length === 0) return null
  if (pose.hideOnArrival && pose.traveled >= pose.length - 0.001) return null
  const sample = samplePath(pose.points, pose.traveled)
  const walking = pose.length > 0.2 && pose.traveled < pose.length - 0.001
  return { x: sample.x, y: sample.y, left: sample.left, walking }
}

function restBody(zone: ZoneId): BodyPose {
  if (zone === 'desk' || zone === 'conference' || zone === 'lounge') return 'sit'
  return 'stand'
}

function arrived(agent: FloorAgent, point: Vec, zone: ZoneId): Pose {
  const idle = !isExecutive(agent) && agent.status === 'idle'
  return {
    slug: agent.slug,
    status: agent.status,
    zone,
    points: [point],
    length: 0,
    traveled: 0,
    hideOnArrival: false,
    dwell: idle ? dwellFor(agent.slug, 0) : 0,
    beat: 0,
    body: idle ? 'sit' : restBody(zone),
  }
}

function hidden(agent: FloorAgent): Pose {
  return {
    slug: agent.slug,
    status: agent.status,
    zone: 'offline',
    points: [],
    length: 0,
    traveled: 0,
    hideOnArrival: true,
    dwell: 0,
    beat: 0,
    body: 'stand',
  }
}

function depart(agent: FloorAgent, from: Vec): Pose {
  const points = route(from, NODES.away!)
  return {
    slug: agent.slug,
    status: agent.status,
    zone: 'offline',
    points,
    length: pathLength(points),
    traveled: 0,
    hideOnArrival: true,
    dwell: 0,
    beat: 0,
    body: 'walk',
  }
}

function approach(agent: FloorAgent, from: Vec, to: Vec, zone: ZoneId, reducedMotion: boolean): Pose {
  const points = route(from, to)
  const length = pathLength(points)
  if (reducedMotion || length < 0.2) return arrived(agent, to, zone)
  return {
    slug: agent.slug,
    status: agent.status,
    zone,
    points,
    length,
    traveled: 0,
    hideOnArrival: false,
    dwell: 0,
    beat: 0,
    body: 'walk',
  }
}

function pointOf(pose: Pose): Vec | null {
  if (pose.points.length === 0) return null
  if (pose.hideOnArrival && pose.traveled >= pose.length - 0.001) return null
  const sample = samplePath(pose.points, Math.min(pose.traveled, pose.length))
  return { x: sample.x, y: sample.y }
}

export function settle(agents: FloorAgent[]): Pose[] {
  return agents.map((agent) => {
    const place = placementFor(agent)
    return place.point ? arrived(agent, place.point, place.zone) : hidden(agent)
  })
}

export function retarget(current: Pose[], agents: FloorAgent[], reducedMotion: boolean): Pose[] {
  const bySlug = new Map(current.map((pose) => [pose.slug, pose]))
  const next = agents.map((agent) => {
    const place = placementFor(agent)
    const prev = bySlug.get(agent.slug)
    if (reducedMotion && !isExecutive(agent) && agent.status === 'idle' && place.point) {
      return arrived(agent, place.point, place.zone)
    }
    if (!prev) return place.point ? arrived(agent, place.point, place.zone) : hidden(agent)
    if (place.point && prev.zone === place.zone && !prev.hideOnArrival) {
      return prev.status === agent.status ? prev : { ...prev, status: agent.status }
    }
    if (!place.point && prev.zone === 'offline' && prev.points.length === 0) return { ...prev, status: agent.status }
    const from = pointOf(prev)
    if (!place.point) {
      if (!from || reducedMotion) return hidden(agent)
      return depart(agent, from)
    }
    return approach(agent, from ?? NODES.away!, place.point, place.zone, reducedMotion)
  })
  if (next.length === current.length && next.every((pose, index) => pose === current[index])) return current
  return next
}

export function advancePose(pose: Pose, dt: number, reducedMotion: boolean): Pose {
  if (pose.length <= 0 || pose.traveled >= pose.length) return pose
  if (reducedMotion) return { ...pose, traveled: pose.length }
  return { ...pose, traveled: Math.min(pose.length, pose.traveled + WALK_SPEED * Math.max(0, dt)) }
}

function bodyForPlace(place: IdlePlace): BodyPose {
  if (place.pose === 'treadmill') return 'treadmill'
  if (place.pose === 'sit') return 'sit'
  return 'stand'
}

function evolvePose(pose: Pose, agent: FloorAgent, dt: number): { pose: Pose; paint: boolean } {
  const walking = pose.length > 0.2 && pose.traveled < pose.length - 0.001
  if (walking) {
    const stepped = advancePose(pose, dt, false)
    const done = stepped.traveled >= stepped.length - 0.001
    if (!done) return { pose: { ...stepped, body: 'walk' }, paint: true }
    if (!isExecutive(agent) && agent.status === 'idle') {
      const stop = wanderBeat(agent.slug, pose.beat)
      return {
        pose: { ...stepped, body: bodyForPlace(stop), dwell: dwellFor(agent.slug, pose.beat) },
        paint: true,
      }
    }
    return { pose: { ...stepped, body: restBody(pose.zone), dwell: 0 }, paint: true }
  }
  if (!isExecutive(agent) && agent.status === 'idle' && pose.points.length > 0 && !pose.hideOnArrival) {
    if (pose.dwell > dt) return { pose: { ...pose, dwell: pose.dwell - dt }, paint: false }
    const beat = pose.beat + 1
    const stop = wanderBeat(agent.slug, beat)
    const from = pointOf(pose) ?? stop.point
    const points = route(from, stop.point)
    const length = pathLength(points)
    if (length < 0.2) {
      return {
        pose: {
          ...pose,
          beat,
          points: [stop.point],
          length: 0,
          traveled: 0,
          dwell: dwellFor(agent.slug, beat),
          body: bodyForPlace(stop),
          status: agent.status,
          zone: 'lounge',
          hideOnArrival: false,
        },
        paint: true,
      }
    }
    return {
      pose: {
        ...pose,
        beat,
        points,
        length,
        traveled: 0,
        dwell: 0,
        body: 'walk',
        status: agent.status,
        zone: 'lounge',
        hideOnArrival: false,
      },
      paint: true,
    }
  }
  return { pose, paint: false }
}

export function stepPoses(
  poses: Pose[],
  agents: FloorAgent[],
  dt: number,
  reducedMotion: boolean,
): { poses: Pose[]; paint: boolean } {
  if (reducedMotion || dt <= 0) return { poses, paint: false }
  const bySlug = new Map(agents.map((agent) => [agent.slug, agent]))
  let paint = false
  let changed = false
  const next = poses.map((pose) => {
    const agent = bySlug.get(pose.slug)
    if (!agent) return pose
    const evolved = evolvePose(pose, agent, dt)
    if (evolved.pose !== pose) changed = true
    if (evolved.paint) paint = true
    return evolved.pose
  })
  return { poses: changed ? next : poses, paint }
}

export function wanderBeat(slug: string, beat: number): IdlePlace {
  return beatTable(Math.max(0, Math.floor(beat))).get(slug) ?? loungePlace(slug)
}

export function dwellFor(slug: string, beat: number): number {
  const rng = mulberry32((hashSlug(slug) + Math.max(0, beat) * 131 + 17) >>> 0)
  if (beat <= 0) return Math.round((1.5 + rng() * 1.1) * 10) / 10
  const pose = wanderBeat(slug, beat).pose
  const base = pose === 'sit' ? 6.2 : pose === 'treadmill' ? 5.4 : 4.6
  return Math.round((base + rng() * 3.2) * 10) / 10
}

function loungePlace(slug: string): IdlePlace {
  return PLACES[loungeSlot(slug)] ?? PLACES[0]!
}

function beatTable(beat: number): Map<string, IdlePlace> {
  const hit = beatCache.get(beat)
  if (hit) return hit
  const map = new Map<string, IdlePlace>()
  if (beat === 0) {
    for (const slug of CREW) map.set(slug, loungePlace(slug))
    beatCache.set(0, map)
    return map
  }
  const prev = beatTable(beat - 1)
  const taken = new Set<string>()
  for (const slug of CREW) {
    const previous = prev.get(slug) ?? loungePlace(slug)
    const pick = chooseNext(slug, beat, previous, taken)
    taken.add(pick.id)
    map.set(slug, pick)
  }
  beatCache.set(beat, map)
  return map
}

function chooseNext(slug: string, beat: number, previous: IdlePlace, taken: Set<string>): IdlePlace {
  const bias = BIAS[slug] ?? ['rest', 'library', 'gym', 'pantry', 'lounge']
  const rng = mulberry32((hashSlug(slug) + beat * 997) >>> 0)
  let pool: IdlePlace[] = []
  for (let step = 0; step < bias.length && pool.length === 0; step += 1) {
    const room = bias[(beat - 1 + step) % bias.length]!
    if (room === previous.room) continue
    pool = PLACES.filter((place) => place.room === room && !taken.has(place.id))
    if (previous.pose !== 'sit') {
      const seats = pool.filter((place) => place.pose === 'sit')
      if (seats.length > 0) pool = seats
    }
  }
  if (pool.length === 0) pool = PLACES.filter((place) => !taken.has(place.id) && place.id !== previous.id)
  pool.sort((a, b) => a.id.localeCompare(b.id))
  if (pool.length === 0) return previous
  const index = pool.length === 1 ? 0 : Math.floor(rng() * pool.length)
  return pool[index] ?? previous
}

function hashSlug(slug: string): number {
  let hash = 2166136261
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function toFloorAgents(snapshot: OfficeSnapshot, now: Date): FloorAgent[] {
  const roles = new Map(snapshot.agents.map((agent) => [agent.slug, agent.role]))
  return toSceneAgents(snapshot, now).map((agent) => ({
    slug: agent.slug,
    name: agent.name,
    role: roles.get(agent.slug) ?? '',
    status: agent.status,
    isBoss: agent.isBoss,
    isHuman: agent.isHuman,
    rank: agent.rank,
    currentTask: agent.currentTask,
  }))
}

export const AWAY = NODES.away!
export const EXIT = NODES.exitDoor!
