import { describe, expect, it } from 'vitest'
import { hashesMatch, secretHashMatches, sha256Hex } from '../supabase/functions/post-status/secret.ts'

describe('secret hash', () => {
  it('matches the SHA-256 test vector for abc', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('compares digests without treating a different length as a match', async () => {
    const hash = await sha256Hex('test-office-secret')
    expect(hashesMatch(hash, hash.toUpperCase())).toBe(true)
    expect(hashesMatch(hash, `${hash}00`)).toBe(false)
    expect(hashesMatch(hash, hash.replace('a', 'b'))).toBe(false)
    expect(await secretHashMatches('test-office-secret', hash)).toBe(true)
    expect(await secretHashMatches('other-secret', hash)).toBe(false)
    expect(await secretHashMatches(null, hash)).toBe(false)
    expect(await secretHashMatches('x'.repeat(300), hash)).toBe(false)
  })
})