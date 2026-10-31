import { describe, expect, it } from 'vitest'
import { buildDemoSnapshot } from '../src/data/demoSeed.ts'
import { floorCensus } from '../src/data/labels.ts'
import { toSceneAgents } from '../src/data/scene.ts'

describe('scene adapter', () => {
  it('exposes desk coordinates and the effective boss status', () => {
    const snapshot = buildDemoSnapshot(new Date('2026-10-31T13:30:00Z'))
    const scene = toSceneAgents(snapshot, new Date('2026-10-31T13:30:00Z'))
    const jv = scene.find((agent) => agent.slug === 'jv')
    const dev = scene.find((agent) => agent.slug === 'dev')

    const marj = scene.find((agent) => agent.slug === 'marj')
    expect(scene).toHaveLength(8)
    expect(scene.map((agent) => agent.slug)).toEqual(['jv', 'marj', 'alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia'])
    expect(jv).toMatchObject({ deskX: 76, deskY: 26, status: 'online', isBoss: true, isHuman: true, rank: 1 })
    expect(marj).toMatchObject({ deskX: 62, deskY: 22, status: 'online', isBoss: false, isHuman: true, rank: 2 })
    expect(dev).toMatchObject({ status: 'working', deskX: 68, deskY: 46 })
    expect(scene.every((agent) => agent.deskX >= 0 && agent.deskX <= 100)).toBe(true)
    expect(floorCensus(snapshot.agents)).toBe('3 working · 1 waiting on JV · 1 idle · 1 offline')
  })
})
