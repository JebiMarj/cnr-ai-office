import type { Snapshot } from '../types.ts'
import { ago } from '../time.ts'

export type FeedTone = 'live' | 'stale' | 'offline' | 'connecting' | 'demo'

export type OfficeFeedCopy = {
  tone: FeedTone
  label: string
  detail: string
  freshness: string
}

const STALE_AFTER_MS = 120_000

/** Describes the office status source. It never describes the showcase sample. */
export function describeOfficeFeed(snap: Snapshot, now: Date): OfficeFeedCopy {
  if (snap.connection === 'connecting') {
    return {
      tone: 'connecting',
      label: 'Connecting',
      detail: 'Waiting for the public office views. No status rows yet.',
      freshness: 'Not received yet',
    }
  }
  if (snap.connection === 'demo') {
    return {
      tone: 'demo',
      label: 'Sample office data',
      detail: 'The floor is showing template sample statuses. This is not the live office feed.',
      freshness: snap.fetchedAt ? `Sample generated ${ago(snap.fetchedAt, now)}` : 'Not a live feed',
    }
  }
  if (snap.connection === 'offline') {
    if (snap.fetchedAt) {
      return {
        tone: 'stale',
        label: 'Offline',
        detail: 'The office feed did not respond. The last snapshot is still shown and may be stale.',
        freshness: `Last received ${ago(snap.fetchedAt, now)}`,
      }
    }
    return {
      tone: 'offline',
      label: 'Offline',
      detail: 'The office feed did not respond. No snapshot has arrived.',
      freshness: 'No snapshot',
    }
  }
  const age = snap.fetchedAt ? now.getTime() - new Date(snap.fetchedAt).getTime() : Number.POSITIVE_INFINITY
  if (!snap.fetchedAt || age > STALE_AFTER_MS) {
    return {
      tone: 'stale',
      label: 'Live feed overdue',
      detail: 'The last successful read of the public office views is older than the usual refresh. Treat it as stale until a newer one arrives.',
      freshness: snap.fetchedAt ? `Last received ${ago(snap.fetchedAt, now)}` : 'No timestamp',
    }
  }
  return {
    tone: 'live',
    label: 'Live',
    detail: 'Read from the public office views (office_agents, office_activities, office_approvals). Separate from the showcase sample.',
    freshness: `Updated ${ago(snap.fetchedAt, now)}`,
  }
}

export function doneTodayCopy(snap: Snapshot): string {
  if (snap.connection === 'connecting') return 'Done-today count has not arrived.'
  if (snap.connection === 'offline' && !snap.fetchedAt) return 'No done-today count. The office feed has not arrived.'
  if (snap.connection === 'demo') return `${snap.doneToday} marked done today in the template sample. Not a live total.`
  if (snap.connection === 'offline') return `${snap.doneToday} marked done today in the last office snapshot.`
  return `${snap.doneToday} marked done today in the office activity feed.`
}

export const OFFICE_STATUS_LABEL = {
  working: 'Working',
  waiting_on_jv: 'Hand up',
  idle: 'Standing by',
  offline: 'Offline',
} as const
