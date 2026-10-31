import type { Pose, Vec } from '../motion.ts'

/** 0 faces south (+z). */
export function pathYaw(points: Vec[], traveled: number): number {
  let remain = Math.max(0, traveled)
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!
    const b = points[i]!
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    if (remain <= len || i === points.length - 1) return Math.atan2(b.x - a.x, b.y - a.y)
    remain -= len
  }
  return 0
}

export function seatYaw(slug: string, zone: string): number {
  if (zone === 'conference') return slug === 'jv' ? Math.PI / 2 : -Math.PI / 2
  if (zone === 'away') return 0
  if (slug === 'jv' || slug === 'marj') return Math.PI
  if (slug === 'alex' || slug === 'sage' || slug === 'dev') return 0
  if (zone === 'desk') return Math.PI
  return Math.PI
}

export function yawFor(pose: Pose, slug: string): number {
  if (pose.points.length > 1 && pose.traveled < pose.length - 0.05) return pathYaw(pose.points, pose.traveled)
  return seatYaw(slug, pose.zone)
}
