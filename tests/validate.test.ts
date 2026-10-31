import { describe, expect, it } from 'vitest'
import { LIMITS, parseOfficeCommand } from '../supabase/functions/post-status/validate.ts'

const ACTIVITY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const APPROVAL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('post-status validation', () => {
  it('accepts each action and trims text', () => {
    expect(parseOfficeCommand({
      action: 'set_agent_status',
      slug: 'dev',
      status: 'working',
      current_task: '  Shipping the billing webhook  ',
    })).toEqual({
      ok: true,
      command: {
        action: 'set_agent_status',
        slug: 'dev',
        status: 'working',
        currentTask: 'Shipping the billing webhook',
      },
    })

    expect(parseOfficeCommand({
      action: 'set_agent_status',
      slug: 'tech',
      status: 'offline',
    })).toMatchObject({
      ok: true,
      command: { currentTask: undefined },
    })

    expect(parseOfficeCommand({
      action: 'set_current_task',
      slug: 'gia',
      current_task: null,
    })).toMatchObject({ ok: true, command: { currentTask: null } })

    expect(parseOfficeCommand({
      action: 'add_activity',
      slug: 'sage',
      task_title: 'Review architecture notes',
      status: 'working',
    })).toMatchObject({ ok: true, command: { taskTitle: 'Review architecture notes' } })

    expect(parseOfficeCommand({
      action: 'finish_activity',
      activity_id: ACTIVITY_ID.toUpperCase(),
      status: 'done',
    })).toMatchObject({ ok: true, command: { activityId: ACTIVITY_ID, status: 'done' } })

    expect(parseOfficeCommand({
      action: 'add_approval',
      slug: 'alex',
      title: 'Approve vendor invoice batch',
    })).toMatchObject({ ok: true })

    expect(parseOfficeCommand({
      action: 'resolve_approval',
      approval_id: APPROVAL_ID,
      status: 'declined',
    })).toMatchObject({ ok: true, command: { status: 'declined' } })

    expect(parseOfficeCommand({ action: 'set_jv_status', status: 'in_meeting' })).toMatchObject({
      ok: true,
      command: { status: 'in_meeting' },
    })

    expect(parseOfficeCommand({ action: 'set_jv_status', status: 'auto' })).toMatchObject({
      ok: true,
      command: { status: 'auto' },
    })

    expect(parseOfficeCommand({ action: 'set_human_status', slug: 'marj', status: 'in_meeting' })).toMatchObject({
      ok: true,
      command: { action: 'set_human_status', slug: 'marj', status: 'in_meeting' },
    })

    expect(parseOfficeCommand({ action: 'set_human_status', slug: 'jv', status: 'auto' })).toMatchObject({
      ok: true,
      command: { slug: 'jv', status: 'auto' },
    })
  })

  it('rejects malformed bodies', () => {
    const cases: unknown[] = [
      null,
      [],
      'working',
      4,
      {},
      { action: 'drop_table' },
      { action: 'set_agent_status', slug: 'Dev', status: 'working' },
      { action: 'set_agent_status', slug: 'dev_ops', status: 'working' },
      { action: 'set_agent_status', slug: 'jv', status: 'online' },
      { action: 'set_agent_status', slug: 'dev', status: 'online' },
      { action: 'set_agent_status', slug: 'dev', status: 'working', current_task: '   ' },
      { action: 'set_agent_status', slug: 'dev', status: 'working', note: 'extra' },
      { action: 'set_agent_status', slug: 'dev', status: 'working', currentTask: 'camel' },
      { action: 'add_activity', slug: 'dev', task_title: 'x'.repeat(LIMITS.taskTitle + 1), status: 'working' },
      { action: 'add_approval', slug: 'dev', title: 'Ship it <script>' },
      { action: 'add_approval', slug: 'dev', title: 'Line one\nline two' },
      { action: 'finish_activity', activity_id: 'not-a-uuid', status: 'done' },
      { action: 'finish_activity', activity_id: ACTIVITY_ID, status: 'working' },
      { action: 'resolve_approval', approval_id: APPROVAL_ID, status: 'pending' },
      { action: 'set_jv_status', status: 'working' },
      { action: 'set_jv_status', status: 'auto', slug: 'jv' },
      { action: 'set_human_status', slug: 'marj', status: 'working' },
      { action: 'set_human_status', status: 'online' },
      { action: 'set_current_task', slug: 'gia' },
      { action: 'add_activity', slug: "dev'; drop table agents;--", task_title: 'Hi', status: 'working' },
      { action: 'set_agent_status', slug: 'dev', status: 'working', __proto__: { admin: true } },
    ]

    for (const body of cases) {
      const result = parseOfficeCommand(body)
      expect(result.ok, JSON.stringify(body)).toBe(false)
    }
  })

  it('accepts punctuation used in normal task titles', () => {
    const result = parseOfficeCommand({
      action: 'add_activity',
      slug: 'mechanicus',
      task_title: 'GHL pipeline: onboarding (Q4)',
      status: 'waiting_on_jv',
    })
    expect(result.ok).toBe(true)
  })

  it('rejects an empty current task instead of treating it as a clear', () => {
    const result = parseOfficeCommand({
      action: 'set_current_task',
      slug: 'gia',
      current_task: '   ',
    })
    expect(result).toMatchObject({ ok: false })
  })
})
