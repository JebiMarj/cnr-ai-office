import { brand } from '../brand.tsx'
import type { BodyPose } from './motion.ts'

type Hair = 'ceo' | 'twist' | 'bun' | 'crop' | 'swept' | 'messy' | 'short' | 'bob'
type Outfit = 'suit' | 'vp' | 'blazer' | 'workjacket' | 'cardigan' | 'hoodie' | 'polo' | 'creative'

type Look = {
  outfit: Outfit
  skin: string
  hair: string
  hairStyle: Hair
  pants: string
  pantsShade: string
  shoes: string
  top: string
  topShade: string
  shirt: string
  accent: string
  glasses?: boolean
  headset?: boolean
  tablet?: boolean
  belt?: boolean
  tie?: boolean
  pin?: boolean
  heel?: boolean
}

const LOOKS: Record<string, Look> = {
  jv: {
    outfit: 'suit',
    skin: '#e4b48f',
    hair: '#2a241c',
    hairStyle: 'ceo',
    pants: '#1a1620',
    pantsShade: '#100e14',
    shoes: '#141018',
    top: '#2c2832',
    topShade: '#1c1822',
    shirt: '#f6f1e8',
    accent: brand.colors.gold,
    tie: true,
  },
  marj: {
    outfit: 'vp',
    skin: '#d9a07a',
    hair: '#1c120e',
    hairStyle: 'twist',
    pants: '#2a1830',
    pantsShade: '#1a1020',
    shoes: '#2a121c',
    top: '#6e2448',
    topShade: '#4a1832',
    shirt: '#f7f1ea',
    accent: brand.colors.gold,
    pin: true,
    heel: true,
  },
  alex: {
    outfit: 'blazer',
    skin: '#c68642',
    hair: '#1a120e',
    hairStyle: 'bun',
    pants: '#2a3144',
    pantsShade: '#1c2434',
    shoes: '#1a1c24',
    top: '#2c3348',
    topShade: '#1e2636',
    shirt: '#f4efe6',
    accent: brand.colors.paper,
    tablet: true,
  },
  mechanicus: {
    outfit: 'workjacket',
    skin: '#8d5524',
    hair: '#16110e',
    hairStyle: 'crop',
    pants: '#2c261c',
    pantsShade: '#1a1612',
    shoes: '#3a2a18',
    top: '#c46a22',
    topShade: '#8a4816',
    shirt: '#2a211c',
    accent: '#1a120e',
    belt: true,
  },
  sage: {
    outfit: 'cardigan',
    skin: '#f0d2c0',
    hair: '#5c534a',
    hairStyle: 'swept',
    pants: '#3e382f',
    pantsShade: '#2a261f',
    shoes: '#2a2420',
    top: '#c9a06a',
    topShade: '#8d7048',
    shirt: '#f7f3ec',
    accent: '#2a241c',
    glasses: true,
  },
  dev: {
    outfit: 'hoodie',
    skin: '#d4a574',
    hair: '#241818',
    hairStyle: 'messy',
    pants: '#2a2030',
    pantsShade: '#1a1420',
    shoes: '#1a141c',
    top: '#3a2030',
    topShade: '#2a1524',
    shirt: '#ff7a9c',
    accent: brand.colors.pink,
  },
  tech: {
    outfit: 'polo',
    skin: '#a86b45',
    hair: '#3a2a22',
    hairStyle: 'short',
    pants: '#243040',
    pantsShade: '#182028',
    shoes: '#1a1c20',
    top: '#e7a27a',
    topShade: '#c4845c',
    shirt: '#f3e6dc',
    accent: '#1a2830',
    headset: true,
    belt: true,
  },
  gia: {
    outfit: 'creative',
    skin: '#f1c7b0',
    hair: '#6b2148',
    hairStyle: 'bob',
    pants: '#1e4552',
    pantsShade: '#14343e',
    shoes: '#e7b84a',
    top: '#e4396e',
    topShade: '#a02048',
    shirt: '#f6e2c4',
    accent: brand.colors.gold,
  },
}

