import type { DemoStore } from './storage.ts'

export const SAMPLE_STEPS = [
  { id: 'intake', label: 'Sample intake saved in this browser' },
  { id: 'brief', label: 'Sample brief handed to the assigned specialist' },
  { id: 'ready', label: 'Sample marked ready for your decision' },
] as const

export type DemoPhase = 'in_progress' | 'decision' | 'recorded'
export type DemoDecision = 'approved' | 'held' | 'sent_back'

export type DemoSession = {
  id: string
  goal: string
  sampleTitle: string
  specialistSlug: string
  phase: DemoPhase
  stepIndex: number
  decision: DemoDecision | null
  createdAt: string
  updatedAt: string
}

export type CreateResult = DemoSession | { error: string }

const SAMPLE_TITLES: Record<string, string> = {
  alex: 'Sample coordination brief',
  dev: 'Sample build checklist',
  sage: 'Sample architecture note',
  tech: 'Sample support checklist',
  gia: 'Sample creative outline',
  mechanicus: 'Sample pipeline checklist',
}

const ROUTES: { slug: string; words: readonly string[] }[] = [
  { slug: 'mechanicus', words: ['ghl', 'gohighlevel', 'highlevel', 'pipeline', 'crm', 'funnel', 'workflow', 'automation'] },
  { slug: 'tech', words: ['support', 'access', 'device', 'laptop', 'install', 'password', 'login', 'wifi', 'computer'] },
  { slug: 'gia', words: ['creative', 'content', 'social', 'post', 'brand', 'growth', 'design', 'copy', 'caption'] },
  { slug: 'sage', words: ['architecture', 'architect', 'advisory', 'advisor'] },
  { slug: 'dev', words: ['code', 'build', 'app', 'website', 'api', 'bug', 'develop', 'developer', 'frontend', 'backend', 'software'] },
  { slug: 'alex', words: ['coordinate', 'coordination', 'brief', 'priority', 'handoff', 'schedule'] },
]

const GOAL_MAX = 160

export function sampleTitleFor(slug: string): string {
  return SAMPLE_TITLES[slug] ?? 'Sample task'
}

export function tokenizeGoal(goal: string): string[] {
  return goal.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

/** Local wording rule. It does not dispatch work and does not call a service. */
export function assignSpecialist(goal: string, slugs: readonly string[]): string {
  if (slugs.length === 0) throw new Error('No specialists to assign.')
  const words = new Set(tokenizeGoal(goal))
  const hit = ROUTES.find((route) => route.words.some((word) => words.has(word)))
  if (hit && slugs.includes(hit.slug)) return hit.slug
  if (slugs.includes('alex')) return 'alex'
  return slugs[0]
}

export function sanitizeGoal(input: string): { ok: true; goal: string } | { ok: false; error: string } {
  const goal = input.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, GOAL_MAX)
  if (!goal) return { ok: false, error: 'Enter a goal to start a sample.' }
  const readable = goal.match(/\p{L}|\p{N}/gu) ?? []
  if (readable.length < 3) return { ok: false, error: 'Enter a goal of at least a few words.' }
  if (/@/.test(goal) || /\$\s?\d/.test(goal) || /\b\d{3}[-.\s]\d{3}\b/.test(goal)) {
    return { ok: false, error: 'Keep the sample goal generic. Leave out addresses, phone numbers, and amounts.' }
  }
  return { ok: true, goal }
}

export function createSampleTask(input: { goal: string; slugs: readonly string[]; now?: Date }): CreateResult {
  const cleaned = sanitizeGoal(input.goal)
  if (!cleaned.ok) return { error: cleaned.error }
  if (input.slugs.length === 0) return { error: 'This workspace has no specialists to assign.' }
  const now = input.now ?? new Date()
  const stamp = now.toISOString()
  const specialistSlug = assignSpecialist(cleaned.goal, input.slugs)
  return {
    id: `sample-${now.getTime()}`,
    goal: cleaned.goal,
    sampleTitle: sampleTitleFor(specialistSlug),
    specialistSlug,
    phase: 'in_progress',
    stepIndex: 0,
    decision: null,
    createdAt: stamp,
    updatedAt: stamp,
  }
}

export function advanceSample(session: DemoSession, now = new Date()): DemoSession {
  if (session.phase !== 'in_progress') return session
  const updatedAt = now.toISOString()
  if (session.stepIndex < SAMPLE_STEPS.length - 1) {
    return { ...session, stepIndex: session.stepIndex + 1, updatedAt }
  }
  return { ...session, phase: 'decision', updatedAt }
}

export function decideSample(session: DemoSession, decision: DemoDecision, now = new Date()): DemoSession {
  if (session.phase !== 'decision') return session
  return { ...session, phase: 'recorded', decision, updatedAt: now.toISOString() }
}

export function outcomeCopy(decision: DemoDecision, specialistName: string): string {
  if (decision === 'approved') {
    return `Sample outcome recorded: approved for ${specialistName} to continue the sample. No external action was taken.`
  }
  if (decision === 'held') {
    return 'Sample outcome recorded: held in this tab. No external action was taken.'
  }
  return `Sample outcome recorded: sent back to ${specialistName} on this sample. No external action was taken.`
}

export type PendingApply =
  | { kind: 'started'; session: DemoSession }
  | { kind: 'blocked'; message: string }
  | { kind: 'invalid'; message: string }

/** Starting a sample never replaces one that is already open. */
export function applyIncomingGoal(session: DemoSession | null, goal: string, slugs: readonly string[], now?: Date): PendingApply {
  if (session) {
    return { kind: 'blocked', message: 'A sample is already open in this tab. Reset it before starting another. Nothing was sent.' }
  }
  const created = createSampleTask({ goal, slugs, now })
  if ('error' in created) return { kind: 'invalid', message: created.error }
  return { kind: 'started', session: created }
}

export function loadSession(store: DemoStore): DemoSession | null {
  const raw = store.read()
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isSession(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: DemoSession | null, store: DemoStore): void {
  store.write(session ? JSON.stringify(session) : null)
}

function isSession(value: unknown): value is DemoSession {
  if (!value || typeof value !== 'object') return false
  const row = value as Partial<DemoSession>
  const phaseOk = row.phase === 'in_progress' || row.phase === 'decision' || row.phase === 'recorded'
  const decisionOk = row.decision === null || row.decision === 'approved' || row.decision === 'held' || row.decision === 'sent_back'
  return typeof row.id === 'string'
    && typeof row.goal === 'string'
    && typeof row.sampleTitle === 'string'
    && typeof row.specialistSlug === 'string'
    && phaseOk
    && typeof row.stepIndex === 'number'
    && Number.isInteger(row.stepIndex)
    && row.stepIndex >= 0
    && row.stepIndex < SAMPLE_STEPS.length
    && decisionOk
    && typeof row.createdAt === 'string'
    && typeof row.updatedAt === 'string'
    && (row.phase === 'recorded' ? row.decision !== null : row.decision === null)
}
