/**
 * Default executive floor hours: 9:00 PM inclusive through 5:00 AM exclusive, Asia/Manila.
 * Each human can override the window. The default is not tied to one slug.
 */
export const MANILA_TIME_ZONE = 'Asia/Manila'
export const SHIFT_START_HOUR = 21
export const SHIFT_END_HOUR = 5
export const SHIFT_LABEL = '9:00 PM – 5:00 AM Manila'

export type ShiftWindow = {
  startHour?: number
  endHour?: number
}

export function manilaHour(now: Date): number {
  const value = new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    hour: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(now)
    .find((part) => part.type === 'hour')?.value

  const hour = Number(value)
  if (!Number.isFinite(hour)) return 0
  return hour === 24 ? 0 : hour
}

export function isOnShift(now: Date, window: ShiftWindow = {}): boolean {
  const start = normalizeHour(window.startHour, SHIFT_START_HOUR)
  const end = normalizeHour(window.endHour, SHIFT_END_HOUR)
  const hour = manilaHour(now)
  if (start === end) return false
  if (start < end) return hour >= start && hour < end
  return hour >= start || hour < end
}

export function isOnManilaShift(now: Date): boolean {
  return isOnShift(now)
}

export function scheduledBossStatus(now: Date, window: ShiftWindow = {}): 'online' | 'away' {
  return isOnShift(now, window) ? 'online' : 'away'
}

function normalizeHour(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 23) return fallback
  return value
}
