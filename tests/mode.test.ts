import { describe, expect, it } from 'vitest'
import { shouldUseMock } from '../src/data/mode.ts'

describe('preview mode', () => {
  it('uses mock data when asked, and whenever live config is missing', () => {
    expect(shouldUseMock('?mock=1', true)).toBe(true)
    expect(shouldUseMock('?floor=1&mock=1', true)).toBe(true)
    expect(shouldUseMock('', false)).toBe(true)
    expect(shouldUseMock('?mock=0', true)).toBe(false)
    expect(shouldUseMock('', true)).toBe(false)
  })
})
