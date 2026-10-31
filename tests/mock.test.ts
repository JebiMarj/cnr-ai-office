import { describe, expect, it } from 'vitest'
import { buildDemoSnapshot } from '../src/data/demoSeed.ts'
import { applyMockStep, demoScript } from '../src/data/mockSource.ts'

describe('demo floor updates', () => {
  it('moves Dev to idle and closes the working activity', () => {
    const start = buildDemoSnapshot(new Date('2026-10-31T13:30:00Z'))
    const next = applyMockStep(start, demoScript[0]!, new Date('2026-10-31T13:31:00Z'))
    expect(next.agents.find((agent) => agent.slug === 'dev')).toMatchObject({
      status: 'idle',
      currentTask: 'Standing by for the next deploy',
    })
    expect(next.activities.find((item) => item.taskTitle === 'Wiring realtime desk updates')?.status).toBe('done')
  })

  it('adds the slow-query activity only once across the whole script', () => {
    let snapshot = buildDemoSnapshot(new Date('2026-10-31T13:30:00Z'))
    for (const step of demoScript) {
      snapshot = applyMockStep(snapshot, step, new Date('2026-10-31T13:32:00Z'))
    }
    const copies = snapshot.activities.filter((item) => item.taskTitle === 'Tracing a slow query')
    expect(copies).toHaveLength(1)
  })
})
