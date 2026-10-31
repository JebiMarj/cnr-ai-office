import { toSceneAgents } from '../data/scene.ts'
import { STATUS_LABEL } from '../data/labels.ts'
import type { OfficeSnapshot } from '../data/types.ts'

/**
 * Isometric floor model. World x grows east and y grows south, matching
 * desk_x / desk_y. The screen projection is a 2:1 isometric diamond.
 * Characters move on a walkway graph so a status change is a path, not a jump.
 */

export type Vec = { x: number; y: number }

export type ZoneId = 'desk' | 'lounge' | 'conference' | 'away' | 'offline'

export type FloorAgent = {
  slug: string
  name: string
  role: string
  status: string
  isBoss: boolean
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
}

export const TILE_W = 68
export const TILE_H = 34
export const WALK_SPEED = 3.4

export const FLOOR = { cols: 18, rows: 16 }

export const ROOMS = {
  office: { x: 12.2, y: 0.25, w: 5.5, h: 4.15 },
  conference: { x: 12.15, y: 8.55, w: 5.55, h: 5.35 },
  lounge: { x: 0.35, y: 10.35, w: 6.7, h: 4.15 },
} as const

const SHORT_ROLE: Record<string, string> = {
  jv: 'Chief Executive',
  alex: 'Executive assistant',
  mechanicus: 'GHL builder',
  sage: 'Solutions architect',
  dev: 'Full-stack dev',
  tech: 'IT support',
  gia: 'Growth & creative',
}

/** Feet positions. Furniture sits north of these so the person reads as seated. */
const DESKS: Record<string, Vec> = {
  alex: { x: 2.2, y: 2.5 },
  sage: { x: 5.6, y: 2.5 },
  dev: { x: 9.0, y: 2.5 },
  mechanicus: { x: 2.2, y: 7.6 },
  tech: { x: 5.6, y: 7.6 },
  gia: { x: 9.0, y: 7.6 },
  jv: { x: 15.15, y: 2.45 },
}

const LOUNGE_SPOTS: Vec[] = [
  { x: 1.25, y: 11.35 },
  { x: 5.05, y: 11.3 },
  { x: 1.35, y: 12.85 },
  { x: 5.15, y: 12.75 },
  { x: 3.15, y: 11.05 },
  { x: 3.25, y: 13.45 },
]

const LOUNGE_ORDER = ['alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia']

/**
 * Walkway nodes. Vertical links sit in the gaps between desk columns
 * (x ≈ 3.8 and 7.1) so a route never cuts through a desk or a glass wall.
 * Lounge spots and desks are nodes too, so nearest-node routing starts
 * at the character's actual anchor.
 */
const NODES: Record<string, Vec> = {
  a2: { x: 2.2, y: 4.7 },
  v1n: { x: 3.9, y: 4.7 },
  a5: { x: 5.6, y: 4.7 },
  v2n: { x: 7.3, y: 4.7 },
  a8: { x: 9.0, y: 4.7 },
  spine: { x: 11.25, y: 4.7 },
  officeDoor: { x: 12.95, y: 4.7 },
  s2: { x: 2.2, y: 9.35 },
  v1s: { x: 3.9, y: 9.35 },
  s5: { x: 5.6, y: 9.35 },
  v2s: { x: 7.3, y: 9.35 },
  s8: { x: 9.0, y: 9.35 },
  spineLow: { x: 11.25, y: 9.35 },
  confDoor: { x: 12.7, y: 9.2 },
  confWest: { x: 13.15, y: 12.7 },
  confSeat: { x: 15.15, y: 12.7 },
  loungeHub: { x: 3.3, y: 10.15 },
  loungeInner: { x: 3.2, y: 12.15 },
  exitDoor: { x: 9.15, y: 15.65 },
  away: { x: 9.15, y: 17.15 },
}

for (const [slug, point] of Object.entries(DESKS)) NODES[`desk:${slug}`] = point
LOUNGE_SPOTS.forEach((point, index) => {
  NODES[`spot:${index}`] = point
})

