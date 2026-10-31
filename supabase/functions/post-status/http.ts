import { applyCommand, type OfficeDb } from './apply.ts'
import { secretHashMatches, secretsMatch } from './secret.ts'
import { LIMITS, parseOfficeCommand } from './validate.ts'

export type HandlerDeps = {
  secret: string | undefined
  createDb: () => OfficeDb | null
  lookupSecretHash?: () => Promise<string | null>
  now?: Date
}

export async function handlePostStatus(request: Request, deps: HandlerDeps): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405, { allow: 'POST' })
  }

  const authorized = await authorize(request, deps)
  if (authorized) return authorized

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ ok: false, error: 'Content-Type must be application/json.' }, 415)
  }

  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > LIMITS.body) {
    return json({ ok: false, error: 'Request body is too large.' }, 413)
  }

  const text = await request.text()
  if (text.length > LIMITS.body) {
    return json({ ok: false, error: 'Request body is too large.' }, 413)
  }

  let payload: unknown
  try {
    payload = JSON.parse(text) as unknown
  } catch {
    return json({ ok: false, error: 'Body must be valid JSON.' }, 400)
  }

  const parsed = parseOfficeCommand(payload)
  if (!parsed.ok) return json({ ok: false, error: parsed.error }, 400)

  let db: OfficeDb | null
  try {
    db = deps.createDb()
  } catch {
    return json({ ok: false, error: 'The office could not save that update.' }, 500)
  }
  if (!db) return json({ ok: false, error: 'Database credentials are not configured.' }, 500)

  try {
    const result = await applyCommand(db, parsed.command, deps.now ?? new Date())
    if (!result.ok) return json({ ok: false, error: result.error }, result.status)
    return json({ ok: true, action: result.action, ...result.detail }, 200)
  } catch {
    return json({ ok: false, error: 'The office could not save that update.' }, 500)
  }
}

async function authorize(request: Request, deps: HandlerDeps): Promise<Response | null> {
  const header = request.headers.get('x-office-secret')
  if (deps.secret) {
    const matches = await secretsMatch(header, deps.secret)
    return matches ? null : json({ ok: false, error: 'Unauthorized.' }, 401)
  }

  let storedHash: string | null
  try {
    storedHash = deps.lookupSecretHash ? await deps.lookupSecretHash() : null
  } catch {
    return json({ ok: false, error: 'The office could not check the secret.' }, 500)
  }
  if (!storedHash) {
    return json({ ok: false, error: 'The office secret is not configured.' }, 503)
  }

  const matches = await secretHashMatches(header, storedHash)
  return matches ? null : json({ ok: false, error: 'Unauthorized.' }, 401)
}

function json(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extra,
    },
  })
}
