import { useId } from 'react'

/**
 * Everything a later client rebrand should change lives here:
 * names, colors, type, and the mark.
 */
export const brand = {
  name: 'C&R AI Office',
  company: 'Create & Reach VA Services',
  floor: 'Floor 1',
  fonts: {
    display: '"Space Grotesk", sans-serif',
    body: '"Manrope", sans-serif',
  },
  colors: {
    pink: '#E4386E',
    orange: '#F9A23C',
    gold: '#FDBE6A',
    ink: '#07060b',
    paper: '#f6f1e8',
    muted: '#c4b8ae',
  },
} as const

export function applyBrand(root: HTMLElement) {
  const { colors, fonts } = brand
  const style = root.style
  style.setProperty('--pink', colors.pink)
  style.setProperty('--orange', colors.orange)
  style.setProperty('--gold', colors.gold)
  style.setProperty('--ink', colors.ink)
  style.setProperty('--paper', colors.paper)
  style.setProperty('--muted', colors.muted)
  style.setProperty('--font-display', fonts.display)
  style.setProperty('--font-body', fonts.body)
}

export function BrandMark({ size = 42 }: { size?: number }) {
  const id = `cr-mark-${useId().replace(/:/g, '')}`
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill={`url(#${id})`} />
      <path
        d="M31.5 16.2a9 9 0 1 0 0 15.6"
        fill="none"
        stroke={brand.colors.ink}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="34.2" cy="15.2" r="2.5" fill={brand.colors.paper} />
      <defs>
        <linearGradient id={id} x1="6" y1="4" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor={brand.colors.pink} />
          <stop offset="1" stopColor={brand.colors.orange} />
        </linearGradient>
      </defs>
    </svg>
  )
}
