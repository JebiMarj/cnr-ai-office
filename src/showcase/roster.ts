/**
 * Display identities for the C&R desks.
 * Slugs and responsibilities stay aligned with the status helper and the repo seed.
 * Epithets are short showcase labels; null means "show the repo role only".
 */
export type CoreMarkKind = 'emblem' | 'core' | 'gripper'

export type DeskIdentity = {
  slug: string
  name: string
  role: string
  epithet: string | null
  core: string
  ring: string
  mark: CoreMarkKind
}

export const DESK_IDENTITIES: readonly DeskIdentity[] = [
  {
    slug: 'alex',
    name: 'Jarvis',
    role: 'Executive & IT Project Assistant',
    epithet: 'Executive coordinator',
    core: '#5CE1FF',
    ring: '#E0C17A',
    mark: 'emblem',
  },
  {
    slug: 'dev',
    name: 'Ultron',
    role: 'Senior Full-Stack Systems Developer',
    epithet: 'Senior developer',
    core: '#FF4D5A',
    ring: '#FF8A94',
    mark: 'core',
  },
  {
    slug: 'sage',
    name: 'Friday',
    role: 'IT Project Advisor & Solutions Architect',
    epithet: 'IT advisor & architect',
    core: '#C4B5FD',
    ring: '#7C3AED',
    mark: 'core',
  },
  {
    slug: 'tech',
    name: 'EDITH',
    role: 'IT Support & Systems Technician',
    epithet: null,
    core: '#34D399',
    ring: '#059669',
    mark: 'core',
  },
  {
    slug: 'gia',
    name: 'Jocasta',
    role: 'Growth & Creative Assistant',
    epithet: null,
    core: '#5EEAD4',
    ring: '#D5DEE6',
    mark: 'core',
  },
  {
    slug: 'mechanicus',
    name: 'DUM-E',
    role: 'GHL Setup Builder',
    epithet: 'GHL builder',
    core: '#F5B942',
    ring: '#C9842A',
    mark: 'gripper',
  },
] as const

const BY_SLUG = Object.fromEntries(DESK_IDENTITIES.map((desk) => [desk.slug, desk])) as Record<string, DeskIdentity>

export function identityFor(slug: string): DeskIdentity | null {
  return BY_SLUG[slug] ?? null
}

export function isJarvisWorkspace(teammates: readonly { slug: string; name: string }[]): boolean {
  return teammates.some((teammate) => teammate.slug === 'alex' && teammate.name === 'Jarvis')
}

export function coreStyle(slug: string, fallback: string): { core: string; ring: string; epithet: string | null; mark: CoreMarkKind } {
  const identity = identityFor(slug)
  if (!identity) return { core: fallback, ring: fallback, epithet: null, mark: 'core' }
  return { core: identity.core, ring: identity.ring, epithet: identity.epithet, mark: identity.mark }
}
