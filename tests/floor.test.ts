import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandMark, brand } from '../src/brand.tsx'
import { buildDemoSnapshot } from '../src/data/demoSeed.ts'
import { OfficeFloor } from '../src/floor/OfficeFloor.tsx'
import { seatYaw } from '../src/floor/scene/facing.ts'
import { isExecutive } from '../src/data/shift.ts'
import {
  CORRIDOR_Y,
  ROOMS,
  WALK_SPEED,
  advancePose,
  buildFloorLabels,
  deskNameplates,
  deskPoint,
  dwellFor,
  idlePlaces,
  labelsOverlap,
  pathLength,
  placeLabels,
  placementFor,
  poseView,
  retarget,
  roomOf,
  route,
  sameWalkway,
  samplePath,
  errandDestination,
  errandTarget,
  initialSeatedSpan,
  isOnDuty,
  nextSeatedSpan,
  settle,
  stepPoses,
  toFloorAgents,
  wanderBeat,
  zoneFor,
} from '../src/floor/motion.ts'

const at = new Date('2026-10-31T13:30:00Z')

describe('zone mapping', () => {
  it('maps each status onto a zone', () => {
    expect(zoneFor({ isBoss: false, status: 'working' })).toBe('desk')
    expect(zoneFor({ isBoss: false, status: 'waiting_on_jv' })).toBe('desk')
    expect(zoneFor({ isBoss: false, status: 'idle' })).toBe('desk')
    expect(zoneFor({ isBoss: false, status: 'offline' })).toBe('offline')
    expect(isOnDuty('working')).toBe(true)
    expect(isOnDuty('idle')).toBe(true)
    expect(isOnDuty('waiting_on_jv')).toBe(true)
    expect(isOnDuty('online')).toBe(true)
    expect(isOnDuty('offline')).toBe(false)
    expect(isOnDuty('away')).toBe(false)
    expect(isOnDuty('in_meeting')).toBe(false)
    expect(zoneFor({ isBoss: true, status: 'online' })).toBe('desk')
    expect(zoneFor({ isBoss: true, status: 'in_meeting' })).toBe('conference')
    expect(zoneFor({ isBoss: true, status: 'away' })).toBe('away')
  })

  it('anchors the demo floor, including JV on shift', () => {
    const agents = toFloorAgents(buildDemoSnapshot(at), at)
    const bySlug = Object.fromEntries(agents.map((agent) => [agent.slug, agent]))
    expect(placementFor(bySlug.jv!).zone).toBe('desk')
    expect(placementFor(bySlug.alex!).zone).toBe('desk')
    expect(placementFor(bySlug.sage!).zone).toBe('desk')
    expect(placementFor(bySlug.sage!).point).toEqual(deskPoint('sage', false))
    expect(placementFor(bySlug.tech!)).toEqual({ zone: 'offline', point: null })
    expect(placementFor({ slug: 'jv', isBoss: true, status: 'in_meeting' }).zone).toBe('conference')
    expect(placementFor({ slug: 'jv', isBoss: true, status: 'away' }).zone).toBe('away')
    expect(placementFor(bySlug.marj!).zone).toBe('desk')
    expect(placementFor({ slug: 'marj', isBoss: false, isHuman: true, status: 'in_meeting' }).zone).toBe('conference')
    expect(placementFor({ slug: 'marj', isBoss: false, isHuman: true, status: 'away' }).zone).toBe('away')
    expect(placementFor({ slug: 'marj', isBoss: false, isHuman: true, status: 'in_meeting' }).point).not.toEqual(
      placementFor({ slug: 'jv', isBoss: true, status: 'in_meeting' }).point,
    )
    expect(placementFor({ slug: 'gia', isBoss: false, status: 'idle' }).point).not.toEqual(
      placementFor({ slug: 'alex', isBoss: false, status: 'idle' }).point,
    )
    expect(agents.map((agent) => agent.slug)).toEqual(['jv', 'marj', 'alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia'])
  })
})

