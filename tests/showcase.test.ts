import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SHOWCASE_BANNER, EXTERNAL_CONNECTIONS } from '../src/showcase/copy.ts'
import {
  advanceSample,
  applyIncomingGoal,
  assignSpecialist,
  createSampleTask,
  decideSample,
  loadSession,
  outcomeCopy,
  sampleTitleFor,
  sanitizeGoal,
  saveSession,
  type DemoSession,
} from '../src/showcase/demo.ts'
import { findSpeechRecognition } from '../src/showcase/dictate.ts'
import { describeOfficeFeed, doneTodayCopy } from '../src/showcase/feed.ts'
import { DESK_IDENTITIES, isJarvisWorkspace } from '../src/showcase/roster.ts'
import { memoryStore, takePendingGoal, writePendingGoal } from '../src/showcase/storage.ts'
import type { Snapshot } from '../src/types.ts'

const SLUGS = ['alex', 'mechanicus', 'sage', 'dev', 'tech', 'gia'] as const
const NOW = new Date('2026-11-11T09:00:00.000Z')

function sample(goal = 'Prepare a sample onboarding checklist'): DemoSession {
  const created = createSampleTask({ goal, slugs: SLUGS, now: NOW })
  if ('error' in created) throw new Error(created.error)
  return created
}

function snap(partial: Partial<Snapshot>): Snapshot {
  return {
    agents: {},
    activities: [],
    approvals: [],
    doneToday: 0,
    connection: 'live',
    fetchedAt: NOW.toISOString(),
    ...partial,
  }
}

describe('stable slug mapping', () => {
  const tenant = JSON.parse(readFileSync('public/tenants/cnr.json', 'utf8')) as {
    owner: { name: string; title: string }
    teammates: { slug: string; name: string; role: string; color: string }[]
  }
  const migration = readFileSync('supabase/migrations/20261031103000_office_phase1.sql', 'utf8')

  it('keeps backend slugs and repo responsibilities while showing the showcase names', () => {
    expect(tenant.owner).toMatchObject({ name: 'JV', title: 'Owner' })
    expect(tenant.teammates.map((teammate) => teammate.slug)).toEqual([...SLUGS])
    const bySlug = Object.fromEntries(DESK_IDENTITIES.map((desk) => [desk.slug, desk]))
    for (const teammate of tenant.teammates) {
      expect(bySlug[teammate.slug]).toMatchObject({ name: teammate.name, role: teammate.role })
    }
    for (const desk of DESK_IDENTITIES) {
      expect(migration).toContain(`'${desk.slug}'`)
      expect(migration).toContain(`'${desk.role}'`)
    }
    expect(isJarvisWorkspace(tenant.teammates)).toBe(true)
  })

  it('leaves the white-label sample client on its own names', () => {
    const sampleClient = readFileSync('public/tenants/sample-client.json', 'utf8')
    expect(sampleClient).not.toContain('Jarvis')
    expect(sampleClient).toContain('"slug": "ava"')
  })

  it('gives EDITH and Jocasta no extra epithet, and DUM-E the gripper mark', () => {
    expect(DESK_IDENTITIES.find((desk) => desk.slug === 'tech')).toMatchObject({ name: 'EDITH', epithet: null })
    expect(DESK_IDENTITIES.find((desk) => desk.slug === 'gia')).toMatchObject({ name: 'Jocasta', epithet: null, ring: '#D5DEE6' })
    expect(DESK_IDENTITIES.find((desk) => desk.slug === 'mechanicus')).toMatchObject({ name: 'DUM-E', mark: 'gripper' })
    expect(DESK_IDENTITIES.find((desk) => desk.slug === 'alex')).toMatchObject({ mark: 'emblem', core: '#5CE1FF', ring: '#E0C17A' })
  })
})