export function Person({ slug, gait }: { slug: string; gait: BodyPose }) {
  const look = LOOKS[slug] ?? LOOKS.alex!
  const seated = gait === 'sit'
  return (
    <g className="actor" data-figure="human" data-outfit={look.outfit} data-slug={slug}>
      <ellipse cx="0" cy="3" rx="14" ry="5" fill="rgba(0,0,0,0.4)" />
      {seated ? <ChairBack look={look} /> : null}
      {seated ? <SeatedLegs look={look} /> : <StandingLegs look={look} />}
      <Arm side="back" look={look} />
      <Torso look={look} />
      <Arm side="front" look={look} hold={look.tablet ? 'tablet' : look.belt ? 'tool' : 'none'} />
      <Head look={look} />
    </g>
  )
}

function StandingLegs({ look }: { look: Look }) {
  return (
    <g>
      <g className="limb leg leg-back">
        <path d="M-8 -27 h6 l0.7 22 h-5.6 z" fill={look.pantsShade} />
        <path d={`M-8.2 -5.2 h7.4 l1.3 ${look.heel ? 3.2 : 4.4} h-8.6 z`} fill={look.shoes} />
        {look.heel ? <path d="M-1.2 -1.6 h3.2 l0.4 2.2 h-3 z" fill={look.accent} /> : null}
      </g>
      <g className="limb leg leg-front">
        <path d="M2.2 -27 h6.2 l0.8 22 h-5.8 z" fill={look.pants} />
        <path d={`M1.8 -5.2 h8 l1.5 ${look.heel ? 3.2 : 4.6} h-9.2 z`} fill={look.shoes} />
        {look.heel ? <path d="M8.2 -1.8 h3.4 l0.5 2.4 h-3.2 z" fill={look.accent} /> : null}
      </g>
    </g>
  )
}

function ChairBack({ look }: { look: Look }) {
  const exec = look.outfit === 'suit' || look.outfit === 'vp'
  const shell = exec ? '#241820' : '#241c2c'
  const pad = exec ? '#5c3a4e' : '#3a3148'
  return (
    <g className="seat-back">
      <path d="M-18 -18 Q-20 -58 0 -66 Q20 -58 18 -18 Q0 -8 -18 -18" fill={shell} />
      <path d="M-12 -20 Q-13 -50 0 -56 Q13 -50 12 -20 Q0 -12 -12 -20" fill={pad} />
    </g>
  )
}

function SeatedLegs({ look }: { look: Look }) {
  return (
    <g className="legs-seated">
      <path d="M-8 -22 L-1 -20 L18 -14 L10 -10 Z" fill={look.pantsShade} />
      <path d="M10 -14 L20 -15 L19 4 L10 4 Z" fill={look.pantsShade} />
      <path d="M10 4 L21 3 L23 9 L10 9 Z" fill={look.shoes} />
      <path d="M-2 -20 L6 -18 L24 -12 L14 -8 Z" fill={look.pants} />
      <path d="M14 -12 L26 -13 L25 6 L14 6 Z" fill={look.pants} />
      <path d="M14 6 L27 5 L29 11 L14 11 Z" fill={look.shoes} />
    </g>
  )
}