describe('walking', () => {
  const agents = toFloorAgents(buildDemoSnapshot(at), at)
  const dev = agents.find((agent) => agent.slug === 'dev')!

  it('follows the walkway from a desk to the kitchenette', () => {
    const from = placementFor(dev).point!
    const to = { x: 9.5, y: 1.35 }
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
    expect(points.some((point) => CORRIDOR_Y.some((y) => Math.abs(point.y - y) < 0.02))).toBe(true)
  })

  it('starts a walk when status changes and snaps under reduced motion', () => {
    const start = settle(agents)
    const next = agents.map((agent) => (agent.slug === 'marj' ? { ...agent, status: 'in_meeting' } : agent))
    const marjPose = retarget(start, next, false).find((pose) => pose.slug === 'marj')!
    expect(marjPose.zone).toBe('conference')
    expect(marjPose.errand).toBe(0)
    expect(marjPose.traveled).toBe(0)
    expect(marjPose.length).toBeGreaterThan(1)
    const stepped = advancePose(marjPose, 0.4, false)
    expect(stepped.traveled).toBeCloseTo(WALK_SPEED * 0.4)
    expect(poseView(stepped)?.walking).toBe(true)
    const snapped = retarget(start, next, true).find((pose) => pose.slug === 'marj')!
    expect(snapped.length).toBe(0)
    expect(poseView(snapped)?.walking).toBe(false)
    expect(poseView(snapped)).toMatchObject(placementFor({ ...agents.find((agent) => agent.slug === 'marj')!, status: 'in_meeting' }).point!)
    const finished = advancePose(marjPose, 30, true)
    expect(finished.traveled).toBe(marjPose.length)
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

  it('keeps one chip on the person and a nameplate only on an empty desk', () => {
    const specs = buildFloorLabels(agents, personAt(), null)
    const ids = specs.map((spec) => spec.id)
    expect(ids.filter((id) => id.startsWith('desk:'))).toEqual([])
    expect(ids).toContain('person:alex')
    expect(ids).toContain('person:sage')
    expect(ids).not.toContain('person:tech')
    expect(ids).toContain('person:jv')
    expect(ids).toContain('person:marj')
    expect(deskNameplates(agents, personAt()).map((plate) => plate.slug).sort()).toEqual(['tech'])
    expect(seatYaw('jv', 'conference')).toBeCloseTo(-Math.PI / 2)
    expect(seatYaw('marj', 'conference')).toBeCloseTo(Math.PI / 2)
  })

  it('keeps chips apart when idle bots are spread through the new rooms', () => {
    const spread = agents.map((agent) => (isExecutive(agent) ? agent : { ...agent, status: 'idle' }))
    const at: Record<string, { x: number; y: number } | null> = {}
    for (const agent of spread) {
      at[agent.slug] = isExecutive(agent) ? placementFor(agent).point : wanderBeat(agent.slug, 1).point
    }
    const placed = placeLabels(buildFloorLabels(spread, at, 'sage'))
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(labelsOverlap(placed[i]!, placed[j]!), `${placed[i]!.id} overlaps ${placed[j]!.id}`).toBe(false)
      }
    }
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
    expect(html).toContain('data-zone="desk"')
    expect(html).not.toContain('data-zone="lounge"')
    expect(html).toContain('data-character="alex"')
    expect(html).toContain('data-waiting="true"')
    expect(html).toContain('data-character="jv"')
    expect(html).toContain('data-character="marj"')
    expect(html).toContain('data-figure="human"')
    expect(html).toContain('data-outfit="suit"')
    expect(html).toContain('data-outfit="vp"')
    expect(html).toContain('data-gait="sit"')
    expect(html).toContain('Marj · VP')
    expect(html).toContain('Corner office')
    expect(html).toContain('VP office')
    expect(html).toContain('Kitchenette')
    expect(html).toContain('Meeting room')
    expect(html).toContain('Lounge')
    expect(html).toContain('Reception')
    expect(html).toContain('Wood floor')
    expect(html).toContain('Tile floor')
    expect(html).toContain('data-floor-label="person:alex"')
    expect(html).not.toContain('data-floor-label="desk:')
    expect(html).not.toContain('data-floor-label="person:tech"')
    expect(html).toContain('data-floor-label="person:sage"')
    expect(html).toContain('data-nameplate="tech"')
    expect(html).not.toContain('data-nameplate="sage"')
    expect(html).not.toContain('data-nameplate="alex"')
    expect(html).toContain('Executive assistant')
    expect(html).toContain('Weekly client handoff is ready for review')
    expect(html).not.toContain('data-character="tech"')
    expect(html).toContain('data-desk="tech"')
    expect(html).toContain('data-occupancy="empty"')
  })

  it('marks the midpoint of a walk', () => {
    const next = agents.map((agent) => (agent.slug === 'marj' ? { ...agent, status: 'in_meeting' } : agent))
    const poses = retarget(settle(agents), next, false).map((pose) =>
      pose.slug === 'marj' ? { ...pose, traveled: pose.length / 2 } : pose,
    )
    const html = renderToStaticMarkup(createElement(OfficeFloor, { agents: next, onSelect: () => {}, poses }))
    expect(html).toContain('data-character="marj"')
    expect(html).toContain('data-walking="true"')
    expect(html).toContain('data-gait="walk"')
    expect(html).toContain('data-zone="conference"')
    const marj = poses.find((pose) => pose.slug === 'marj')!
    const view = poseView({ ...marj, traveled: marj.length / 2 })!
    expect(html).toContain(`data-x="${view.x.toFixed(2)}"`)
  })
})

