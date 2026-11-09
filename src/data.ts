import { createClient } from '@supabase/supabase-js'
import type { Activity, AgentState, Approval, Snapshot, Tenant } from './types.ts'
import { startOfZonedDay } from './time.ts'

export const emptySnapshot: Snapshot = { agents: {}, activities: [], approvals: [], doneToday: 0, connection: 'connecting', fetchedAt: null }

type Listener = (s: Snapshot) => void

/**
 * Live source: reads the same public, read-only views the current C&R AI Office uses
 * (office_agents, office_activities, office_approvals) with the anon key. No writes.
 */
export function startLive(tenant: Tenant, url: string, anonKey: string, onChange: Listener) {
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const slugs = new Set(tenant.teammates.map((t) => t.slug))
  let current = emptySnapshot
  let stopped = false
  let timer = 0

  const load = async () => {
    const since = startOfZonedDay(new Date(), tenant.workspace.timezone).toISOString()
    const [agents, activities, approvals, done] = await Promise.all([
      supabase.from('office_agents').select('slug, status, current_task, updated_at'),
      supabase.from('office_activities').select('id, agent_slug, task_title, status, created_at, finished_at').order('updated_at', { ascending: false }).limit(60),
      supabase.from('office_approvals').select('id, agent_slug, title, status, created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(50),
      supabase.from('office_activities').select('id', { count: 'exact', head: true }).eq('status', 'done').gte('finished_at', since),
    ])
    if (agents.error || activities.error || approvals.error) throw new Error('read failed')
    const map: Record<string, AgentState> = {}
    for (const r of agents.data ?? []) {
      if (!slugs.has(r.slug)) continue
      map[r.slug] = { slug: r.slug, status: r.status, currentTask: r.current_task, updatedAt: r.updated_at }
    }
    current = {
      agents: map,
      activities: (activities.data ?? []).filter((r) => slugs.has(r.agent_slug)).map((r): Activity => ({ id: r.id, slug: r.agent_slug, title: r.task_title, status: r.status, createdAt: r.created_at, finishedAt: r.finished_at })),
      approvals: (approvals.data ?? []).filter((r) => slugs.has(r.agent_slug)).map((r): Approval => ({ id: r.id, slug: r.agent_slug, title: r.title, createdAt: r.created_at })),
      doneToday: done.count ?? 0,
      connection: 'live',
      fetchedAt: new Date().toISOString(),
    }
    if (!stopped) onChange(current)
  }
  const refresh = () => load().catch(() => !stopped && onChange({ ...current, connection: 'offline' }))
  refresh()
  const channel = supabase
    .channel('cnri-office-preview')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'agents' }, () => { clearTimeout(timer); timer = window.setTimeout(refresh, 120) })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, () => { clearTimeout(timer); timer = window.setTimeout(refresh, 120) })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => { clearTimeout(timer); timer = window.setTimeout(refresh, 120) })
    .subscribe()
  const poll = window.setInterval(refresh, 30000)
  return () => { stopped = true; clearInterval(poll); clearTimeout(timer); void supabase.removeChannel(channel) }
}

/** Demo source: generic sample work so a new client template can be shown without a backend. */
export function startDemo(tenant: Tenant, onChange: Listener) {
  const now = Date.now()
  const tasks = [
    'Writing a short, friendly follow-up', 'Drafting a reply in your voice', 'Building the onboarding pipeline',
    'Cleaning up the contact list', 'Preparing the weekly report', 'Scheduling next week\u2019s posts',
  ]
  const statuses: AgentState['status'][] = ['working', 'working', 'waiting_on_jv', 'working', 'idle', 'waiting_on_jv']
  const agents: Record<string, AgentState> = {}
  tenant.teammates.forEach((t, i) => {
    const st = statuses[i % statuses.length]
    agents[t.slug] = { slug: t.slug, status: st, currentTask: st === 'idle' ? null : tasks[i % tasks.length], updatedAt: new Date(now - (i + 1) * 7 * 60000).toISOString() }
  })
  const approvals: Approval[] = tenant.teammates.filter((t) => agents[t.slug].status === 'waiting_on_jv').map((t, i) => ({
    id: `demo-ap-${i}`, slug: t.slug, title: i === 0 ? 'Approve next week\u2019s posts' : 'Review the drafted reply before it goes out', createdAt: new Date(now - (i + 2) * 11 * 60000).toISOString(),
  }))
  const activities: Activity[] = tenant.teammates.flatMap((t, i) => [
    { id: `demo-a-${i}`, slug: t.slug, title: tasks[(i + 2) % tasks.length], status: 'done' as const, createdAt: new Date(now - (i + 3) * 40 * 60000).toISOString(), finishedAt: new Date(now - (i + 2) * 30 * 60000).toISOString() },
  ])
  onChange({ agents, activities, approvals, doneToday: activities.length + 3, connection: 'demo', fetchedAt: new Date().toISOString() })
  return () => {}
}