const LINKS: Array<[string, string]> = [
  ['desk:alex', 'a2'],
  ['desk:sage', 'a5'],
  ['desk:dev', 'a8'],
  ['desk:mechanicus', 's2'],
  ['desk:tech', 's5'],
  ['desk:gia', 's8'],
  ['desk:jv', 'officeDoor'],
  ['a2', 'v1n'],
  ['v1n', 'a5'],
  ['a5', 'v2n'],
  ['v2n', 'a8'],
  ['a8', 'spine'],
  ['spine', 'officeDoor'],
  ['v1n', 'v1s'],
  ['v2n', 'v2s'],
  ['s2', 'v1s'],
  ['v1s', 's5'],
  ['s5', 'v2s'],
  ['v2s', 's8'],
  ['s8', 'spineLow'],
  ['spine', 'spineLow'],
  ['spineLow', 'confDoor'],
  ['confDoor', 'confWest'],
  ['confWest', 'confSeat'],
  ['s2', 'loungeHub'],
  ['loungeHub', 'loungeInner'],
  ['s8', 'exitDoor'],
  ['spineLow', 'exitDoor'],
  ['exitDoor', 'away'],
]

for (let index = 0; index < LOUNGE_SPOTS.length; index += 1) {
  LINKS.push(['loungeInner', `spot:${index}`])
}

const GRAPH: Record<string, string[]> = {}
for (const [a, b] of LINKS) {
  ;(GRAPH[a] ??= []).push(b)
  ;(GRAPH[b] ??= []).push(a)
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
    project(NODES.away.x, NODES.away.y),
  ]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const minX = Math.min(...xs) - 56
  const maxX = Math.max(...xs) + 64
  const minY = Math.min(...ys) - 128
  const maxY = Math.max(...ys) + 64
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
}

