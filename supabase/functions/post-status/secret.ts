const MAX_SECRET_LENGTH = 256

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Constant-time compare of two hex digests. A length mismatch never matches. */
export function hashesMatch(providedHex: string, storedHex: string): boolean {
  const encoder = new TextEncoder()
  const left = encoder.encode(providedHex.toLowerCase())
  const right = encoder.encode(storedHex.trim().toLowerCase())
  const length = Math.max(left.length, right.length, 64)
  let diff = left.length === right.length ? 0 : 1
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0)
  }
  return diff === 0
}

export async function secretHashMatches(provided: string | null, storedHash: string): Promise<boolean> {
  if (!provided || !storedHash) return false
  if (provided.length > MAX_SECRET_LENGTH) return false
  return hashesMatch(await sha256Hex(provided), storedHash)
}

/**
 * Compares two secrets by their SHA-256 digests so the loop length does not
 * depend on the secret. A missing or oversized value never matches.
 */
export async function secretsMatch(
  provided: string | null,
  expected: string | null,
): Promise<boolean> {
  if (!provided || !expected) return false
  if (provided.length > MAX_SECRET_LENGTH || expected.length > MAX_SECRET_LENGTH) return false

  const encoder = new TextEncoder()
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ])
  const a = new Uint8Array(left)
  const b = new Uint8Array(right)
  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index]! ^ b[index]!
  }
  return diff === 0
}
