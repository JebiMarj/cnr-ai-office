import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import type { Activity, Agent, Approval, OfficeSnapshot, OfficeSource } from './types.ts'

type AgentRow = {
  id: string
  slug: string
  name: string
  subtitle: string | null
  role: string
  desk_x: number | string
  desk_y: number | string
  status: Agent['status']
  status_mode: Agent['statusMode']
  current_task: string | null
  is_boss: boolean
  is_human: boolean
  floor_rank: number
  shift_start_hour: number
  shift_end_hour: number
  updated_at: string
}

type ActivityRow = {
  id: string
  agent_id: string
  agent_slug: string
  agent_name: string
  task_title: string
  status: Activity['status']
  created_at: string
  updated_at: string
  finished_at: string | null
}

type ApprovalRow = {
  id: string
  agent_id: string
  agent_slug: string
  agent_name: string
  title: string
  status: Approval['status']
  created_at: string
  resolved_at: string | null
}

const empty: OfficeSnapshot = {
  agents: [],
  activities: [],
  approvals: [],
  connection: 'connecting',
  source: 'live',
}

export function createLiveSource(config: { url: string; anonKey: string }): OfficeSource {
  return {
    initial: empty,
    start(onChange) {
      let current = empty
      let stopped = false
      let channel: RealtimeChannel | null = null
      let refreshTimer = 0
      const supabase = createClient(config.url, config.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { params: { eventsPerSecond: 5 } },
      })

      const publish = (next: OfficeSnapshot) => {
        current = next
        if (!stopped) onChange(next)
      }

      const load = async () => {
        const [agents, activities, approvals] = await Promise.all([
          supabase
            .from('office_agents')
            .select('id, slug, name, subtitle, role, desk_x, desk_y, status, status_mode, current_task, is_boss, is_human, floor_rank, shift_start_hour, shift_end_hour, updated_at'),
          supabase
            .from('office_activities')
            .select('id, agent_id, agent_slug, agent_name, task_title, status, created_at, updated_at, finished_at')
            .order('updated_at', { ascending: false })
            .limit(30),
          supabase
            .from('office_approvals')
            .select('id, agent_id, agent_slug, agent_name, title, status, created_at, resolved_at')
            .order('created_at', { ascending: true })
            .limit(50),
        ])

        if (agents.error || activities.error || approvals.error) {
          throw new Error('office read failed')
        }

        publish({
          agents: ((agents.data ?? []) as AgentRow[]).map(mapAgent),
          activities: ((activities.data ?? []) as ActivityRow[]).map(mapActivity),
          approvals: ((approvals.data ?? []) as ApprovalRow[]).map(mapApproval),
          connection: 'live',
          source: 'live',
        })
      }

      const schedule = () => {
        window.clearTimeout(refreshTimer)
        refreshTimer = window.setTimeout(() => {
          void load().catch(() => {
            publish({ ...current, connection: 'offline' })
          })
        }, 80)
      }

      void load().catch(() => {
        publish({ ...empty, connection: 'offline' })
      })

      channel = supabase
        .channel('office-floor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, schedule)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, schedule)
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            publish({ ...current, connection: 'offline' })
          }
        })

      return () => {
        stopped = true
        window.clearTimeout(refreshTimer)
        if (channel) void supabase.removeChannel(channel)
      }
    },
  }
}

function mapAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    role: row.role,
    deskX: Number(row.desk_x),
    deskY: Number(row.desk_y),
    status: row.status,
    statusMode: row.status_mode,
    currentTask: row.current_task,
    isBoss: row.is_boss,
    isHuman: row.is_human,
    rank: row.floor_rank,
    shiftStartHour: row.shift_start_hour,
    shiftEndHour: row.shift_end_hour,
    updatedAt: row.updated_at,
  }
}

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    agentId: row.agent_id,
    agentSlug: row.agent_slug,
    agentName: row.agent_name,
    taskTitle: row.task_title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    finishedAt: row.finished_at,
  }
}

function mapApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    agentId: row.agent_id,
    agentSlug: row.agent_slug,
    agentName: row.agent_name,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  }
}