describe('idle wander', () => {
  const crew = ['alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia']

  it('tours seeded rooms without two people sharing a stop', () => {
    const first = [0, 1, 2, 3, 4, 5].map((beat) => wanderBeat('sage', beat))
    const again = [0, 1, 2, 3, 4, 5].map((beat) => wanderBeat('sage', beat))
    expect(again.map((place) => place.id)).toEqual(first.map((place) => place.id))
    expect(first[0]).toMatchObject({ room: 'lounge', pose: 'sit' })
    expect(first[1]!.room).toBe('pantry')
    expect(new Set(first.map((place) => place.room)).size).toBeGreaterThanOrEqual(3)
    for (let index = 1; index < first.length; index += 1) {
      expect(first[index]!.room).not.toBe(first[index - 1]!.room)
    }
    for (const beat of [0, 1, 2, 3]) {
      const ids = crew.map((slug) => wanderBeat(slug, beat).id)
      expect(new Set(ids).size).toBe(6)
    }
    for (const place of idlePlaces()) {
      const room = ROOMS[place.room]
      expect(place.point.x).toBeGreaterThan(room.x)
      expect(place.point.x).toBeLessThan(room.x + room.w)
      expect(place.point.y).toBeGreaterThan(room.y)
      expect(place.point.y).toBeLessThan(room.y + room.h)
      expect(sameWalkway(place.point, deskPoint('dev', false))).toBe(true)
    }
    expect(dwellFor('sage', 0)).toBeGreaterThan(1)
    expect(dwellFor('sage', 0)).toBeLessThan(4)
    expect(dwellFor('sage', 2)).toBeGreaterThanOrEqual(4)
    expect(dwellFor('dev', 2)).toBe(dwellFor('dev', 2))
    expect(roomOf(wanderBeat('sage', 0).point)).toBe('lounge')
  })

  it('keeps the seeded amenity tour available for the room map', () => {
    expect(wanderBeat('sage', 1).room).not.toBe('lounge')
    expect(roomOf(wanderBeat('dev', 0).point)).toBe('lounge')
  })
})

