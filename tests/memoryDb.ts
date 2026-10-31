import type {
  ActivityRow,
  AgentRow,
  AgentUpdate,
  ApprovalRow,
  OfficeDb,
} from '../supabase/functions/post-status/apply.ts'

export type MemoryDb = OfficeDb & {
  agents: Map<string, AgentRow>
  activities: Map<string, ActivityRow>
  approvals: Map<string, ApprovalRow>
}

export function createMemoryDb(): MemoryDb {
  const agents = new Map<string, AgentRow>()
  const activities = new Map<string, ActivityRow>()
  const approvals = new Map<string, ApprovalRow>()

  agents.set('jv', {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'jv',
    name: 'JV',
    isBoss: true,
    isHuman: true,
    shiftStartHour: 21,
    shiftEndHour: 5,
    status: 'away',
    statusMode: 'auto',
    currentTask: null,
  })
  agents.set('marj', {
    id: '88888888-8888-4888-8888-888888888888',
    slug: 'marj',
    name: 'Marj',
    isBoss: false,
    isHuman: true,
    shiftStartHour: 21,
    shiftEndHour: 5,
    status: 'away',
    statusMode: 'auto',
    currentTask: null,
  })
  agents.set('dev', {
    id: '55555555-5555-4555-8555-555555555555',
    slug: 'dev',
    name: 'Dev',
    isBoss: false,
    isHuman: false,
    shiftStartHour: 21,
    shiftEndHour: 5,
    status: 'working',
    statusMode: 'manual',
    currentTask: 'Wiring realtime desk updates',
  })
  agents.set('alex', {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'alex',
    name: 'Alex',
    isBoss: false,
    isHuman: false,
    shiftStartHour: 21,
    shiftEndHour: 5,
    status: 'idle',
    statusMode: 'manual',
    currentTask: null,
  })

  const db: MemoryDb = {
    agents,
    activities,
    approvals,
    async getAgentBySlug(slug) {
      return agents.get(slug) ?? null
    },
    async getBoss() {
      return [...agents.values()].find((agent) => agent.isBoss) ?? null
    },
    async updateAgent(next: AgentUpdate) {
      const current = agents.get(next.slug)
      if (!current) throw new Error('missing agent')
      agents.set(next.slug, {
        ...current,
        status: next.status,
        statusMode: next.statusMode,
        currentTask: next.currentTask,
      })
    },
    async insertActivity(input) {
      const id = crypto.randomUUID()
      activities.set(id, {
        id,
        agentId: input.agentId,
        taskTitle: input.taskTitle,
        status: input.status,
      })
      return { id }
    },
    async getActivity(id) {
      return activities.get(id) ?? null
    },
    async updateActivity(input) {
      const current = activities.get(input.id)
      if (!current) throw new Error('missing activity')
      activities.set(input.id, { ...current, status: input.status })
    },
    async insertApproval(input) {
      const id = crypto.randomUUID()
      approvals.set(id, {
        id,
        agentId: input.agentId,
        title: input.title,
        status: 'pending',
      })
      return { id }
    },
    async getApproval(id) {
      return approvals.get(id) ?? null
    },
    async resolveApproval(input) {
      const current = approvals.get(input.id)
      if (!current || current.status !== 'pending') return false
      approvals.set(input.id, { ...current, status: input.status })
      return true
    },
  }

  return db
}