describe('sample task progression', () => {
  it('assigns a specialist from wording, stores a generic title, and does not copy the goal into the title', () => {
    expect(assignSpecialist('Build the marketing website', SLUGS)).toBe('dev')
    expect(assignSpecialist('Review the architecture notes', SLUGS)).toBe('sage')
    expect(assignSpecialist('Set up a CRM pipeline', SLUGS)).toBe('mechanicus')
    expect(assignSpecialist('Draft a social post', SLUGS)).toBe('gia')
    expect(assignSpecialist('Help with laptop access', SLUGS)).toBe('tech')
    expect(assignSpecialist('Prepare a sample onboarding checklist', SLUGS)).toBe('alex')
    expect(assignSpecialist('Build the marketing website', ['ava', 'leo'])).toBe('ava')

    const created = sample('Build the marketing website')
    expect(created.specialistSlug).toBe('dev')
    expect(created.sampleTitle).toBe(sampleTitleFor('dev'))
    expect(created.sampleTitle).toBe('Sample build checklist')
    expect(created.sampleTitle).not.toContain('marketing')
    expect(created.phase).toBe('in_progress')
    expect(created.stepIndex).toBe(0)
    expect(created.decision).toBeNull()
  })

  it('advances only the local sample, records one decision, and resets', () => {
    const store = memoryStore()
    let current = sample()
    saveSession(current, store)
    current = advanceSample(current, new Date('2026-11-11T09:01:00.000Z'))
    expect(current.stepIndex).toBe(1)
    current = advanceSample(current, new Date('2026-11-11T09:02:00.000Z'))
    expect(current.stepIndex).toBe(2)
    expect(current.phase).toBe('in_progress')
    expect(decideSample(current, 'approved')).toBe(current)
    current = advanceSample(current, new Date('2026-11-11T09:03:00.000Z'))
    expect(current.phase).toBe('decision')
    expect(advanceSample(current)).toBe(current)
    const held = decideSample(current, 'held', new Date('2026-11-11T09:04:00.000Z'))
    expect(held.phase).toBe('recorded')
    expect(held.decision).toBe('held')
    expect(decideSample(held, 'approved')).toBe(held)
    expect(outcomeCopy('held', 'Jarvis')).toContain('No external action was taken.')
    expect(outcomeCopy('approved', 'Ultron')).toContain('Ultron')
    expect(outcomeCopy('sent_back', 'Friday')).toContain('Friday')
    saveSession(held, store)
    expect(loadSession(store)).toEqual(held)
    saveSession(null, store)
    expect(loadSession(store)).toBeNull()
  })

  it('does not replace an open sample and rejects goals that look private', () => {
    const open = sample()
    expect(applyIncomingGoal(open, 'Build a website', SLUGS).kind).toBe('blocked')
    expect(sanitizeGoal('  prepare   a checklist  ')).toEqual({ ok: true, goal: 'prepare a checklist' })
    expect(createSampleTask({ goal: 'mail ada@example.com', slugs: SLUGS })).toEqual({
      error: 'Keep the sample goal generic. Leave out addresses, phone numbers, and amounts.',
    })
    expect(createSampleTask({ goal: 'recover $11400', slugs: SLUGS })).toMatchObject({ error: expect.any(String) })
    expect(createSampleTask({ goal: 'call 415-555-1212', slugs: SLUGS })).toMatchObject({ error: expect.any(String) })
    const pending = memoryStore()
    writePendingGoal('Draft a social post', pending)
    expect(takePendingGoal(pending)).toBe('Draft a social post')
    expect(takePendingGoal(pending)).toBeNull()
  })

  it('ignores a corrupted saved sample', () => {
    const store = memoryStore(JSON.stringify({ phase: 'recorded', decision: null, goal: 'x' }))
    expect(loadSession(store)).toBeNull()
  })
})

