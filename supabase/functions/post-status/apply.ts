import { scheduledBossStatus } from '../_shared/shift.ts'
import type {
  ActivityStatus,
  ApprovalDecision,
  Command,
  FinishStatus,
  JvStatus,
  StaffStatus,
} from './validate.ts'

export type BossStatus = 'online' | 'in_meeting' | 'away'
export type StatusMode = 'auto' | 'manual'

export type AgentRow = {
  id: string
  slug: string
  name: string
  isBoss: boolean
  isHuman: boolean
  shiftStartHour: number
  shiftEndHour: number
  status: StaffStatus | BossStatus
  statusMode: StatusMode
  currentTask: string | null
}

export type ActivityRow = {
  id: string
  agentId: string
  taskTitle: string
  status: ActivityStatus
}

export type ApprovalRow = {
  id: string
  agentId: string
  title: string
  status: 'pending' | ApprovalDecision
}

export type AgentUpdate = {
  slug: string
  status: StaffStatus | BossStatus
  statusMode: StatusMode
  currentTask: string | null
}

export interface OfficeDb {
  getAgentBySlug(slug: string): Promise<AgentRow | null>
  getBoss(): Promise<AgentRow | null>
  updateAgent(next: AgentUpdate): Promise<void>
  insertActivity(input: {
    agentId: string
    taskTitle: string
    status: ActivityStatus
    finishedAt: string | null
    now: string
  }): Promise<{ id: string }>
  getActivity(id: string): Promise<ActivityRow | null>
  updateActivity(input: {
    id: string
    status: FinishStatus
    finishedAt: string | null
    now: string
  }): Promise<void>
  insertApproval(input: { agentId: string; title: string; now: string }): Promise<{ id: string }>
  getApproval(id: string): Promise<ApprovalRow | null>
  resolveApproval(input: { id: string; status: ApprovalDecision; now: string }): Promise<boolean>
}

export type ApplyResult =
  | { ok: true; action: Command['action']; detail: Record<string, string> }
  | { ok: false; status: 400 | 404 | 409; error: string }

export async function applyCommand(db: OfficeDb, command: Command, now = new Date()): Promise<ApplyResult> {
  const stamp = now.toISOString()

  switch (command.action) {
    case 'set_agent_status': {
      const agent = await db.getAgentBySlug(command.slug)
      if (!agent) return missingAgent()
      if (isExecutive(agent)) return executiveRejected()
      await db.updateAgent({
        slug: agent.slug,
        status: command.status,
        statusMode: 'manual',
        currentTask: command.currentTask === undefined ? agent.currentTask : command.currentTask,
      })
      return done(command.action, { slug: agent.slug })
    }
    case 'set_current_task': {
      const agent = await db.getAgentBySlug(command.slug)
      if (!agent) return missingAgent()
      if (isExecutive(agent)) {
        return { ok: false, status: 400, error: 'An executive does not take a desk task through this action.' }
      }
      await db.updateAgent({
        slug: agent.slug,
        status: agent.status,
        statusMode: 'manual',
        currentTask: command.currentTask,
      })
      return done(command.action, { slug: agent.slug })
    }
    case 'add_activity': {
      const agent = await db.getAgentBySlug(command.slug)
      if (!agent) return missingAgent()
      if (isExecutive(agent)) return executiveRejected()
      const created = await db.insertActivity({
        agentId: agent.id,
        taskTitle: command.taskTitle,
        status: command.status,
        finishedAt: command.status === 'done' ? stamp : null,
        now: stamp,
      })
      return done(command.action, { id: created.id, slug: agent.slug })
    }
    case 'finish_activity': {
      const activity = await db.getActivity(command.activityId)
      if (!activity) return { ok: false, status: 404, error: 'No activity with that id.' }
      if (activity.status === 'done') {
        return { ok: false, status: 409, error: 'That activity is already finished.' }
      }
      if (activity.status === command.status) {
        return { ok: false, status: 409, error: 'That activity is already in that state.' }
      }
      await db.updateActivity({
        id: activity.id,
        status: command.status,
        finishedAt: command.status === 'done' ? stamp : null,
        now: stamp,
      })
      return done(command.action, { id: activity.id })
    }
    case 'add_approval': {
      const agent = await db.getAgentBySlug(command.slug)
      if (!agent) return missingAgent()
      if (isExecutive(agent)) return executiveRejected()
      const created = await db.insertApproval({
        agentId: agent.id,
        title: command.title,
        now: stamp,
      })
      return done(command.action, { id: created.id, slug: agent.slug })
    }
    case 'resolve_approval': {
      const approval = await db.getApproval(command.approvalId)
      if (!approval) return { ok: false, status: 404, error: 'No approval with that id.' }
      if (approval.status !== 'pending') {
        return { ok: false, status: 409, error: 'That approval is already resolved.' }
      }
      const updated = await db.resolveApproval({
        id: approval.id,
        status: command.status,
        now: stamp,
      })
      if (!updated) return { ok: false, status: 409, error: 'That approval is already resolved.' }
      return done(command.action, { id: approval.id })
    }
    case 'set_jv_status':
      return setJvStatus(db, command.status, now)
    case 'set_human_status':
      return setHumanStatus(db, command.slug, command.status, now)
  }
}

async function setJvStatus(db: OfficeDb, status: JvStatus, now: Date): Promise<ApplyResult> {
  const boss = await db.getBoss()
  if (!boss) return { ok: false, status: 404, error: 'The office has no boss on record.' }
  await writeExecutiveStatus(db, boss, status, now)
  return done('set_jv_status', { slug: boss.slug, status })
}

async function setHumanStatus(db: OfficeDb, slug: string, status: JvStatus, now: Date): Promise<ApplyResult> {
  const agent = await db.getAgentBySlug(slug)
  if (!agent) return missingAgent()
  if (!isExecutive(agent)) {
    return { ok: false, status: 400, error: 'That person uses a desk status, not an executive status.' }
  }
  await writeExecutiveStatus(db, agent, status, now)
  return done('set_human_status', { slug: agent.slug, status })
}

async function writeExecutiveStatus(db: OfficeDb, agent: AgentRow, status: JvStatus, now: Date): Promise<void> {
  await db.updateAgent({
    slug: agent.slug,
    status: status === 'auto'
      ? scheduledBossStatus(now, { startHour: agent.shiftStartHour, endHour: agent.shiftEndHour })
      : status,
    statusMode: status === 'auto' ? 'auto' : 'manual',
    currentTask: agent.currentTask,
  })
}

function isExecutive(agent: { isBoss: boolean; isHuman: boolean }): boolean {
  return agent.isBoss || agent.isHuman
}

function done(action: Command['action'], detail: Record<string, string>): ApplyResult {
  return { ok: true, action, detail }
}

function missingAgent(): ApplyResult {
  return { ok: false, status: 404, error: 'No agent with that slug.' }
}

function executiveRejected(): ApplyResult {
  return { ok: false, status: 400, error: 'Executive status uses set_human_status.' }
}
