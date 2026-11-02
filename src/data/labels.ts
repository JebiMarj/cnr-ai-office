import { isExecutive } from './shift.ts'
import type { Agent } from './types.ts'

/** Floor chip and executive card. The stored name stays "Marj". */
export function floorTitle(agent: { slug: string; name: string }): string {
  if (agent.slug === 'marj') return 'Marj · VP'
  return agent.name
}

export function byRank<T extends { rank: number; name: string }>(a: T, b: T): number {
  return a.rank - b.rank || a.name.localeCompare(b.name)
}

export const STATUS_LABEL: Record<string, string> = {
  working: 'Working',
  idle: 'Idle',
  waiting_on_jv: 'Waiting on JV',
  offline: 'Offline',
  online: 'Online',
  in_meeting: 'In a meeting',
  away: 'Away',
  done: 'Done',
}

export function floorCensus(agents: Agent[]): string {
  const counts = new Map<string, number>()
  for (const agent of agents) {
    if (isExecutive(agent)) continue
    counts.set(agent.status, (counts.get(agent.status) ?? 0) + 1)
  }

  const parts: Array<[string, string]> = [
    ['working', 'working'],
    ['waiting_on_jv', 'waiting on JV'],
    ['idle', 'idle'],
    ['offline', 'offline'],
  ]

  return parts
    .filter(([status]) => (counts.get(status) ?? 0) > 0)
    .map(([status, label]) => `${counts.get(status)} ${label}`)
    .join(' · ')
}
