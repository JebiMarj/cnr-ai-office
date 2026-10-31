import { describe, expect, it } from 'vitest'
import { formatAgo, formatWait } from '../src/data/time.ts'

const now = Date.parse('2026-10-31T12:00:00Z')

describe('relative time', () => {
  it('formats recent moments and longer waits', () => {
    expect(formatAgo('2026-10-31T11:59:55Z', now)).toBe('just now')
    expect(formatAgo('2026-10-31T11:59:20Z', now)).toBe('40s ago')
    expect(formatAgo('2026-10-31T11:42:00Z', now)).toBe('18m ago')
    expect(formatAgo('2026-10-31T09:00:00Z', now)).toBe('3h ago')
    expect(formatWait('2026-10-31T11:59:30Z', now)).toBe('Waiting under a minute')
    expect(formatWait('2026-10-31T10:00:00Z', now)).toBe('Waiting 2h')
  })
})
