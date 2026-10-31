export const LIMITS = {
  slug: 32,
  taskTitle: 120,
  currentTask: 160,
  approvalTitle: 140,
  body: 4096,
} as const

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TEXT = /^[\p{L}\p{M}\p{N}\p{P}\p{Zs}]+$/u

export const STAFF_STATUSES = ['working', 'idle', 'waiting_on_jv', 'offline'] as const
export const ACTIVITY_STATUSES = ['working', 'done', 'waiting_on_jv'] as const
export const FINISH_STATUSES = ['done', 'waiting_on_jv'] as const
export const APPROVAL_DECISIONS = ['approved', 'declined'] as const
export const JV_STATUSES = ['online', 'in_meeting', 'away', 'auto'] as const

export type StaffStatus = (typeof STAFF_STATUSES)[number]
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number]
export type FinishStatus = (typeof FINISH_STATUSES)[number]
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number]
export type JvStatus = (typeof JV_STATUSES)[number]

export type Command =
  | {
      action: 'set_agent_status'
      slug: string
      status: StaffStatus
      currentTask: string | null | undefined
    }
  | { action: 'set_current_task'; slug: string; currentTask: string | null }
  | { action: 'add_activity'; slug: string; taskTitle: string; status: ActivityStatus }
  | { action: 'finish_activity'; activityId: string; status: FinishStatus }
  | { action: 'add_approval'; slug: string; title: string }
  | { action: 'resolve_approval'; approvalId: string; status: ApprovalDecision }
  | { action: 'set_jv_status'; status: JvStatus }

export type ParseResult = { ok: true; command: Command } | { ok: false; error: string }

const ACTIONS = [
  'set_agent_status',
  'set_current_task',
  'add_activity',
  'finish_activity',
  'add_approval',
  'resolve_approval',
  'set_jv_status',
] as const

export function parseOfficeCommand(input: unknown): ParseResult {
  if (!isPlainObject(input)) {
    return fail('Body must be a JSON object.')
  }

  const keys = Object.keys(input)
  if (keys.length > 8) return fail('Too many fields.')
  if (keys.some((key) => key === '__proto__' || key === 'constructor' || key === 'prototype')) {
    return fail('Body contains a reserved field.')
  }

  const action = input.action
  if (typeof action !== 'string' || !ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    return fail('Action is not recognized.')
  }

  const commandAction = action as (typeof ACTIONS)[number]
  switch (commandAction) {
    case 'set_agent_status': {
      const extra = exactKeys(input, ['action', 'slug', 'status'], ['current_task'])
      if (extra) return fail(extra)
      const slug = readSlug(input.slug)
      if (typeof slug !== 'string') return fail(slug.error)
      const status = readEnum(input.status, STAFF_STATUSES, 'Status')
      if (typeof status !== 'string') return fail(status.error)
      const task = readOptionalText(input, 'current_task', LIMITS.currentTask, 'Current task')
      if ('error' in task) return fail(task.error)
      return ok({
        action: commandAction,
        slug,
        status,
        currentTask: task.value,
      })
    }
    case 'set_current_task': {
      const extra = exactKeys(input, ['action', 'slug', 'current_task'])
      if (extra) return fail(extra)
      const slug = readSlug(input.slug)
      if (typeof slug !== 'string') return fail(slug.error)
      const task = readText(input.current_task, LIMITS.currentTask, 'Current task', true)
      if ('error' in task) return fail(task.error)
      return ok({ action: commandAction, slug, currentTask: task.value })
    }
    case 'add_activity': {
      const extra = exactKeys(input, ['action', 'slug', 'task_title', 'status'])
      if (extra) return fail(extra)
      const slug = readSlug(input.slug)
      if (typeof slug !== 'string') return fail(slug.error)
      const title = requiredText(input.task_title, LIMITS.taskTitle, 'Task title')
      if (typeof title !== 'string') return fail(title.error)
      const status = readEnum(input.status, ACTIVITY_STATUSES, 'Status')
      if (typeof status !== 'string') return fail(status.error)
      return ok({ action: commandAction, slug, taskTitle: title, status })
    }
    case 'finish_activity': {
      const extra = exactKeys(input, ['action', 'activity_id', 'status'])
      if (extra) return fail(extra)
      const activityId = readUuid(input.activity_id, 'Activity id')
      if (typeof activityId !== 'string') return fail(activityId.error)
      const status = readEnum(input.status, FINISH_STATUSES, 'Status')
      if (typeof status !== 'string') return fail(status.error)
      return ok({ action: commandAction, activityId, status })
    }
    case 'add_approval': {
      const extra = exactKeys(input, ['action', 'slug', 'title'])
      if (extra) return fail(extra)
      const slug = readSlug(input.slug)
      if (typeof slug !== 'string') return fail(slug.error)
      const title = requiredText(input.title, LIMITS.approvalTitle, 'Title')
      if (typeof title !== 'string') return fail(title.error)
      return ok({ action: commandAction, slug, title })
    }
    case 'resolve_approval': {
      const extra = exactKeys(input, ['action', 'approval_id', 'status'])
      if (extra) return fail(extra)
      const approvalId = readUuid(input.approval_id, 'Approval id')
      if (typeof approvalId !== 'string') return fail(approvalId.error)
      const status = readEnum(input.status, APPROVAL_DECISIONS, 'Status')
      if (typeof status !== 'string') return fail(status.error)
      return ok({ action: commandAction, approvalId, status })
    }
    case 'set_jv_status': {
      const extra = exactKeys(input, ['action', 'status'])
      if (extra) return fail(extra)
      const status = readEnum(input.status, JV_STATUSES, 'Status')
      if (typeof status !== 'string') return fail(status.error)
      return ok({ action: commandAction, status })
    }
  }
}

