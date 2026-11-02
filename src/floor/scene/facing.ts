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
  // JV sits on the east side of the round table and looks west. Marj sits west and looks east.
  if (zone === 'conference') return slug === 'jv' ? -Math.PI / 2 : Math.PI / 2
  if (zone === 'away') return 0
  if (slug === 'jv' || slug === 'marj') return Math.PI
  if (slug === 'alex' || slug === 'sage' || slug === 'dev') return 0
  if (zone === 'desk') return Math.PI
  return Math.PI
}

/** Face the counter, the bookshelf, or the lounge coffee table once a wander stops. */
export function facingForSpot(at: Vec): number {
  if (at.y < 4.9) return Math.PI
  if (at.x > 8.7 && at.x < 11.5 && at.y < 8.3) return Math.atan2(9.25 - at.x, 7.15 - at.y)
  if (at.y < 9) return 0
  return Math.atan2(13.45 - at.x, 9.15 - at.y)
}

export function yawFor(pose: Pose, slug: string): number {
  if ((pose.errand === 1 || pose.errand === 3) && pose.points.length > 1 && pose.traveled < pose.length - 0.05) {
    return pathYaw(pose.points, pose.traveled)
  }
  if (pose.errand === 2 && pose.points.length > 0) return facingForSpot(pose.points[pose.points.length - 1]!)
  if (pose.points.length > 1 && pose.traveled < pose.length - 0.05) return pathYaw(pose.points, pose.traveled)
  if (pose.zone === 'lounge' && pose.points.length > 0) return facingForSpot(pose.points[pose.points.length - 1]!)
  return seatYaw(slug, pose.zone)
}
