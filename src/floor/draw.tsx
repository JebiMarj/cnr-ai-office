import { brand } from '../brand.tsx'
import { poly, project, type Vec } from './motion.ts'

export function agentColor(slug: string): string {
  if (slug in brand.agents) return brand.agents[slug as keyof typeof brand.agents]
  return brand.colors.gold
}

export function Prism({
  x,
  y,
  w,
  d,
  h,
  top,
  south,
  east,
}: {
  x: number
  y: number
  w: number
  d: number
  h: number
  top: string
  south: string
  east: string
}) {
  const nw = project(x, y)
  const ne = project(x + w, y)
  const se = project(x + w, y + d)
  const sw = project(x, y + d)
  const up = (p: Vec) => ({ x: p.x, y: p.y - h })
  return (
    <g>
      <polygon points={poly([sw, se, up(se), up(sw)])} fill={south} />
      <polygon points={poly([se, ne, up(ne), up(se)])} fill={east} />
      <polygon points={poly([up(nw), up(ne), up(se), up(sw)])} fill={top} />
    </g>
  )
}

export function Wall({
  x0,
  y0,
  x1,
  y1,
  h,
  fill,
  lip,
}: {
  x0: number
  y0: number
  x1: number
  y1: number
  h: number
  fill: string
  lip: string
}) {
  const a = project(x0, y0)
  const b = project(x1, y1)
  return (
    <g>
      <polygon points={poly([a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }])} fill={fill} />
      <polyline
        points={poly([{ x: a.x, y: a.y - h }, { x: b.x, y: b.y - h }])}
        fill="none"
        stroke={lip}
        strokeWidth="2.5"
      />
    </g>
  )
}