function Arm({ side, look, hold = 'none' }: { side: 'back' | 'front'; look: Look; hold?: 'none' | 'tablet' | 'tool' }) {
  const front = side === 'front'
  const x = front ? 10 : -14
  const fill = front ? look.top : look.topShade
  return (
    <g className={`limb arm arm-${side}`}>
      <path d={`M${x} -46 l${front ? 2 : -1} 16 l${front ? 4.2 : 3.6} 1.2 l${front ? -1 : 1.4} -16.4 z`} fill={fill} />
      <circle cx={front ? x + 5.2 : x + 1.2} cy="-28.5" r="2.3" fill={look.skin} />
      {hold === 'tablet' && front ? (
        <g>
          <rect x="12" y="-36" width="9" height="12" rx="1.2" fill={brand.colors.paper} />
          <path d="M13.4 -33.2 h6.2 M13.4 -30.6 h6.2 M13.4 -28 h3.6" stroke={brand.colors.ink} strokeWidth="0.7" />
        </g>
      ) : null}
      {hold === 'tool' && front ? (
        <path d="M14 -32 l7 2 -1 2.2 -7 -2 z" fill="#c8ccd4" stroke="#1a1c22" strokeWidth="0.6" />
      ) : null}
    </g>
  )
}

function Torso({ look }: { look: Look }) {
  return (
    <g className="torso">
      <path d="M-13 -48 L-15 -28 Q-15 -24 -8 -24 L8 -24 Q15 -24 14 -28 L12 -48 Q6 -52 -6 -52 Q-12 -50 -13 -48" fill={look.top} />
      <path d="M-6 -50 L-8 -28 Q0 -25 8 -28 L6 -50 Q0 -53 -6 -50" fill={look.topShade} opacity="0.35" />
      {look.outfit === 'suit' ? <Suit look={look} /> : null}
      {look.outfit === 'vp' ? <VpJacket look={look} /> : null}
      {look.outfit === 'blazer' ? <Blazer look={look} /> : null}
      {look.outfit === 'workjacket' ? <WorkJacket look={look} /> : null}
      {look.outfit === 'cardigan' ? <Cardigan look={look} /> : null}
      {look.outfit === 'hoodie' ? <Hoodie look={look} /> : null}
      {look.outfit === 'polo' ? <Polo look={look} /> : null}
      {look.outfit === 'creative' ? <Creative look={look} /> : null}
    </g>
  )
}

function Suit({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-4.2 -49 L-1.2 -36 L1.2 -36 L4.2 -49 L1.4 -50 L-1.4 -50 Z" fill={look.shirt} />
      <path d="M-1.1 -46 h2.2 l0.7 12 h-3.6 z" fill={look.accent} />
      <path d="M-0.5 -40 h1" stroke={brand.colors.ink} strokeWidth="0.6" />
      <path d="M6 -40 h3.2 v2.4 h-3.2 z" fill={look.shirt} />
      <path d="M6.4 -39.4 h2.4" stroke={look.accent} strokeWidth="0.7" />
    </g>
  )
}

function VpJacket({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-3.6 -48 Q0 -42 3.6 -48 L2.2 -36 Q0 -34 -2.2 -36 Z" fill={look.shirt} />
      <circle cx="5.5" cy="-40" r="1.5" fill={look.accent} />
      <path d="M-11 -34 h5.5 M6 -34 h5" stroke={look.accent} strokeWidth="0.7" opacity="0.8" />
    </g>
  )
}

function Blazer({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-3 -48 L-1 -38 h2 l2 -10" fill="none" stroke={look.shirt} strokeWidth="2.2" />
      <path d="M-8 -36 h4 M4 -36 h4" stroke={look.accent} strokeWidth="0.6" opacity="0.7" />
    </g>
  )
}

function WorkJacket({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-2.4 -46 h4.8 l0.6 10 h-6 z" fill={look.shirt} />
      <rect x="-7.2" y="-38" width="5.2" height="4.2" rx="0.6" fill="#8a4816" />
      <path d="M-6.4 -36.6 h3.6" stroke={look.accent} strokeWidth="0.6" />
      <circle cx="0" cy="-34" r="0.7" fill="#2a211c" />
      <circle cx="0" cy="-30" r="0.7" fill="#2a211c" />
    </g>
  )
}

