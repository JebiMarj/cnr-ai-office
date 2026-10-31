import { createClient } from 'npm:@supabase/supabase-js@2'
import { handlePostStatus } from './http.ts'
import { createSupabaseOfficeDb } from './supabaseDb.ts'

Deno.serve((request: Request) => {
  return handlePostStatus(request, {
    secret: Deno.env.get('OFFICE_AGENT_SECRET'),
    createDb: () => {
      const client = serviceClient()
      return client ? createSupabaseOfficeDb(client) : null
    },
    lookupSecretHash: () => readStoredSecretHash(),
  })
})

async function readStoredSecretHash(): Promise<string | null> {
  const supabase = serviceClient('office_private')
  if (!supabase) return null
  const { data, error } = await supabase.rpc('agent_secret_hash')
  if (error) throw new Error('secret lookup failed')
  if (typeof data !== 'string') return null
  const hash = data.trim().toLowerCase()
  return hash === '' ? null : hash
}

function serviceClient(schema?: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = readServiceKey()
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: schema ? { schema } : undefined,
  })
}

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
