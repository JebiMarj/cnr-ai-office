const MAX_SECRET_LENGTH = 256

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