describe('office feed stays separate', () => {
  it('describes live, stale, offline, connecting, and demo without inventing tracker rows', () => {
    const fresh = new Date(NOW.getTime() + 10_000)
    expect(describeOfficeFeed(snap({}), fresh)).toMatchObject({
      tone: 'live',
      label: 'Live',
      freshness: 'Updated just now',
    })
    expect(describeOfficeFeed(snap({}), fresh).detail).toContain('office_agents')
    const overdue = new Date(NOW.getTime() + 180_000)
    expect(describeOfficeFeed(snap({}), overdue).tone).toBe('stale')
    expect(describeOfficeFeed(snap({ connection: 'offline', fetchedAt: NOW.toISOString() }), fresh)).toMatchObject({
      tone: 'stale',
      label: 'Offline',
    })
    expect(describeOfficeFeed(snap({ connection: 'offline', fetchedAt: null }), fresh)).toMatchObject({
      tone: 'offline',
      freshness: 'No snapshot',
    })
    expect(describeOfficeFeed(snap({ connection: 'connecting', fetchedAt: null }), fresh).label).toBe('Connecting')
    expect(describeOfficeFeed(snap({ connection: 'demo', doneToday: 4 }), fresh).detail).toContain('not the live office feed')
    expect(doneTodayCopy(snap({ connection: 'demo', doneToday: 4 }))).toContain('template sample')
    expect(doneTodayCopy(snap({ connection: 'offline', fetchedAt: null }))).toContain('has not arrived')
    expect(EXTERNAL_CONNECTIONS.map((row) => [row.id, row.state])).toEqual([
      ['gmail', 'NOT CONNECTED'],
      ['calendar', 'NOT CONNECTED'],
      ['ghl', 'NOT CONNECTED'],
      ['tracker', 'NOT VERIFIED'],
    ])
    expect(EXTERNAL_CONNECTIONS.find((row) => row.id === 'tracker')?.detail).toContain('No project statuses or deadlines')
  })
})

describe('no external side effects', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('runs the sample without fetch, storage, or speech startup', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const store = memoryStore()
    const created = createSampleTask({ goal: 'Build a small website', slugs: SLUGS, now: NOW })
    if ('error' in created) throw new Error(created.error)
    const decided = decideSample(advanceSample(advanceSample(advanceSample(created))), 'approved', NOW)
    saveSession(decided, store)
    expect(loadSession(store)?.phase).toBe('recorded')
    saveSession(null, store)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(findSpeechRecognition({})).toBeNull()
    const Ctor = vi.fn()
    expect(findSpeechRecognition({ webkitSpeechRecognition: Ctor })).toBe(Ctor)
    expect(Ctor).not.toHaveBeenCalled()
  })

  it('keeps network and secret access out of the showcase engine', () => {
    const source = [
      'src/showcase/demo.ts',
      'src/showcase/storage.ts',
      'src/showcase/feed.ts',
      'src/showcase/roster.ts',
      'src/showcase/dictate.ts',
    ].map((path) => readFileSync(path, 'utf8')).join('\n')
    expect(source).not.toMatch(/fetch\s*\(/)
    expect(source).not.toMatch(/supabase/i)
    expect(source).not.toMatch(/XMLHttpRequest|WebSocket|localStorage/)
    expect(source).not.toMatch(/service_role|OFFICE_AGENT_SECRET|SUPABASE_SECRET/i)
    const ui = readFileSync('src/showcase/CommandCenter.tsx', 'utf8') + readFileSync('src/App.tsx', 'utf8')
    expect(ui).toContain('SHOWCASE_BANNER')
    expect(SHOWCASE_BANNER).toBe('Showcase demo — sample tasks; no external actions')
    const css = readFileSync('src/showcase/commandCenter.css', 'utf8') + readFileSync('src/styles.css', 'utf8')
    expect(css).toContain('prefers-reduced-motion')
    expect(css).toContain('max-width: 720px')
    const emblem = readFileSync('public/jarvis-emblem.svg', 'utf8')
    expect(emblem).not.toMatch(/href\s*=\s*["']https?:/)
    expect(emblem.toLowerCase()).toContain('#5ce1ff')
    expect(emblem.toLowerCase()).toContain('#e0c17a')
  })
})
