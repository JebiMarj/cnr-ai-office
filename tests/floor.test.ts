import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandMark, brand } from '../src/brand.tsx'
import { buildDemoSnapshot } from '../src/data/demoSeed.ts'
import { OfficeFloor } from '../src/floor/OfficeFloor.tsx'
import {
  WALK_SPEED,
  advancePose,
  buildFloorLabels,
  labelsOverlap,
  pathLength,
  placeLabels,
  placementFor,
  poseView,
  retarget,
  route,
  samplePath,
  settle,
  toFloorAgents,
  zoneFor,
} from '../src/floor/motion.ts'

const at = new Date('2026-10-31T13:30:00Z')

describe('zone mapping', () => {
  it('maps each status onto a zone', () => {
    expect(zoneFor({ isBoss: false, status: 'working' })).toBe('desk')
    expect(zoneFor({ isBoss: false, status: 'waiting_on_jv' })).toBe('desk')
    expect(zoneFor({ isBoss: false, status: 'idle' })).toBe('lounge')
    expect(zoneFor({ isBoss: false, status: 'offline' })).toBe('offline')
    expect(zoneFor({ isBoss: true, status: 'online' })).toBe('desk')
    expect(zoneFor({ isBoss: true, status: 'in_meeting' })).toBe('conference')
    expect(zoneFor({ isBoss: true, status: 'away' })).toBe('away')
  })

  it('anchors the demo floor, including JV on shift', () => {
    const agents = toFloorAgents(buildDemoSnapshot(at), at)
    const bySlug = Object.fromEntries(agents.map((agent) => [agent.slug, agent]))
    expect(placementFor(bySlug.jv!).zone).toBe('desk')
    expect(placementFor(bySlug.alex!).zone).toBe('desk')
    expect(placementFor(bySlug.sage!).zone).toBe('lounge')
    expect(placementFor(bySlug.tech!)).toEqual({ zone: 'offline', point: null })
    expect(placementFor({ slug: 'jv', isBoss: true, status: 'in_meeting' }).zone).toBe('conference')
    expect(placementFor({ slug: 'jv', isBoss: true, status: 'away' }).zone).toBe('away')
    expect(placementFor({ slug: 'gia', isBoss: false, status: 'idle' }).point).not.toEqual(
      placementFor({ slug: 'alex', isBoss: false, status: 'idle' }).point,
    )
  })
})

describe('walking', () => {
  const agents = toFloorAgents(buildDemoSnapshot(at), at)
  const dev = agents.find((agent) => agent.slug === 'dev')!

  it('follows the walkway from a desk to the lounge', () => {
    const from = placementFor(dev).point!
    const to = placementFor({ ...dev, status: 'idle' }).point!
    const points = route(from, to)
    expect(points[0]).toEqual(from)
    expect(points[points.length - 1]).toEqual(to)
    expect(points.length).toBeGreaterThan(2)
    const length = pathLength(points)
    const start = samplePath(points, 0)
    const end = samplePath(points, length)
    const mid = samplePath(points, length / 2)
    expect(start).toMatchObject({ x: from.x, y: from.y })
    expect(end).toMatchObject({ x: to.x, y: to.y })
    expect(Math.hypot(mid.x - from.x, mid.y - from.y)).toBeGreaterThan(0.5)
    expect(Math.hypot(mid.x - to.x, mid.y - to.y)).toBeGreaterThan(0.5)
    expect(points.some((point) => Math.abs(point.y - 4.7) < 0.02 || Math.abs(point.y - 9.35) < 0.02)).toBe(true)
  })

  it('starts a walk when status changes and snaps under reduced motion', () => {
    const start = settle(agents)
    const next = agents.map((agent) => (agent.slug === 'dev' ? { ...agent, status: 'idle' } : agent))
    const devPose = retarget(start, next, false).find((pose) => pose.slug === 'dev')!
    expect(devPose.zone).toBe('lounge')
    expect(devPose.traveled).toBe(0)
    expect(devPose.length).toBeGreaterThan(1)
    const stepped = advancePose(devPose, 0.4, false)
    expect(stepped.traveled).toBeCloseTo(WALK_SPEED * 0.4)
    expect(poseView(stepped)?.walking).toBe(true)
    const snapped = retarget(start, next, true).find((pose) => pose.slug === 'dev')!
    expect(snapped.length).toBe(0)
    expect(poseView(snapped)?.walking).toBe(false)
    expect(poseView(snapped)).toMatchObject(placementFor({ ...dev, status: 'idle' }).point!)
    const finished = advancePose(devPose, 30, true)
    expect(finished.traveled).toBe(devPose.length)
    expect(poseView(finished)?.walking).toBe(false)
  })

  it('walks someone offline to the door and then hides them', () => {
    const start = settle(agents)
    const next = agents.map((agent) => (agent.slug === 'gia' ? { ...agent, status: 'offline' } : agent))
    const pose = retarget(start, next, false).find((item) => item.slug === 'gia')!
    expect(pose.hideOnArrival).toBe(true)
    expect(pose.zone).toBe('offline')
    expect(pose.length).toBeGreaterThan(1)
    expect(poseView(pose)).not.toBeNull()
    expect(poseView(advancePose(pose, 100, false))).toBeNull()
  })
})

