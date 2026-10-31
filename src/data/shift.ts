import {
  isOnShift,
  SHIFT_END_HOUR,
  SHIFT_LABEL,
  SHIFT_START_HOUR,
} from '../../supabase/functions/_shared/shift.ts'
import type { Agent } from './types.ts'

const EXECUTIVE_STATUSES = new Set(['online', 'in_meeting', 'away'])

export function isExecutive(agent: { isBoss: boolean; isHuman?: boolean }): boolean {
  return agent.isBoss || Boolean(agent.isHuman)
}

export function displayStatus(agent: Agent, now: Date): Agent['status'] {
  if (!isExecutive(agent)) return agent.status
  if (agent.statusMode === 'manual' && EXECUTIVE_STATUSES.has(agent.status)) return agent.status
  return isOnShift(now, { startHour: agent.shiftStartHour, endHour: agent.shiftEndHour }) ? 'online' : 'away'
}

export function bossFocus(agent: Agent, now: Date): string {
  if (agent.currentTask) return agent.currentTask
  const status = displayStatus(agent, now)
  if (status === 'online') return agent.isBoss ? 'Overseeing the floor' : 'On the floor'
  if (status === 'in_meeting') return 'In a meeting'
  return 'Away from the office'
}

export function bossShiftLine(agent: Agent, now: Date): string {
  if (agent.statusMode === 'manual') return 'Status set manually'
  const window = { startHour: agent.shiftStartHour, endHour: agent.shiftEndHour }
  const label = shiftLabel(agent)
  if (isOnShift(now, window)) return `On shift · ${label}`
  return `Off shift · back at ${formatHour(agent.shiftStartHour ?? SHIFT_START_HOUR)} Manila`
}

export function shiftLabel(agent: { shiftStartHour?: number; shiftEndHour?: number }): string {
  const start = agent.shiftStartHour ?? SHIFT_START_HOUR
  const end = agent.shiftEndHour ?? SHIFT_END_HOUR
  if (start === SHIFT_START_HOUR && end === SHIFT_END_HOUR) return SHIFT_LABEL
  return `${formatHour(start)} – ${formatHour(end)} Manila`
}

function formatHour(hour: number): string {
  const clock = ((hour % 24) + 24) % 24
  const h = clock % 12 === 0 ? 12 : clock % 12
  return `${h}:00 ${clock < 12 ? 'AM' : 'PM'}`
}
