import { describe, expect, it } from 'vitest'
import { handlePostStatus } from '../supabase/functions/post-status/http.ts'
import { sha256Hex } from '../supabase/functions/post-status/secret.ts'
import { createMemoryDb } from './memoryDb.ts'

const SECRET = 'test-office-secret'

function call(
  body: unknown,
  init: {
    secret?: string | null
    method?: string
    contentType?: string
    configuredSecret?: string
    db?: ReturnType<typeof createMemoryDb> | null
    now?: Date
    raw?: string
    lookupSecretHash?: () => Promise<string | null>
  } = {},
) {
  const db = init.db === undefined ? createMemoryDb() : init.db
  const headers = new Headers()
  if (init.secret !== null) headers.set('x-office-secret', init.secret ?? SECRET)
  if (init.contentType !== '') headers.set('content-type', init.contentType ?? 'application/json')
  const raw = init.raw ?? JSON.stringify(body)
  if (raw.length > 0) headers.set('content-length', String(raw.length))
  const request = new Request('https://example.test/post-status', {
    method: init.method ?? 'POST',
    headers,
    body: init.method === 'GET' ? undefined : raw,
  })
  return handlePostStatus(request, {
    secret: init.configuredSecret === undefined ? SECRET : init.configuredSecret,
    createDb: () => db,
    lookupSecretHash: init.lookupSecretHash,
    now: init.now,
  }).then(async (response) => ({
    status: response.status,
    body: await response.json() as { ok: boolean; error?: string; id?: string; slug?: string; status?: string },
    allow: response.headers.get('allow'),
    db,
  }))
}