function Cardigan({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-2.6 -48 h5.2 l0.5 14 h-6.2 z" fill={look.shirt} />
      <path d="M-10 -30 q10 4 20 0" fill="none" stroke={look.accent} strokeWidth="0.8" />
    </g>
  )
}

function Hoodie({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-12 -46 q2 -8 12 -8 q10 0 12 8 l-2 6 h-20 z" fill={look.topShade} />
      <path d="M-4 -44 q4 6 8 0" fill="none" stroke={look.accent} strokeWidth="1.1" />
      <path d="M-6 -34 h12 v5 h-12 z" fill={look.topShade} />
      <rect x="-4.2" y="-46" width="8.4" height="3.2" rx="1.4" fill="#1a1218" />
    </g>
  )
}

function Polo({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-3.4 -49 L-1.2 -44 h2.4 l2.2 -5" fill="none" stroke="#f3e6dc" strokeWidth="1.5" />
      <path d="M-2 -43 h4" stroke="#f3e6dc" strokeWidth="0.8" />
      {look.belt ? <path d="M-8 -26 h16 v2.4 h-16 z" fill="#1a2830" /> : null}
      {look.belt ? <rect x="5" y="-26.2" width="3.2" height="3" rx="0.4" fill={brand.colors.gold} /> : null}
    </g>
  )
}

function Creative({ look }: { look: Look }) {
  return (
    <g>
      <path d="M-4 -47 Q0 -40 4 -47 L3 -34 Q0 -31 -3 -34 Z" fill={look.shirt} />
      <path d="M-2.2 -42 h4.4 M-1.4 -39 h2.8" stroke={look.accent} strokeWidth="0.8" />
      <circle cx="-8" cy="-38" r="1.5" fill={brand.colors.gold} />
      <circle cx="8" cy="-36" r="1.3" fill={brand.colors.orange} />
    </g>
  )
}

function Head({ look }: { look: Look }) {
  return (
    <g className="head">
      <path d="M-3.2 -50 h6.4 l0.6 6 h-7.6 z" fill={look.skin} />
      <circle cx="0" cy="-60" r="9.2" fill={look.skin} />
      <ellipse cx="-3.2" cy="-58" rx="3.4" ry="4.2" fill="rgba(0,0,0,0.08)" />
      <Hair look={look} />
      <ellipse cx="7.4" cy="-58" rx="1.7" ry="2.4" fill={look.skin} />
      <ellipse cx="-2.5" cy="-60.2" rx="1.7" ry="1.15" fill="#fffaf6" />
      <ellipse cx="2.3" cy="-60.2" rx="1.7" ry="1.15" fill="#fffaf6" />
      <circle cx="-2" cy="-60.1" r="0.85" fill="#241810" />
      <circle cx="2.8" cy="-60.1" r="0.85" fill="#241810" />
      <circle cx="-1.7" cy="-60.4" r="0.28" fill="#fff" />
      <circle cx="3.1" cy="-60.4" r="0.28" fill="#fff" />
      <path d="M-4.2 -62.4 q1.6 -1.2 3.2 0" fill="none" stroke="#3a241c" strokeWidth="0.7" />
      <path d="M1.2 -62.4 q1.6 -1.2 3.2 0" fill="none" stroke="#3a241c" strokeWidth="0.7" />
      <path d="M0.2 -59.2 q1.2 1.4 1.6 2.4" fill="none" stroke="rgba(90,50,40,0.45)" strokeWidth="0.6" />
      <path d="M-2.4 -55.6 q2.4 1.8 5 0" fill="none" stroke="#8a4038" strokeWidth="0.8" strokeLinecap="round" />
      {look.outfit === 'vp' ? <path d="M-2.6 -55.4 q2.6 1.5 5.2 0" stroke="#a84858" strokeWidth="0.9" fill="none" /> : null}
      {look.glasses ? (
        <g fill="none" stroke="#241820" strokeWidth="0.9">
          <circle cx="-2.4" cy="-60" r="2.5" />
          <circle cx="2.6" cy="-60" r="2.5" />
          <path d="M0 -60 h0.4" />
        </g>
      ) : null}
      {look.headset ? (
        <g fill="none" stroke="#1a2830" strokeWidth="1.3">
          <path d="M-8 -64 q0 -8 8 -8 q8 0 8 8" />
          <rect x="6.2" y="-62" width="3.2" height="4.4" rx="1" fill="#1a2830" stroke="none" />
        </g>
      ) : null}
      {look.outfit === 'vp' ? <circle cx="8.2" cy="-57" r="1.15" fill={look.accent} /> : null}
      {look.outfit === 'creative' ? <path d="M4 -68 l3 -1.5 l-1 3 z" fill={look.accent} /> : null}
    </g>
  )
}

