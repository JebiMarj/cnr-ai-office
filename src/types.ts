export type Teammate = { slug: string; name: string; role: string; color: string; skin: string; hair: string }
export type Tenant = {
  platform: { name: string; shortName: string; poweredBy: string }
  workspace: { name: string; officeSign: string; timezone: string; timezoneLabel: string }
  brand: { logo: string; primary: string; accent: string; gold: string; sidebar: string; floor: string; wall: string }
  owner: { name: string; title: string; initials: string }
  dataSource: 'live' | 'demo'
  teammates: Teammate[]
}
export type Status = 'working' | 'idle' | 'waiting_on_jv' | 'offline'
export type AgentState = { slug: string; status: Status; currentTask: string | null; updatedAt: string }
export type Activity = { id: string; slug: string; title: string; status: 'working' | 'done' | 'waiting_on_jv'; createdAt: string; finishedAt: string | null }
export type Approval = { id: string; slug: string; title: string; createdAt: string }
export type Snapshot = {
  agents: Record<string, AgentState>
  activities: Activity[]
  approvals: Approval[]
  doneToday: number
  connection: 'live' | 'demo' | 'connecting' | 'offline'
  fetchedAt: string | null
}
