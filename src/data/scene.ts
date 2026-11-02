import { byRank } from './labels.ts'
import { displayStatus } from './shift.ts'
import type { OfficeSnapshot } from './types.ts'

/**
 * Public scene snapshot. The isometric floor reads this through toFloorAgents.
 * deskX grows east and deskY grows south, both as percentages of the floor.
 * Subscribe to OfficeStore and call toSceneAgents instead of opening a second Supabase client.
 */
export type SceneAgent = {
  slug: string
  name: string
  deskX: number
  deskY: number
  status: string
  isBoss: boolean
  isHuman: boolean
  rank: number
  currentTask: string | null
}

export function toSceneAgents(snapshot: OfficeSnapshot, now: Date): SceneAgent[] {
  return snapshot.agents.map((agent) => ({
    slug: agent.slug,
    name: agent.name,
    deskX: agent.deskX,
    deskY: agent.deskY,
    status: displayStatus(agent, now),
    isBoss: agent.isBoss,
    isHuman: agent.isHuman,
    rank: agent.rank,
    currentTask: agent.currentTask,
  })).sort(byRank)
}
