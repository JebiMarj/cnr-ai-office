export function zonedParts(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]))
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute }
}
/** UTC instant of 00:00 today in the tenant's zone. */
export function startOfZonedDay(now: Date, tz: string): Date {
  const z = zonedParts(now, tz)
  const asUtc = Date.UTC(z.y, z.m - 1, z.d, z.h, z.min)
  const offsetMs = asUtc - Math.floor(now.getTime() / 60000) * 60000
  return new Date(Date.UTC(z.y, z.m - 1, z.d) - offsetMs)
}
export function greeting(now: Date, tz: string) {
  const h = zonedParts(now, tz).h
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
export function longDate(now: Date, tz: string) {
  const d = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric' }).format(now)
  const t = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(now)
  return `${d} · ${t}`
}
export function clockAngles(now: Date, tz: string) {
  const z = zonedParts(now, tz)
  return { hour: ((z.h % 12) + z.min / 60) * 30, minute: z.min * 6 }
}
export function ago(iso: string, now: Date) {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return `${d} day${d === 1 ? '' : 's'} ago`
}
