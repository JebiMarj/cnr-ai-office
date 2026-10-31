import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return files(path)
    return /\.(ts|tsx|css|html)$/.test(entry.name) ? [path] : []
  })
}

describe('browser bundle boundary', () => {
  it('keeps service credentials out of the frontend', () => {
    const source = files('src').map((path) => readFileSync(path, 'utf8')).join('\n')
    expect(source).not.toMatch(/service_role/i)
    expect(source).not.toMatch(/OFFICE_AGENT_SECRET/)
    expect(source).not.toMatch(/SUPABASE_SECRET/)
    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE/)
  })
})
