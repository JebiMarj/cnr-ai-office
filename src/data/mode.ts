export function shouldUseMock(search: string, hasLiveConfig: boolean): boolean {
  const params = new URLSearchParams(search)
  if (params.get('mock') === '1') return true
  return !hasLiveConfig
}

export function readLiveConfig(env: { url?: string; anonKey?: string }): { url: string; anonKey: string } | null {
  const url = env.url?.trim()
  const anonKey = env.anonKey?.trim()
  if (!url || !anonKey) return null
  if (url.includes('YOUR_PROJECT') || anonKey.includes('YOUR_SUPABASE')) return null
  return { url, anonKey }
}

export function previewIsMock(search: string): boolean {
  return shouldUseMock(
    search,
    readLiveConfig({
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    }) !== null,
  )
}