function ok(command: Command): ParseResult {
  return { ok: true, command }
}

function fail(error: string): ParseResult {
  return { ok: false, error }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function exactKeys(
  input: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
): string | null {
  const allowed = new Set([...required, ...optional])
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      return /^[A-Za-z0-9_]{1,40}$/.test(key) ? `Unknown field "${key}".` : 'Unknown field.'
    }
  }
  for (const key of required) {
    if (!(key in input)) return `Missing field "${key}".`
  }
  return null
}

function readSlug(value: unknown): string | { error: string } {
  if (typeof value !== 'string') return { error: 'Slug must be a string.' }
  const slug = value.trim()
  if (slug.length < 1 || slug.length > LIMITS.slug || !SLUG.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and hyphens.' }
  }
  return slug
}

function readUuid(value: unknown, label: string): string | { error: string } {
  if (typeof value !== 'string' || !UUID.test(value)) return { error: `${label} must be a UUID.` }
  return value.toLowerCase()
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T | { error: string } {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    return { error: `${label} must be one of: ${allowed.join(', ')}.` }
  }
  return value as T
}

function requiredText(value: unknown, max: number, label: string): string | { error: string } {
  const read = readText(value, max, label, false)
  if ('error' in read) return read
  if (read.value === null) return { error: `${label} is required.` }
  return read.value
}

function readOptionalText(
  input: Record<string, unknown>,
  key: string,
  max: number,
  label: string,
): { value: string | null | undefined } | { error: string } {
  if (!(key in input)) return { value: undefined }
  return readText(input[key], max, label, true)
}

function readText(
  value: unknown,
  max: number,
  label: string,
  allowNull: boolean,
): { value: string | null } | { error: string } {
  if (value === null && allowNull) return { value: null }
  if (typeof value !== 'string') {
    return { error: allowNull ? `${label} must be a string or null.` : `${label} must be a string.` }
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { error: `${label} is empty.` }
  }
  if (trimmed.length > max) {
    return { error: `${label} must be ${max} characters or fewer.` }
  }
  if (!TEXT.test(trimmed)) {
    return { error: `${label} can use letters, numbers, and punctuation only.` }
  }
  return { value: trimmed }
}
