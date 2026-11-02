import { buildDemoSnapshot } from './demoSeed.ts'
import type { Activity, ActivityStatus, Agent, OfficeSnapshot, OfficeSource, StaffStatus } from './types.ts'

type DeskStep = {
  kind: 'desk'
  slug: string
  status: StaffStatus
  currentTask: string | null
  completeWorkingAs?: Extract<ActivityStatus, 'done' | 'waiting_on_jv'>
  activityTitle?: string
}

type ApprovalStep = { kind: 'approval'; slug: string; title: string }
type ResolveStep = { kind: 'resolve'; title: string; decision: 'approved' | 'declined' }
export type MockStep = DeskStep | ApprovalStep | ResolveStep

export const demoScript: MockStep[] = [
  {
    kind: 'desk',
    slug: 'dev',
    status: 'idle',
    currentTask: 'Standing by for the next deploy',
    completeWorkingAs: 'done',
  },
  {
    kind: 'desk',
    slug: 'gia',
    status: 'waiting_on_jv',
    currentTask: 'Needs a yes on the spring palette',
    completeWorkingAs: 'waiting_on_jv',
  },
  { kind: 'approval', slug: 'gia', title: 'Approve the spring campaign lockup' },
  { kind: 'resolve', title: 'Approve the hero palette', decision: 'approved' },
  {
    kind: 'desk',
    slug: 'dev',
    status: 'working',
    currentTask: 'Tracing a slow query',
    activityTitle: 'Tracing a slow query',
  },
]

export function applyMockStep(snapshot: OfficeSnapshot, step: MockStep, now: Date): OfficeSnapshot {
  const stamp = now.toISOString()
  if (step.kind === 'desk') return applyDesk(snapshot, step, stamp)
  if (step.kind === 'approval') return applyApproval(snapshot, step, stamp)
  return applyResolve(snapshot, step, stamp)
}

const heartbeat: Array<{ status: StaffStatus; currentTask: string }> = [
  { status: 'working', currentTask: 'Tracing a slow query' },
  { status: 'idle', currentTask: 'Standing by for the next deploy' },
]

export function createMockSource(now = new Date()): OfficeSource {
  let snapshot = buildDemoSnapshot(now)
  let index = 0
  let beat = 0
  return {
    initial: snapshot,
    start(onChange) {
      let timer = 0
      const run = () => {
        const step: MockStep = index < demoScript.length
          ? demoScript[index]!
          : {
              kind: 'desk',
              slug: 'dev',
              status: heartbeat[beat % heartbeat.length]!.status,
              currentTask: heartbeat[beat % heartbeat.length]!.currentTask,
            }
        if (index < demoScript.length) index += 1
        else beat += 1
        snapshot = applyMockStep(snapshot, step, new Date())
        onChange(snapshot)
        timer = window.setTimeout(run, 8000)
      }
      timer = window.setTimeout(run, 3500)
      return () => window.clearTimeout(timer)
    },
  }
}

function applyDesk(snapshot: OfficeSnapshot, step: DeskStep, stamp: string): OfficeSnapshot {
  const agents = snapshot.agents.map((agent) =>
    agent.slug === step.slug && !agent.isBoss && !agent.isHuman
      ? { ...agent, status: step.status, currentTask: step.currentTask, updatedAt: stamp }
      : agent,
  )
  const person = agents.find((agent) => agent.slug === step.slug)
  if (!person || person.isBoss || person.isHuman) return snapshot

  let activities = snapshot.activities.map((activity) => {
    if (activity.agentSlug !== step.slug || activity.status !== 'working' || !step.completeWorkingAs) {
      return activity
    }
    return finish(activity, step.completeWorkingAs, stamp)
  })

  if (step.activityTitle) {
    activities = [
      {
        id: `demo-live-${person.slug}-${stamp}`,
        agentId: person.id,
        agentSlug: person.slug,
        agentName: person.name,
        taskTitle: step.activityTitle,
        status: 'working' as const,
        createdAt: stamp,
        updatedAt: stamp,
        finishedAt: null,
      },
      ...activities,
    ].slice(0, 16)
  }

  return { ...snapshot, agents, activities: sortActivities(activities) }
}

function applyApproval(snapshot: OfficeSnapshot, step: ApprovalStep, stamp: string): OfficeSnapshot {
  const person = snapshot.agents.find((agent) => agent.slug === step.slug && !agent.isBoss && !agent.isHuman)
  if (!person) return snapshot
  const exists = snapshot.approvals.some((item) => item.title === step.title && item.status === 'pending')
  if (exists) return snapshot
  return {
    ...snapshot,
    approvals: [
      {
        id: `demo-live-approval-${person.slug}-${stamp}`,
        agentId: person.id,
        agentSlug: person.slug,
        agentName: person.name,
        title: step.title,
        status: 'pending',
        createdAt: stamp,
        resolvedAt: null,
      },
      ...snapshot.approvals,
    ],
  }
}

function applyResolve(snapshot: OfficeSnapshot, step: ResolveStep, stamp: string): OfficeSnapshot {
  let changed = false
  const approvals = snapshot.approvals.map((item) => {
    if (changed || item.title !== step.title || item.status !== 'pending') return item
    changed = true
    return { ...item, status: step.decision, resolvedAt: stamp }
  })
  return changed ? { ...snapshot, approvals } : snapshot
}

function finish(activity: Activity, status: 'done' | 'waiting_on_jv', stamp: string): Activity {
  return {
    ...activity,
    status,
    updatedAt: stamp,
    finishedAt: status === 'done' ? stamp : null,
  }
}

function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
}

export function staffAgents(agents: Agent[]): Agent[] {
  return agents
    .filter((agent) => !agent.isBoss && !agent.isHuman)
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
}
