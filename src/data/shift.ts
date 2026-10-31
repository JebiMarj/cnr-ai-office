import { isOnManilaShift, SHIFT_LABEL } from '../../supabase/functions/_shared/shift.ts'
import type { Agent } from './types.ts'

const BOSS_STATUSES = new Set(['online', 'in_meeting', 'away'])

export function displayStatus(agent: Agent, now: Date): Agent['status'] {
  if (!agent.isBoss) return agent.status
  if (agent.statusMode === 'manual' && BOSS_STATUSES.has(agent.status)) return agent.status
  return isOnManilaShift(now) ? 'online' : 'away'
}

export function bossFocus(agent: Agent, now: Date): string {
  if (agent.currentTask) return agent.currentTask
  const status = displayStatus(agent, now)
  if (status === 'online') return 'Overseeing the floor'
  if (status === 'in_meeting') return 'In a meeting'
  return 'Away from the office'
}

export function bossShiftLine(agent: Agent, now: Date): string {
  if (agent.statusMode === 'manual') return 'Status set manually'
  return isOnManilaShift(now) ? `On shift · ${SHIFT_LABEL}` : 'Off shift · back at 9:00 PM Manila'
}
