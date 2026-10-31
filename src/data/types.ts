export type StaffStatus = 'working' | 'idle' | 'waiting_on_jv' | 'offline'
export type BossStatus = 'online' | 'in_meeting' | 'away'
export type StatusMode = 'auto' | 'manual'
export type ActivityStatus = 'working' | 'done' | 'waiting_on_jv'
export type ApprovalStatus = 'pending' | 'approved' | 'declined'
export type ConnectionState = 'live' | 'demo' | 'connecting' | 'offline'

export type Agent = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  role: string
  deskX: number
  deskY: number
  status: StaffStatus | BossStatus
  statusMode: StatusMode
  currentTask: string | null
  /** CEO row. Kept so the original boss shortcut still finds one person. */
  isBoss: boolean
  /** Human executive. Bots are false. Status follows the executive rules. */
  isHuman: boolean
  /** Lower comes first. JV is 1, Marj is 2, then the bots. */
  rank: number
  /** Manila hour the auto shift begins. Default 21. */
  shiftStartHour: number
  /** Manila hour the auto shift ends, exclusive. Default 5. */
  shiftEndHour: number
  updatedAt: string
}

export type Activity = {
  id: string
  agentId: string
  agentSlug: string
  agentName: string
  taskTitle: string
  status: ActivityStatus
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}

export type Approval = {
  id: string
  agentId: string
  agentSlug: string
  agentName: string
  title: string
  status: ApprovalStatus
  createdAt: string
  resolvedAt: string | null
}

export type OfficeSnapshot = {
  agents: Agent[]
  activities: Activity[]
  approvals: Approval[]
  connection: ConnectionState
  source: 'mock' | 'live'
}

export type OfficeListener = () => void

export type OfficeSource = {
  initial: OfficeSnapshot
  start: (onChange: (next: OfficeSnapshot) => void) => () => void
}
