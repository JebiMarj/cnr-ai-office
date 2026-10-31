/** JV's floor hours: 9:00 PM inclusive through 5:00 AM exclusive, Asia/Manila. */
export const MANILA_TIME_ZONE = 'Asia/Manila'
export const SHIFT_START_HOUR = 21
export const SHIFT_END_HOUR = 5
export const SHIFT_LABEL = '9:00 PM – 5:00 AM Manila'

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

export function isOnManilaShift(now: Date): boolean {
  const hour = manilaHour(now)
  return hour >= SHIFT_START_HOUR || hour < SHIFT_END_HOUR
}

export function scheduledBossStatus(now: Date): 'online' | 'away' {
  return isOnManilaShift(now) ? 'online' : 'away'
}
