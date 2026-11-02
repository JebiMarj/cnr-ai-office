/**
 * Everything a later client rebrand should change lives here:
 * names, colors, type, agent colours, and the mark.
 *
 * Pink and orange were sampled from the official Create & Reach logo:
 * the solid arc is #E4396E, the deep orange is #F79521, and the light
 * orange is #FEBD63.
 */
export const brand = {
  name: 'C&R AI Office',
  company: 'Create & Reach VA Services',
  floor: 'Floor 1',
  logo: {
    src: '/cnr-logo.png',
    small: '/cnr-logo-128.png',
    favicon: '/favicon-32.png',
    appleTouchIcon: '/apple-touch-icon.png',
    alt: 'Create & Reach',
  },
  fonts: {
    display: '"Space Grotesk", sans-serif',
    body: '"Manrope", sans-serif',
  },
  colors: {
    pink: '#E4396E',
    orange: '#F79521',
    gold: '#FEBD63',
    ink: '#07060b',
    paper: '#f6f1e8',
    muted: '#d7cdc4',
  },
  agents: {
    jv: '#E4396E',
    marj: '#C76B8A',
    alex: '#F6F1E8',
    mechanicus: '#F79521',
    sage: '#FEBD63',
    dev: '#FF7A9C',
    tech: '#E7A27A',
    gia: '#FF9A3C',
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

export function BrandMark({ size = 48 }: { size?: number }) {
  return (
    <img
      className="brand-mark"
      src={brand.logo.small}
      alt=""
      width={size}
      height={size}
      decoding="async"
    />
  )
}