describe('post-status handler', () => {
  it('rejects the wrong method, secret, type, and size before touching data', async () => {
    const get = await call({}, { method: 'GET' })
    expect(get.status).toBe(405)
    expect(get.allow).toBe('POST')

    const missing = await call({ action: 'set_jv_status', status: 'away' }, { configuredSecret: '' })
    expect(missing.status).toBe(503)
    expect(missing.body.error).toBe('The office secret is not configured.')

    const unauthorized = await call({ action: 'set_jv_status', status: 'away' }, { secret: 'nope' })
    expect(unauthorized.status).toBe(401)

    const text = await call({ action: 'set_jv_status', status: 'away' }, { contentType: 'text/plain' })
    expect(text.status).toBe(415)

    const broken = await call(null, { raw: '{', contentType: 'application/json' })
    expect(broken.status).toBe(400)

    const huge = await call(null, { raw: `{"action":"${'a'.repeat(5000)}"}` })
    expect(huge.status).toBe(413)
  })

  it('updates a desk, records an activity, and will not write the boss as staff', async () => {
    const db = createMemoryDb()
    const updated = await call({
      action: 'set_agent_status',
      slug: 'dev',
      status: 'idle',
      current_task: 'Standing by for the next deploy',
    }, { db })
    expect(updated.status).toBe(200)
    expect(db.agents.get('dev')).toMatchObject({
      status: 'idle',
      currentTask: 'Standing by for the next deploy',
    })

    const cleared = await call({
      action: 'set_current_task',
      slug: 'dev',
      current_task: null,
    }, { db })
    expect(cleared.status).toBe(200)
    expect(db.agents.get('dev')?.currentTask).toBeNull()
    expect(db.agents.get('dev')?.status).toBe('idle')

    const activity = await call({
      action: 'add_activity',
      slug: 'alex',
      task_title: 'Draft the handoff',
      status: 'working',
    }, { db })
    expect(activity.status).toBe(200)
    expect(activity.body.id).toBeTruthy()

    const finished = await call({
      action: 'finish_activity',
      activity_id: activity.body.id,
      status: 'done',
    }, { db })
    expect(finished.status).toBe(200)
    expect(db.activities.get(activity.body.id!)?.status).toBe('done')

    const again = await call({
      action: 'finish_activity',
      activity_id: activity.body.id,
      status: 'done',
    }, { db })
    expect(again.status).toBe(409)

    const boss = await call({
      action: 'set_agent_status',
      slug: 'jv',
      status: 'idle',
    }, { db })
    expect(boss.status).toBe(400)
    expect(db.agents.get('jv')?.status).toBe('away')
  })

  it('adds and resolves an approval once', async () => {
    const db = createMemoryDb()
    const created = await call({
      action: 'add_approval',
      slug: 'alex',
      title: 'Approve the weekly client handoff',
    }, { db })
    expect(created.status).toBe(200)

    const resolved = await call({
      action: 'resolve_approval',
      approval_id: created.body.id,
      status: 'approved',
    }, { db })
    expect(resolved.status).toBe(200)
    expect(db.approvals.get(created.body.id!)?.status).toBe('approved')

    const twice = await call({
      action: 'resolve_approval',
      approval_id: created.body.id,
      status: 'declined',
    }, { db })
    expect(twice.status).toBe(409)
  })

  it('sets JV manually and returns him to the shift clock', async () => {
    const db = createMemoryDb()
    const meeting = await call({ action: 'set_jv_status', status: 'in_meeting' }, { db })
    expect(meeting.status).toBe(200)
    expect(db.agents.get('jv')).toMatchObject({ status: 'in_meeting', statusMode: 'manual' })

    const back = await call({
      action: 'set_jv_status',
      status: 'auto',
    }, {
      db,
      now: new Date('2026-10-31T13:00:00Z'),
    })
    expect(back.status).toBe(200)
    expect(db.agents.get('jv')).toMatchObject({ status: 'online', statusMode: 'auto' })

    const missing = await call({
      action: 'finish_activity',
      activity_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      status: 'done',
    }, { db })
    expect(missing.status).toBe(404)

    const unknown = await call({
      action: 'set_agent_status',
      slug: 'nobody',
      status: 'idle',
    }, { db })
    expect(unknown.status).toBe(404)
  })

  it('accepts the header when only its SHA-256 hash is stored', async () => {
    const db = createMemoryDb()
    const stored = await sha256Hex(SECRET)
    let lookups = 0
    const accepted = await call({ action: 'set_jv_status', status: 'away' }, {
      db,
      configuredSecret: '',
      lookupSecretHash: async () => {
        lookups += 1
        return stored
      },
    })
    expect(accepted.status).toBe(200)
    expect(lookups).toBe(1)
    expect(db.agents.get('jv')?.status).toBe('away')
    expect(JSON.stringify(accepted.body)).not.toContain(stored)

    const rejected = await call({ action: 'set_jv_status', status: 'online' }, {
      db,
      secret: 'wrong-secret',
      configuredSecret: '',
      lookupSecretHash: async () => stored,
    })
    expect(rejected.status).toBe(401)
    expect(rejected.body.error).toBe('Unauthorized.')
    expect(JSON.stringify(rejected.body)).not.toContain(stored)
    expect(JSON.stringify(rejected.body)).not.toContain('wrong-secret')
    expect(db.agents.get('jv')?.status).toBe('away')
  })

  it('prefers the env secret and returns 503 when neither source is configured', async () => {
    const db = createMemoryDb()
    let lookups = 0
    const fromEnv = await call({ action: 'set_jv_status', status: 'in_meeting' }, {
      db,
      lookupSecretHash: async () => {
        lookups += 1
        throw new Error('hash should not be read')
      },
    })
    expect(fromEnv.status).toBe(200)
    expect(lookups).toBe(0)

    const unconfigured = await call({ action: 'set_jv_status', status: 'away' }, {
      db,
      configuredSecret: '',
      lookupSecretHash: async () => null,
    })
    expect(unconfigured.status).toBe(503)
    expect(unconfigured.body.error).toBe('The office secret is not configured.')

    const brokenLookup = await call({ action: 'set_jv_status', status: 'away' }, {
      db,
      configuredSecret: '',
      lookupSecretHash: async () => {
        throw new Error('relation settings')
      },
    })
    expect(brokenLookup.status).toBe(500)
    expect(brokenLookup.body.error).toBe('The office could not check the secret.')
    expect(JSON.stringify(brokenLookup.body)).not.toContain('relation')
  })

  it('hides database failures', async () => {
    const db = createMemoryDb()
    db.updateAgent = async () => {
      throw new Error('relation "agents" does not exist')
    }
    const response = await call({ action: 'set_jv_status', status: 'away' }, { db })
    expect(response.status).toBe(500)
    expect(response.body.error).toBe('The office could not save that update.')
    expect(JSON.stringify(response.body)).not.toContain('relation')
  })
})