export function Plant({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const p = project(x, y)
  return (
    <g transform={`translate(${p.x} ${p.y}) scale(${scale})`}>
      <ellipse cx="0" cy="1" rx="11" ry="4.5" fill="rgba(0,0,0,0.35)" />
      <path d="M-5 -2 h10 l-1.5 9 h-7 z" fill="#3a2926" />
      <path d="M-4 -1 h8 l-1 6 h-6 z" fill="#4a332c" />
      <circle cx="-6" cy="-14" r="7" fill="#1f4d40" />
      <circle cx="6" cy="-15" r="7.5" fill="#2f6d58" />
      <circle cx="0" cy="-20" r="8" fill="#3d8a70" />
      <circle cx="1" cy="-18" r="3" fill="rgba(254,189,99,0.35)" />
    </g>
  )
}

export function Figure({ slug, color }: { slug: string; color: string }) {
  if (slug === 'mechanicus' || slug === 'tech') return <Robot slug={slug} color={color} />
  return <Human slug={slug} color={color} />
}

function Human({ slug, color }: { slug: string; color: string }) {
  const tall = slug === 'jv'
  const bodyTop = tall ? -40 : -36
  return (
    <g>
      <ellipse cx="0" cy="2" rx="13" ry="5" fill="rgba(0,0,0,0.42)" />
      <path d="M-7 1 l-1.4 -15 h5.2 L-2 1 z" fill="#1a1422" />
      <path d="M2 1 l1.2 -15 h5.2 L8.2 1 z" fill="#120e16" />
      <path d={`M-12 -15 L-8 ${bodyTop} h16 L12 -15 z`} fill={color} />
      <path d="M-3 -15 l3 -18 3 18 z" fill="rgba(8,6,10,0.28)" />
      {slug === 'jv' ? <path d="M-1.2 -32 h2.4 l1 16 h-4.4 z" fill={brand.colors.gold} /> : null}
      {slug === 'alex' ? <rect x="8" y="-32" width="7" height="10" rx="1.2" fill={brand.colors.paper} opacity="0.9" /> : null}
      {slug === 'dev' ? (
        <g>
          <path d="M-11 -34 q0 -10 11 -12 q11 2 11 12" fill={color} />
          <rect x="-6" y="-28" width="12" height="7" rx="1.5" fill="#140c12" />
          <path d="M-4 -25 h8" stroke={brand.colors.gold} strokeWidth="1.2" />
        </g>
      ) : null}
      {slug === 'sage' ? (
        <g stroke={brand.colors.ink} strokeWidth="1.3" fill="none">
          <circle cx="-3.2" cy="-46" r="2.3" />
          <circle cx="3.2" cy="-46" r="2.3" />
          <path d="M-1 -46 h2" />
        </g>
      ) : null}
      {slug === 'gia' ? <circle cx="8" cy="-52" r="3.2" fill={brand.colors.pink} /> : null}
      <circle cx="0" cy={tall ? -50 : -46} r={tall ? 9.2 : 8.4} fill="#f3d2b8" />
      <path
        d={`M-8 ${tall ? -50 : -46} q1 -12 8 -12 q7 0 8 12 q-2 -5 -8 -5 q-6 0 -8 5z`}
        fill={slug === 'gia' ? '#6a2a3e' : slug === 'sage' ? '#d8d2cc' : '#2a1c24'}
      />
      {slug === 'sage' ? <path d="M-7 -54 q7 -8 14 0" fill="none" stroke="#d8d2cc" strokeWidth="2" /> : null}
    </g>
  )
}

function Robot({ slug, color }: { slug: string; color: string }) {
  const eye = slug === 'mechanicus' ? brand.colors.pink : brand.colors.gold
  return (
    <g>
      <ellipse cx="0" cy="2" rx="13" ry="5" fill="rgba(0,0,0,0.42)" />
      <rect x="-8" y="-14" width="6" height="14" rx="1.5" fill="#1a1422" />
      <rect x="2" y="-14" width="6" height="14" rx="1.5" fill="#120e16" />
      <rect x="-13" y="-38" width="26" height="24" rx="4" fill={color} />
      <rect x="-9" y="-33" width="18" height="7" rx="2" fill="#120c14" />
      <circle cx="-3.5" cy="-29.5" r="1.6" fill={eye} />
      <circle cx="3.5" cy="-29.5" r="1.6" fill={eye} />
      <rect x="-7" y="-50" width="14" height="12" rx="2" fill="#221c2a" stroke={color} strokeWidth="1" />
      {slug === 'mechanicus' ? (
        <g>
          <path d="M7 -50 v-10" stroke={color} strokeWidth="1.6" />
          <circle cx="7" cy="-62" r="2.4" fill={brand.colors.pink} />
          <circle cx="-14" cy="-30" r="4" fill="none" stroke={brand.colors.ink} strokeWidth="1.4" />
          <path d="M-14 -34 v8 M-18 -30 h8" stroke={brand.colors.ink} strokeWidth="1.2" />
        </g>
      ) : (
        <path d="M12 -22 l6 4 -6 3" fill="none" stroke={brand.colors.paper} strokeWidth="1.6" strokeLinejoin="round" />
      )}
    </g>
  )
}

export function NameTag({
  x,
  y,
  name,
  text,
  waiting,
  status,
}: {
  x: number
  y: number
  name: string
  text: string
  waiting: boolean
  status: string
}) {
  const width = Math.max(76, Math.min(128, Math.max(name.length, Math.min(text.length, 22)) * 6.2 + 28))
  const anchor = project(x, y)
  return (
    <g transform={`translate(${anchor.x} ${anchor.y - 50})`} className={waiting ? 'name-tag is-waiting' : 'name-tag'}>
      <rect x={-width / 2} y={-20} width={width} height={30} rx="8" />
      <circle cx={-width / 2 + 12} cy="-6" r="3" className="tag-dot" data-status={status} />
      <text y="-4" textAnchor="middle" className="tag-name">
        {name}
      </text>
      <text y="8" textAnchor="middle" className="tag-task">
        {text}
      </text>
    </g>
  )
}