describe('label layout', () => {
  const agents = toFloorAgents(buildDemoSnapshot(at), at)

  function personAt() {
    const map: Record<string, { x: number; y: number } | null> = {}
    for (const agent of agents) {
      map[agent.slug] = placementFor(agent).point
    }
    return map
  }

  it('omits the desk name while that person is standing there', () => {
    const specs = buildFloorLabels(agents, personAt(), null)
    const ids = specs.map((spec) => spec.id)
    expect(ids).toContain('person:alex')
    expect(ids).not.toContain('desk:alex')
    expect(ids).toContain('desk:tech')
    expect(ids).not.toContain('person:tech')
    expect(ids).toContain('person:sage')
    expect(ids).toContain('desk:sage')
    expect(ids).toContain('person:jv')
    expect(ids).not.toContain('desk:jv')
  })

  it('keeps every chip from covering another', () => {
    const placed = placeLabels(buildFloorLabels(agents, personAt(), 'alex'))
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(labelsOverlap(placed[i]!, placed[j]!), `${placed[i]!.id} overlaps ${placed[j]!.id}`).toBe(false)
      }
    }
    const alex = placed.find((label) => label.id === 'person:alex')
    expect(alex?.h).toBeGreaterThan(18)
  })
})

describe('floor rendering', () => {
  const agents = toFloorAgents(buildDemoSnapshot(at), at)

  it('draws mixed statuses, labels, the waiting badge, and an empty desk', () => {
    const html = renderToStaticMarkup(createElement(OfficeFloor, { agents, onSelect: () => {}, selectedSlug: null }))
    expect(html).toContain('data-testid="office-floor"')
    expect(html).toContain('data-character="sage"')
    expect(html).toContain('data-zone="lounge"')
    expect(html).toContain('data-character="alex"')
    expect(html).toContain('data-waiting="true"')
    expect(html).toContain('data-character="jv"')
    expect(html).toContain('CORNER OFFICE')
    expect(html).toContain('LOUNGE')
    expect(html).toContain('CONFERENCE')
    expect(html).toContain('data-floor-label="person:alex"')
    expect(html).not.toContain('data-floor-label="desk:alex"')
    expect(html).toContain('data-floor-label="desk:tech"')
    expect(html).not.toContain('data-floor-label="person:tech"')
    expect(html).toContain('data-floor-label="person:sage"')
    expect(html).toContain('data-floor-label="desk:sage"')
    expect(html).toContain('Executive assistant')
    expect(html).toContain('Weekly client handoff is ready for review')
    expect(html).not.toContain('data-character="tech"')
    expect(html).toContain('data-desk="tech"')
    expect(html).toContain('data-occupancy="empty"')
  })

  it('marks the midpoint of a walk', () => {
    const next = agents.map((agent) => (agent.slug === 'dev' ? { ...agent, status: 'idle' } : agent))
    const poses = retarget(settle(agents), next, false).map((pose) =>
      pose.slug === 'dev' ? { ...pose, traveled: pose.length / 2 } : pose,
    )
    const html = renderToStaticMarkup(createElement(OfficeFloor, { agents: next, onSelect: () => {}, poses }))
    expect(html).toContain('data-character="dev"')
    expect(html).toContain('data-walking="true"')
    expect(html).toContain('data-zone="lounge"')
    const dev = poses.find((pose) => pose.slug === 'dev')!
    const view = poseView({ ...dev, traveled: dev.length / 2 })!
    expect(html).toContain(`data-x="${view.x.toFixed(2)}"`)
  })
})

describe('brand mark', () => {
  it('uses the packaged logo and the sampled accent colours', () => {
    const html = renderToStaticMarkup(createElement(BrandMark, {}))
    expect(html).toContain(brand.logo.small)
    expect(html).toContain('img')
    expect(brand.colors.pink).toBe('#E4396E')
    expect(brand.colors.orange).toBe('#F79521')
    expect(brand.colors.gold).toBe('#FEBD63')
  })
})
