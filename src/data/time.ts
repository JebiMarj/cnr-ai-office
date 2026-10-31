export function formatAgo(iso: string, nowMs: number): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 'just now'
  const seconds = Math.max(0, Math.round((nowMs - then) / 1000))
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function formatWait(iso: string, nowMs: number): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 'Waiting'
  const minutes = Math.max(0, Math.floor((nowMs - then) / 60000))
  if (minutes < 1) return 'Waiting under a minute'
  if (minutes < 60) return `Waiting ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Waiting ${hours}h`
  return `Waiting ${Math.floor(hours / 24)}d`
}

export function formatManilaClock(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)
}