function Hair({ look }: { look: Look }) {
  const hair = look.hair
  if (look.hairStyle === 'ceo') {
    return (
      <g>
        <path d="M-9.2 -60 Q-10 -74 0 -75.5 Q10 -74 9.2 -60 Q5 -66 0 -66.5 Q-5 -66 -9.2 -60" fill={hair} />
        <path d="M-8.4 -64 Q-9 -60 -6.2 -57" fill="#c8c2ba" />
        <path d="M8.2 -64 Q9 -60 6 -57" fill="#c8c2ba" />
        <path d="M-1 -74.5 q2 -2 3.2 1" fill="none" stroke="#3a342c" strokeWidth="0.6" />
      </g>
    )
  }
  if (look.hairStyle === 'twist') {
    return (
      <g>
        <path d="M-9 -61 Q-8.5 -76 1 -76.5 Q11 -74 8.6 -60 Q2 -67 -9 -61" fill={hair} />
        <ellipse cx="-1.5" cy="-74" rx="4.2" ry="3.2" fill={hair} />
        <circle cx="-1.2" cy="-74.5" r="1.1" fill={look.accent} />
      </g>
    )
  }
  if (look.hairStyle === 'bun') {
    return (
      <g>
        <path d="M-9 -60 Q-9 -74 0 -75 Q9 -73 8.4 -60 Q4 -66 0 -66 Q-5 -66 -9 -60" fill={hair} />
        <circle cx="-6.5" cy="-70" r="3.3" fill={hair} />
      </g>
    )
  }
  if (look.hairStyle === 'crop') {
    return <path d="M-8.6 -61 Q-8 -70 0 -71 Q8 -70 8.4 -61 Q4 -65 0 -65 Q-4 -65 -8.6 -61" fill={hair} />
  }
  if (look.hairStyle === 'swept') {
    return (
      <path d="M-9 -60 Q-10 -73 1 -76 Q12 -74 10 -62 Q12 -58 8 -57 Q4 -66 -2 -65 Q-6 -64 -9 -60" fill={hair} />
    )
  }
  if (look.hairStyle === 'messy') {
    return (
      <g>
        <path d="M-9 -60 Q-10 -72 0 -74 Q8 -76 9 -62 Q6 -66 2 -64 Q-2 -68 -6 -63 Q-8 -64 -9 -60" fill={hair} />
        <path d="M-2 -74 l2 -4 l2 4 M3 -73 l3 -3 l1 4" fill={hair} />
      </g>
    )
  }
  if (look.hairStyle === 'bob') {
    return (
      <g>
        <path d="M-10 -58 Q-11 -76 0 -77 Q11 -75 10 -58 Q9 -50 6 -50 Q4 -60 0 -61 Q-4 -60 -6 -50 Q-9 -50 -10 -58" fill={hair} />
        <path d="M2 -74 Q6 -78 8 -70" fill={look.accent} />
      </g>
    )
  }
  return <path d="M-8.8 -60 Q-9 -72 0 -73 Q9 -72 8.6 -60 Q4 -65 0 -65 Q-4 -65 -8.8 -60" fill={hair} />
}
