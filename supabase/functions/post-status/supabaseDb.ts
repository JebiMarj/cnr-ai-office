import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import type {
  ActivityRow,
  AgentRow,
  AgentUpdate,
  ApprovalRow,
  OfficeDb,
} from './apply.ts'

type AgentRecord = {
  id: string
  slug: string
  name: string
  is_boss: boolean
  status: AgentRow['status']
  status_mode: AgentRow['statusMode']
  current_task: string | null
}

type ActivityRecord = {
  id: string
  agent_id: string
  task_title: string
  status: ActivityRow['status']
}

type ApprovalRecord = {
  id: string
  agent_id: string
  title: string
  status: ApprovalRow['status']
}

export function createSupabaseOfficeDb(supabase: SupabaseClient): OfficeDb {
  return {
    async getAgentBySlug(slug) {
      const { data, error } = await supabase
        .from('agents')
        .select('id, slug, name, is_boss, status, status_mode, current_task')
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw new Error('agent lookup failed')
      return data ? mapAgent(data as AgentRecord) : null
    },

    async getBoss() {
      const { data, error } = await supabase
        .from('agents')
        .select('id, slug, name, is_boss, status, status_mode, current_task')
        .eq('is_boss', true)
        .maybeSingle()
      if (error) throw new Error('boss lookup failed')
      return data ? mapAgent(data as AgentRecord) : null
    },

    async updateAgent(next: AgentUpdate) {
      const { error } = await supabase
        .from('agents')
        .update({
          status: next.status,
          status_mode: next.statusMode,
          current_task: next.currentTask,
        })
        .eq('slug', next.slug)
      if (error) throw new Error('agent update failed')
    },

    async insertActivity(input) {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          agent_id: input.agentId,
          task_title: input.taskTitle,
          status: input.status,
          finished_at: input.finishedAt,
          created_at: input.now,
          updated_at: input.now,
        })
        .select('id')
        .single()
      if (error || !data) throw new Error('activity insert failed')
      return { id: (data as { id: string }).id }
    },

    async getActivity(id) {
      const { data, error } = await supabase
        .from('activities')
        .select('id, agent_id, task_title, status')
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error('activity lookup failed')
      if (!data) return null
      const row = data as ActivityRecord
      return {
        id: row.id,
        agentId: row.agent_id,
        taskTitle: row.task_title,
        status: row.status,
      }
    },

    async updateActivity(input) {
      const { error } = await supabase
        .from('activities')
        .update({
          status: input.status,
          finished_at: input.finishedAt,
        })
        .eq('id', input.id)
      if (error) throw new Error('activity update failed')
    },

    async insertApproval(input) {
      const { data, error } = await supabase
        .from('approvals')
        .insert({
          agent_id: input.agentId,
          title: input.title,
          status: 'pending',
          created_at: input.now,
          resolved_at: null,
        })
        .select('id')
        .single()
      if (error || !data) throw new Error('approval insert failed')
      return { id: (data as { id: string }).id }
    },

    async getApproval(id) {
      const { data, error } = await supabase
        .from('approvals')
        .select('id, agent_id, title, status')
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error('approval lookup failed')
      if (!data) return null
      const row = data as ApprovalRecord
      return {
        id: row.id,
        agentId: row.agent_id,
        title: row.title,
        status: row.status,
      }
    },

    async resolveApproval(input) {
      const { data, error } = await supabase
        .from('approvals')
        .update({
          status: input.status,
          resolved_at: input.now,
        })
        .eq('id', input.id)
        .eq('status', 'pending')
        .select('id')
      if (error) throw new Error('approval update failed')
      return Array.isArray(data) && data.length > 0
    },
  }
}

function mapAgent(row: AgentRecord): AgentRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    isBoss: row.is_boss,
    status: row.status,
    statusMode: row.status_mode,
    currentTask: row.current_task,
  }
}