export function poly(points: Vec[]): string {
  return points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

export function tilePoints(x: number, y: number, w = 1, h = 1): string {
  return poly([
    project(x, y),
    project(x + w, y),
    project(x + w, y + h),
    project(x, y + h),
  ])
}

export function dist(a: Vec, b: Vec): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

export function pathLength(points: Vec[]): number {
  let total = 0
  for (let i = 1; i < points.length; i += 1) total += dist(points[i - 1]!, points[i]!)
  return total
}

export function zoneFor(agent: { isBoss: boolean; status: string }): ZoneId {
  if (agent.isBoss) {
    if (agent.status === 'in_meeting') return 'conference'
    if (agent.status === 'away') return 'away'
    return 'desk'
  }
  if (agent.status === 'idle') return 'lounge'
  if (agent.status === 'offline') return 'offline'
  return 'desk'
}

export function isWaiting(agent: { isBoss: boolean; status: string }): boolean {
  return !agent.isBoss && agent.status === 'waiting_on_jv'
}

export function shortRole(slug: string, role: string): string {
  return SHORT_ROLE[slug] ?? role
}

export function bubbleText(agent: FloorAgent): string {
  const task = agent.currentTask?.trim()
  if (!agent.isBoss && agent.status === 'waiting_on_jv') return clip(task || 'Waiting on JV')
  if (agent.isBoss && agent.status === 'away') return 'Out of office'
  if (agent.isBoss && agent.status === 'in_meeting') return clip(task || 'In a meeting')
  if (agent.status === 'idle') return clip(task || 'In the lounge')
  if (agent.status === 'offline') return 'Offline'
  if (task) return clip(task)
  if (agent.isBoss && agent.status === 'online') return 'On the floor'
  return clip(STATUS_LABEL[agent.status] ?? agent.status)
}

function clip(text: string): string {
  return text.length > 28 ? `${text.slice(0, 26)}…` : text
}

export function loungeSlot(slug: string): number {
  const known = LOUNGE_ORDER.indexOf(slug)
  if (known >= 0) return known
  let hash = 0
  for (const char of slug) hash = (hash + char.charCodeAt(0)) % LOUNGE_SPOTS.length
  return hash
}

export function deskPoint(slug: string, isBoss: boolean): Vec {
  if (isBoss || slug === 'jv') return DESKS.jv
  return DESKS[slug] ?? { x: 10.4, y: 3.05 + loungeSlot(slug) * 0.08 }
}

export function placementFor(agent: { slug: string; isBoss: boolean; status: string }): {
  zone: ZoneId
  point: Vec | null
} {
  const zone = zoneFor(agent)
  if (zone === 'offline') return { zone, point: null }
  if (zone === 'lounge') return { zone, point: LOUNGE_SPOTS[loungeSlot(agent.slug)]! }
  if (zone === 'conference') return { zone, point: NODES.confSeat }
  if (zone === 'away') return { zone, point: NODES.away }
  return { zone, point: deskPoint(agent.slug, agent.isBoss) }
}

export function nearestNode(point: Vec): string {
  let best = 'spine'
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
  return [start, goal]
}

function compress(points: Vec[]): Vec[] {
  const out: Vec[] = []
  for (const point of points) {
    const prev = out[out.length - 1]
    if (!prev || dist(prev, point) > 0.04) out.push(point)
  }
  return out.length > 0 ? out : points.slice(0, 1)
}

/** Polyline from `from` to `to` along the walkway. Includes both endpoints. */
export function route(from: Vec, to: Vec): Vec[] {
  const ids = bfs(nearestNode(from), nearestNode(to))
  return compress([from, ...ids.map((id) => NODES[id]!), to])
}

export function samplePath(points: Vec[], distance: number): { x: number; y: number; left: boolean } {
  if (points.length === 0) return { x: 0, y: 0, left: false }
  if (points.length === 1) return { x: points[0]!.x, y: points[0]!.y, left: false }
  const total = pathLength(points)
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

function arrived(agent: FloorAgent, point: Vec, zone: ZoneId): Pose {
  return {
    slug: agent.slug,
    status: agent.status,
    zone,
    points: [point],
    length: 0,
    traveled: 0,
    hideOnArrival: false,
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
  }
}

function depart(agent: FloorAgent, from: Vec): Pose {
  const points = route(from, NODES.away)
  return {
    slug: agent.slug,
    status: agent.status,
    zone: 'offline',
    points,
    length: pathLength(points),
    traveled: 0,
    hideOnArrival: true,
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

/**
 * Rebuild poses after a status change.
 * Same zone keeps the current walk. A new zone starts a path from the
 * current feet. Reduced motion snaps to the destination.
 * Going offline walks to the door, then the figure is dropped.
 * Coming back from offline walks in from that door.
 */
export function retarget(current: Pose[], agents: FloorAgent[], reducedMotion: boolean): Pose[] {
  const bySlug = new Map(current.map((pose) => [pose.slug, pose]))
  const next = agents.map((agent) => {
    const place = placementFor(agent)
    const prev = bySlug.get(agent.slug)
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
    return approach(agent, from ?? NODES.away, place.point, place.zone, reducedMotion)
  })
  if (next.length === current.length && next.every((pose, index) => pose === current[index])) return current
  return next
}

export function advancePose(pose: Pose, dt: number, reducedMotion: boolean): Pose {
  if (pose.length <= 0 || pose.traveled >= pose.length) return pose
  if (reducedMotion) return { ...pose, traveled: pose.length }
  return { ...pose, traveled: Math.min(pose.length, pose.traveled + WALK_SPEED * Math.max(0, dt)) }
}

export function toFloorAgents(snapshot: OfficeSnapshot, now: Date): FloorAgent[] {
  const roles = new Map(snapshot.agents.map((agent) => [agent.slug, agent.role]))
  return toSceneAgents(snapshot, now).map((agent) => ({
    slug: agent.slug,
    name: agent.name,
    role: roles.get(agent.slug) ?? '',
    status: agent.status,
    isBoss: agent.isBoss,
    currentTask: agent.currentTask,
  }))
}

export const AWAY = NODES.away
export const EXIT = NODES.exitDoor