describe('work breaks', () => {
  const agents = toFloorAgents(buildDemoSnapshot(at), at)
  const roster = ['jv', 'marj', 'alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia']

  it('seats everyone who is not offline or away at their own desk', () => {
    const poses = settle(agents)
    for (const agent of agents) {
      const pose = poses.find((item) => item.slug === agent.slug)!
      if (agent.status === 'offline') {
        expect(poseView(pose)).toBeNull()
        continue
      }
      expect(pose.errand).toBe(0)
      expect(pose.body).toBe('sit')
      expect(pose.points[0]).toEqual(deskPoint(agent.slug, agent.isBoss))
      expect(pose.zone).toBe('desk')
    }
  })

  it('staggers the first break across the ten-minute cycle', () => {
    const spans = roster.map((slug) => initialSeatedSpan(slug))
    const sorted = [...spans].sort((a, b) => a - b)
    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index]! - sorted[index - 1]!).toBeGreaterThan(40)
    }
    expect(Math.min(...spans)).toBeGreaterThan(10)
    expect(Math.max(...spans) - Math.min(...spans)).toBeGreaterThan(400)
    for (const slug of roster) {
      const gap = nextSeatedSpan(slug, 1)
      expect(gap).toBeGreaterThan(500)
      expect(gap).toBeLessThan(600)
      expect(errandTarget(slug, 0)).toBeGreaterThanOrEqual(30)
      expect(errandTarget(slug, 0)).toBeLessThanOrEqual(60)
    }
  })

  it('visits the kitchenette, the lounge, and another desk', () => {
    const kinds = new Set(roster.flatMap((slug) => [0, 1, 2].map((cycle) => errandDestination(slug, cycle).kind)))
    expect(kinds).toEqual(new Set(['pantry', 'lounge', 'desk']))
    const visit = errandDestination('jv', 2)
    expect(visit.kind).toBe('desk')
    expect(visit.id.startsWith('visit:')).toBe(true)
    expect(visit.id).not.toBe('visit:jv')
  })

  it('walks out for about 30–60s and sits back down', () => {
    const dev = agents.find((agent) => agent.slug === 'dev')!
    let poses = settle([dev]).map((pose) => ({ ...pose, dwell: 0.05 }))
    let away = 0
    let left = false
    let back = false
    for (let step = 0; step < 900; step += 1) {
      const stepped = stepPoses(poses, [dev], 0.1, false)
      poses = stepped.poses
      const now = poses[0]!
      if (now.errand !== 0) {
        left = true
        away += 0.1
        continue
      }
      if (!left) continue
      back = true
      expect(now.body).toBe('sit')
      expect(now.points[0]).toEqual(deskPoint('dev', false))
      expect(now.zone).toBe('desk')
      break
    }
    expect(left).toBe(true)
    expect(back).toBe(true)
    expect(away).toBeGreaterThanOrEqual(29)
    expect(away).toBeLessThanOrEqual(62)
  })

  it('stays in the chair when motion is reduced', () => {
    const dev = agents.find((agent) => agent.slug === 'dev')!
    const seated = settle([dev]).map((pose) => ({ ...pose, dwell: 0 }))
    const held = stepPoses(seated, [dev], 40, true)
    expect(held.paint).toBe(false)
    expect(held.poses[0]!.errand).toBe(0)
    expect(held.poses[0]!.body).toBe('sit')
    const walking = seated.map((pose) => ({
      ...pose,
      errand: 1 as const,
      body: 'walk' as const,
      length: 4,
      traveled: 1,
      points: [deskPoint('dev', false), { x: 9.5, y: 1.35 }],
    }))
    const snapped = retarget(walking, [dev], true)[0]!
    expect(snapped.errand).toBe(0)
    expect(snapped.body).toBe('sit')
    expect(snapped.length).toBe(0)
    expect(snapped.points[0]).toEqual(deskPoint('dev', false))
  })

  it('keeps meetings at the table and offline people hidden', () => {
    const start = settle(agents)
    const meeting = agents.map((agent) => (agent.slug === 'jv' ? { ...agent, status: 'in_meeting' } : agent))
    const jv = retarget(start, meeting, false).find((pose) => pose.slug === 'jv')!
    expect(jv.zone).toBe('conference')
    expect(jv.errand).toBe(0)
    expect(jv.length).toBeGreaterThan(1)
    expect(poseView(start.find((pose) => pose.slug === 'tech')!)).toBeNull()
    const away = retarget(start, agents.map((agent) => (agent.slug === 'marj' ? { ...agent, status: 'away' } : agent)), false)
    expect(away.find((pose) => pose.slug === 'marj')!.zone).toBe('away')
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
