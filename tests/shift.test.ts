import { describe, expect, it } from 'vitest'
import {
  isOnManilaShift,
  manilaHour,
  scheduledBossStatus,
} from '../supabase/functions/_shared/shift.ts'
import { displayStatus } from '../src/data/shift.ts'
import type { Agent } from '../src/data/types.ts'

function boss(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'jv',
    slug: 'jv',
    name: 'JV',
    subtitle: 'John Vincent Lorenzana',
    role: 'Chief Executive Officer',
    deskX: 76,
    deskY: 26,
    status: 'away',
    statusMode: 'auto',
    currentTask: null,
    isBoss: true,
    isHuman: true,
    rank: 1,
    shiftStartHour: 21,
    shiftEndHour: 5,
    updatedAt: '2026-10-31T00:00:00Z',
    ...overrides,
  }
}

describe('Manila shift', () => {
  it('treats 9:00 PM through 4:59 AM as on shift', () => {
    expect(manilaHour(new Date('2026-10-31T12:59:00Z'))).toBe(20)
    expect(isOnManilaShift(new Date('2026-10-31T12:59:00Z'))).toBe(false)

    expect(manilaHour(new Date('2026-10-31T13:00:00Z'))).toBe(21)
    expect(scheduledBossStatus(new Date('2026-10-31T13:00:00Z'))).toBe('online')

    expect(manilaHour(new Date('2026-10-31T16:00:00Z'))).toBe(0)
    expect(isOnManilaShift(new Date('2026-10-31T16:00:00Z'))).toBe(true)

    expect(manilaHour(new Date('2026-10-31T20:59:00Z'))).toBe(4)
    expect(isOnManilaShift(new Date('2026-10-31T20:59:00Z'))).toBe(true)

    expect(manilaHour(new Date('2026-10-31T21:00:00Z'))).toBe(5)
    expect(scheduledBossStatus(new Date('2026-10-31T21:00:00Z'))).toBe('away')

    expect(scheduledBossStatus(new Date('2026-10-31T04:00:00Z'))).toBe('away')
  })

  it('keeps a manual boss status and follows the clock otherwise', () => {
    const duringShift = new Date('2026-10-31T14:00:00Z')
    const offShift = new Date('2026-10-31T02:00:00Z')

    expect(displayStatus(boss(), duringShift)).toBe('online')
    expect(displayStatus(boss(), offShift)).toBe('away')
    expect(displayStatus(boss({ statusMode: 'manual', status: 'in_meeting' }), offShift)).toBe('in_meeting')
    expect(displayStatus(boss({ statusMode: 'manual', status: 'online' }), offShift)).toBe('online')
    expect(displayStatus(boss({ isBoss: false, isHuman: false, status: 'working', statusMode: 'manual' }), offShift)).toBe('working')
  })

  it('lets each human keep their own shift window', () => {
    const night = new Date('2026-10-31T14:00:00Z')
    const morning = new Date('2026-10-31T02:00:00Z')
    const marj = boss({
      slug: 'marj',
      name: 'Marj',
      role: 'Vice President',
      isBoss: false,
      isHuman: true,
      rank: 2,
      shiftStartHour: 9,
      shiftEndHour: 17,
    })
    expect(displayStatus(marj, night)).toBe('away')
    expect(displayStatus(marj, morning)).toBe('online')
    expect(displayStatus(boss(), morning)).toBe('away')
    expect(displayStatus(boss({ slug: 'marj', isBoss: false, isHuman: true, rank: 2 }), night)).toBe('online')
  })
})
