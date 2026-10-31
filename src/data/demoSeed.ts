import type { Activity, Agent, Approval, OfficeSnapshot } from './types.ts'

function ago(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString()
}

export function buildDemoSnapshot(now: Date): OfficeSnapshot {
  const agents: Agent[] = [
    agent('jv', 'JV', 'John Vincent Lorenzana', 'Chief Executive Officer', 76, 26, 'away', 'auto', null, true, ago(now, 1)),
    agent('alex', 'Alex', null, 'Executive & IT Project Assistant', 24, 40, 'waiting_on_jv', 'manual', 'Weekly client handoff is ready for review', false, ago(now, 18)),
    agent('mechanicus', 'Mechanicus', null, 'GHL Setup Builder', 28, 70, 'working', 'manual', 'Building the GHL onboarding pipeline', false, ago(now, 12)),
    agent('sage', 'Sage', null, 'IT Project Advisor & Solutions Architect', 46, 36, 'idle', 'manual', 'Architecture notes are filed', false, ago(now, 35)),
    agent('dev', 'Dev', null, 'Senior Full-Stack Systems Developer', 68, 46, 'working', 'manual', 'Wiring realtime desk updates', false, ago(now, 4)),
    agent('tech', 'Tech', null, 'IT Support & Systems Technician', 50, 74, 'offline', 'manual', null, false, ago(now, 120)),
    agent('gia', 'Gia', null, 'Growth & Creative Assistant', 72, 66, 'working', 'manual', 'Color study for the spring campaign', false, ago(now, 6)),
  ]

  const bySlug = new Map(agents.map((person) => [person.slug, person]))
  const activity = (
    slug: string,
    title: string,
    status: Activity['status'],
    minutes: number,
  ): Activity => {
    const person = bySlug.get(slug)!
    const stamp = ago(now, minutes)
    return {
      id: `demo-${slug}-${minutes}`,
      agentId: person.id,
      agentSlug: person.slug,
      agentName: person.name,
      taskTitle: title,
      status,
      createdAt: stamp,
      updatedAt: stamp,
      finishedAt: status === 'done' ? stamp : null,
    }
  }

  const activities = [
    activity('dev', 'Wiring realtime desk updates', 'working', 4),
    activity('gia', 'Color study for the spring campaign', 'working', 6),
    activity('mechanicus', 'Building the GHL onboarding pipeline', 'working', 12),
    activity('alex', 'Weekly client handoff drafted', 'waiting_on_jv', 18),
    activity('sage', 'Filed the architecture notes', 'done', 35),
    activity('tech', 'Closed the overnight support queue', 'done', 120),
    activity('dev', 'Pinned the floor data model', 'done', 180),
    activity('gia', 'Posted the first creative concepts', 'done', 300),
  ]

  const approval = (slug: string, title: string, minutes: number, status: Approval['status'] = 'pending'): Approval => {
    const person = bySlug.get(slug)!
    return {
      id: `demo-approval-${slug}-${minutes}`,
      agentId: person.id,
      agentSlug: person.slug,
      agentName: person.name,
      title,
      status,
      createdAt: ago(now, minutes),
      resolvedAt: status === 'pending' ? null : ago(now, Math.max(minutes - 60, 1)),
    }
  }

  return {
    agents,
    activities,
    approvals: [
      approval('alex', 'Approve the weekly client handoff', 18),
      approval('sage', 'Sign off on the systems diagram', 7),
      approval('gia', 'Approve the hero palette', 2),
      approval('mechanicus', 'Hold the vendor swap', 24 * 60, 'declined'),
    ],
    connection: 'demo',
    source: 'mock',
  }
}

function agent(
  slug: string,
  name: string,
  subtitle: string | null,
  role: string,
  deskX: number,
  deskY: number,
  status: Agent['status'],
  statusMode: Agent['statusMode'],
  currentTask: string | null,
  isBoss: boolean,
  updatedAt: string,
): Agent {
  return {
    id: `demo-${slug}`,
    slug,
    name,
    subtitle,
    role,
    deskX,
    deskY,
    status,
    statusMode,
    currentTask,
    isBoss,
    updatedAt,
  }
}
