import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationDir = join(root, 'supabase/migrations')

let db: PGlite

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then
        create role anon nologin;
      end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then
        create role authenticated nologin;
      end if;
      if not exists (select 1 from pg_roles where rolname = 'service_role') then
        create role service_role nologin bypassrls;
      end if;
    end
    $$;
  `)

  const files = readdirSync(migrationDir).filter((file) => file.endsWith('.sql')).sort()
  expect(files.length).toBeGreaterThan(0)
  for (const file of files) {
    await db.exec(readFileSync(join(migrationDir, file), 'utf8'))
  }
})

afterAll(async () => {
  await db.close()
})

describe('RLS', () => {
  it('forces row level security and publishes the floor tables', async () => {
    const tables = await db.query<{
      relname: string
      relrowsecurity: boolean
      relforcerowsecurity: boolean
    }>(`
      select c.relname, c.relrowsecurity, c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `)
    expect(tables.rows.map((row) => row.relname)).toEqual(['activities', 'agents', 'approvals'])
    expect(tables.rows.every((row) => row.relrowsecurity && row.relforcerowsecurity)).toBe(true)

    const policies = await db.query<{ tablename: string; cmd: string }>(`
      select tablename, cmd
      from pg_policies
      where schemaname = 'public'
      order by tablename, cmd
    `)
    expect(policies.rows).toEqual([
      { tablename: 'activities', cmd: 'SELECT' },
      { tablename: 'agents', cmd: 'SELECT' },
      { tablename: 'approvals', cmd: 'SELECT' },
    ])

    const published = await db.query<{ tablename: string }>(`
      select tablename
      from pg_publication_tables
      where pubname = 'supabase_realtime'
      order by tablename
    `)
    expect(published.rows.map((row) => row.tablename)).toEqual(['activities', 'agents', 'approvals'])
  })

  it('exposes only the public office columns, through security invoker views', async () => {
    const views = await db.query<{ relname: string; reloptions: string[] | null }>(`
      select c.relname, c.reloptions
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'v'
      order by c.relname
    `)
    expect(views.rows.map((row) => row.relname)).toEqual([
      'office_activities',
      'office_agents',
      'office_approvals',
    ])
    expect(views.rows.every((row) => row.reloptions?.includes('security_invoker=true'))).toBe(true)

    const columns = await db.query<{ table_name: string; column_name: string }>(`
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `)
    const byTable = new Map<string, string[]>()
    for (const row of columns.rows) {
      const list = byTable.get(row.table_name) ?? []
      list.push(row.column_name)
      byTable.set(row.table_name, list)
    }

    expect(byTable.get('office_agents')).toEqual([
      'id', 'slug', 'name', 'subtitle', 'role', 'desk_x', 'desk_y',
      'status', 'status_mode', 'current_task', 'is_boss', 'updated_at',
    ])
    expect(byTable.get('office_activities')).toEqual([
      'id', 'agent_id', 'agent_slug', 'agent_name', 'task_title', 'status',
      'created_at', 'updated_at', 'finished_at',
    ])
    expect(byTable.get('office_approvals')).toEqual([
      'id', 'agent_id', 'agent_slug', 'agent_name', 'title', 'status',
      'created_at', 'resolved_at',
    ])

    const names = [...byTable.values()].flat()
    expect(names.some((name) => /email|secret|password|phone|token|address/i.test(name))).toBe(false)

    const functions = await db.query<{ n: number }>(`
      select count(*)::int as n
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
    `)
    expect(functions.rows[0]?.n).toBe(0)

    const usage = await db.query<{ allowed: boolean }>(`
      select
        has_schema_privilege('anon', 'office_private', 'USAGE') as allowed
    `)
    expect(usage.rows[0]?.allowed).toBe(false)
  })

  it('lets anon and authenticated read, and gives them no write grant', async () => {
    for (const role of ['anon', 'authenticated'] as const) {
      for (const table of ['agents', 'activities', 'approvals', 'office_agents', 'office_activities', 'office_approvals']) {
        const privileges = await db.query<{ select: boolean; write: boolean }>(`
          select
            has_table_privilege('${role}', 'public.${table}', 'SELECT') as select,
            has_table_privilege('${role}', 'public.${table}', 'INSERT,UPDATE,DELETE,TRUNCATE') as write
        `)
        expect(privileges.rows[0], `${role} ${table}`).toEqual({ select: true, write: false })
      }
    }

    const slugs = await asRole('anon', async () => {
      const result = await db.query<{ slug: string }>(
        'select slug from public.office_agents order by slug',
      )
      return result.rows.map((row) => row.slug)
    })
    expect(slugs).toEqual(['alex', 'dev', 'gia', 'jv', 'mechanicus', 'sage', 'tech'])

    const pending = await asRole('authenticated', async () => {
      const result = await db.query<{ title: string }>(`
        select title from public.office_approvals
        where status = 'pending'
        order by created_at
      `)
      return result.rows.map((row) => row.title)
    })
    expect(pending).toEqual([
      'Approve the weekly client handoff',
      'Sign off on the systems diagram',
      'Approve the hero palette',
    ])

    await expectDenied('anon', `
      insert into public.agents (slug, name, role, desk_x, desk_y, status, status_mode, is_boss)
      values ('intruder', 'Intruder', 'Intruder', 1, 1, 'idle', 'manual', false)
    `)
    await expectDenied('anon', `update public.agents set name = 'Nope' where slug = 'dev'`)
    await expectDenied('anon', `delete from public.activities`)
    await expectDenied('authenticated', `delete from public.approvals`)
    await expectDenied('authenticated', `
      insert into public.office_agents (slug, name, role, desk_x, desk_y, status, status_mode, is_boss)
      values ('intruder', 'Intruder', 'Intruder', 1, 1, 'idle', 'manual', false)
    `)
  })

  it('still blocks a writer who was granted DML but has no write policy', async () => {
    await db.exec(`
      do $$
      begin
        if not exists (select 1 from pg_roles where rolname = 'office_rls_probe') then
          create role office_rls_probe nologin;
        end if;
      end
      $$;
    `)
    await db.exec(`
      grant select, insert, update, delete on
        public.agents, public.activities, public.approvals
      to office_rls_probe
    `)

    await expectDenied('office_rls_probe', `
      insert into public.agents (slug, name, role, desk_x, desk_y, status, status_mode, is_boss)
      values ('probe', 'Probe', 'Probe', 1, 1, 'idle', 'manual', false)
    `, /row-level security/i)

    await asRole('office_rls_probe', async () => {
      await db.query(`update public.agents set current_task = 'Hijacked' where slug = 'tech'`)
      await db.query(`delete from public.approvals where status = 'pending'`)
    })

    const after = await db.query<{ task: string | null; pending: number }>(`
      select
        (select current_task from public.agents where slug = 'tech') as task,
        (select count(*)::int from public.approvals where status = 'pending') as pending
    `)
    expect(after.rows[0]).toEqual({ task: null, pending: 3 })
  })

  it('keeps the agent secret hash in a forced-RLS table with no policies', async () => {
    const table = await db.query<{ relrowsecurity: boolean; relforcerowsecurity: boolean }>(`
      select c.relrowsecurity, c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'office_private' and c.relname = 'settings'
    `)
    expect(table.rows[0]).toEqual({ relrowsecurity: true, relforcerowsecurity: true })

    const policies = await db.query<{ n: number }>(`
      select count(*)::int as n
      from pg_policies
      where schemaname = 'office_private' and tablename = 'settings'
    `)
    expect(policies.rows[0]?.n).toBe(0)

    for (const role of ['anon', 'authenticated'] as const) {
      const privileges = await db.query<{ select: boolean; write: boolean }>(`
        select
          has_table_privilege('${role}', 'office_private.settings', 'SELECT') as select,
          has_table_privilege('${role}', 'office_private.settings', 'INSERT,UPDATE,DELETE') as write
      `)
      expect(privileges.rows[0], role).toEqual({ select: false, write: false })
    }

    await expectDenied('anon', `select value from office_private.settings`)
    await expectDenied('anon', `select office_private.agent_secret_hash()`)
    await expectDenied('authenticated', `select office_private.agent_secret_hash()`)

    const hash = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    await db.exec('begin')
    try {
      await db.exec('set local role service_role')
      await db.query(`
        insert into office_private.settings (key, value)
        values ('agent_secret_sha256', '${hash}')
      `)
      const stored = await db.query<{ agent_secret_hash: string }>(
        `select office_private.agent_secret_hash()`,
      )
      expect(stored.rows[0]?.agent_secret_hash).toBe(hash)
    } finally {
      await db.exec('rollback')
    }
  })

  it('lets the service role write because it bypasses row level security', async () => {
    await db.exec('begin')
    try {
      await db.exec('set local role service_role')
      await db.query(`update public.agents set current_task = 'Probe' where slug = 'tech'`)
      const row = await db.query<{ current_task: string }>(
        `select current_task from public.agents where slug = 'tech'`,
      )
      expect(row.rows[0]?.current_task).toBe('Probe')
    } finally {
      await db.exec('rollback')
    }

    const restored = await db.query<{ current_task: string | null }>(
      `select current_task from public.agents where slug = 'tech'`,
    )
    expect(restored.rows[0]?.current_task).toBeNull()
  })
})

async function asRole<T>(role: string, fn: () => Promise<T>): Promise<T> {
  await db.exec('begin')
  try {
    await db.exec(`set local role ${role}`)
    const value = await fn()
    await db.exec('commit')
    return value
  } catch (error) {
    await db.exec('rollback')
    throw error
  }
}

async function expectDenied(role: string, sql: string, pattern = /42501|permission denied/i) {
  await db.exec('begin')
  try {
    await db.exec(`set local role ${role}`)
    let denied = false
    try {
      await db.query(sql)
    } catch (error) {
      denied = true
      expect(errorText(error), `${role}: ${sql}`).toMatch(pattern)
    }
    expect(denied, `${role} was allowed to run ${sql}`).toBe(true)
  } finally {
    await db.exec('rollback')
  }
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const code = 'code' in error ? String(error.code) : ''
    return `${error.message} ${code}`
  }
  return String(error)
}
