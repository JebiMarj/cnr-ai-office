import { createClient } from 'npm:@supabase/supabase-js@2'
import { handlePostStatus } from './http.ts'
import { createSupabaseOfficeDb } from './supabaseDb.ts'

Deno.serve((request: Request) => {
  return handlePostStatus(request, {
    secret: Deno.env.get('OFFICE_AGENT_SECRET'),
    createDb: () => {
      const url = Deno.env.get('SUPABASE_URL')
      const serviceKey = readServiceKey()
      if (!url || !serviceKey) return null
      const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      return createSupabaseOfficeDb(supabase)
    },
  })
})

function readServiceKey(): string | null {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (legacy) return legacy
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { default?: unknown }
    return typeof parsed.default === 'string' ? parsed.default : null
  } catch {
    return null
  }
}
