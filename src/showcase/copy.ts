/** Exact label required wherever this preview shows sample work. */
export const SHOWCASE_BANNER = 'Showcase demo — sample tasks; no external actions'

export const SHOWCASE_SESSION_NOTE =
  'Saved in this browser tab only. Closing the tab clears it. It does not sync to the office, Gmail, calendar, GoHighLevel, or the project tracker.'

export const EXTERNAL_CONNECTIONS = [
  {
    id: 'gmail',
    name: 'Gmail',
    state: 'NOT CONNECTED',
    detail: 'This page has no mailbox access.',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    state: 'NOT CONNECTED',
    detail: 'This page has no calendar access.',
  },
  {
    id: 'ghl',
    name: 'GoHighLevel',
    state: 'NOT CONNECTED',
    detail: 'This page has no GoHighLevel access.',
  },
  {
    id: 'tracker',
    name: 'Master project tracker',
    state: 'NOT VERIFIED',
    detail:
      'The tracker remains authoritative and has not been freshly verified from this page. No project statuses or deadlines are shown.',
  },
] as const

export type ExternalConnection = (typeof EXTERNAL_CONNECTIONS)[number]
