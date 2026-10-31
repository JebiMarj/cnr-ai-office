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
  const boss = slug === 'jv'
  const bodyTop = boss ? -46 : -34
  const shoulder = boss ? 15 : 12
  return (
    <g>
      <ellipse cx="0" cy="2" rx={boss ? 16 : 12} ry="5" fill="rgba(0,0,0,0.45)" />
      <path d="M-7 1 l-1.6 -14 h5.4 L-1.6 1 z" fill="#1a1422" />
      <path d="M2 1 l1.4 -14 h5.2 L8.4 1 z" fill="#120e16" />
      <path d={`M-${shoulder} -14 L-${shoulder - 4} ${bodyTop} h${(shoulder - 4) * 2} L${shoulder} -14 z`} fill={color} />
      {boss ? (
        <g>
          <path d="M-2.2 -40 h4.4 l1.2 24 h-6.8 z" fill={brand.colors.gold} />
          <path d="M-16 -30 h6 v3 h-6 z M10 -30 h6 v3 h-6 z" fill={brand.colors.gold} />
          <path d="M-6 -58 h12 l-1.5 4 h-9 z" fill={brand.colors.gold} />
        </g>
      ) : null}
      {slug === 'alex' ? (
        <g>
          <rect x="9" y="-30" width="8" height="12" rx="1.2" fill={brand.colors.paper} />
          <path d="M10.5 -27 h5 M10.5 -24 h5 M10.5 -21 h3" stroke={brand.colors.ink} strokeWidth="0.8" />
        </g>
      ) : null}
      {slug === 'dev' ? (
        <g>
          <path d="M-13 -32 q1 -14 13 -15 q12 1 13 15 v4 h-26 z" fill={color} />
          <rect x="-7" y="-26" width="14" height="6" rx="2" fill="#120c14" />
          <path d="M-4 -23 h8" stroke={brand.colors.gold} strokeWidth="1.3" />
        </g>
      ) : null}
      {slug === 'sage' ? <path d="M-14 -16 l4 -22 h20 l4 22" fill="none" stroke={brand.colors.paper} strokeWidth="1.4" opacity="0.7" /> : null}
      <circle cx="0" cy={boss ? -56 : -44} r={boss ? 10 : 8.2} fill={slug === 'sage' ? '#efe6dc' : '#f3d2b8'} />
      <path
        d={`M-${boss ? 9 : 8} ${boss ? -56 : -44} q1 -13 ${boss ? 9 : 8} -13 q${boss ? 8 : 7} 0 ${boss ? 9 : 8} 13 q-2 -5 -${boss ? 9 : 8} -5 q-6 0 -${boss ? 9 : 8} 5z`}
        fill={slug === 'gia' ? '#7a2344' : slug === 'sage' ? '#f4f0ea' : slug === 'alex' ? '#3a241c' : '#241820'}
      />
      {slug === 'gia' ? <circle cx="9" cy="-54" r="3.4" fill={brand.colors.pink} /> : null}
      {slug === 'sage' ? (
        <g fill="none" stroke="#241820" strokeWidth="1.2">
          <circle cx="-3.4" cy="-44" r="2.4" />
          <circle cx="3.4" cy="-44" r="2.4" />
          <path d="M-1 -44 h2" />
        </g>
      ) : null}
    </g>
  )
}

function Robot({ slug, color }: { slug: string; color: string }) {
  const builder = slug === 'mechanicus'
  return (
    <g>
      <ellipse cx="0" cy="2" rx="14" ry="5" fill="rgba(0,0,0,0.45)" />
      {builder ? (
        <g>
          <rect x="-9" y="-12" width="7" height="13" rx="1" fill="#1a1422" />
          <rect x="2" y="-12" width="7" height="13" rx="1" fill="#120e16" />
          <path d="M0 -16 l14 -22 h-28 z" fill={color} />
          <rect x="-11" y="-16" width="22" height="6" fill="#120c14" />
          <circle cx="-4" cy="-13" r="1.7" fill={brand.colors.pink} />
          <circle cx="4" cy="-13" r="1.7" fill={brand.colors.pink} />
          <path d="M0 -38 v-12" stroke={color} strokeWidth="2" />
          <circle cx="0" cy="-52" r="3" fill={brand.colors.pink} />
          <circle cx="-16" cy="-24" r="5" fill="none" stroke={brand.colors.ink} strokeWidth="1.5" />
          <path d="M-16 -28 v8 M-20 -24 h8" stroke={brand.colors.ink} strokeWidth="1.2" />
        </g>
      ) : (
        <g>
          <rect x="-10" y="-10" width="8" height="11" rx="1" fill="#1a1422" />
          <rect x="2" y="-10" width="8" height="11" rx="1" fill="#120e16" />
          <rect x="-14" y="-32" width="28" height="22" rx="3" fill={color} />
          <rect x="-8" y="-26" width="16" height="6" rx="1" fill="#120c14" />
          <circle cx="-3" cy="-23" r="1.5" fill={brand.colors.gold} />
          <circle cx="3" cy="-23" r="1.5" fill={brand.colors.gold} />
          <rect x="-6" y="-42" width="12" height="10" rx="2" fill="#2a241c" stroke={color} />
          <path d="M14 -18 l8 2 -2 4 -8 -2 z" fill={brand.colors.paper} />
          <path d="M16 -16 h6" stroke={brand.colors.ink} strokeWidth="1.2" />
        </g>
      )}
    </g>
  )
}

export function FloorChip({
  x,
  y,
  w,
  h,
  name,
  role,
  task,
  status,
  expanded,
  kind,
  slug,
}: {
  x: number
  y: number
  w: number
  h: number
  name: string
  role: string
  task: string
  status: string
  expanded: boolean
  kind: 'person' | 'desk'
  slug: string
}) {
  return (
    <g
      className={expanded ? 'floor-chip is-open' : 'floor-chip'}
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
      data-floor-label={`${kind}:${slug}`}
      data-open={expanded ? 'true' : 'false'}
    >
      <rect className="chip-bg" width={w} height={h} rx="8" />
      <circle cx="10" cy={expanded ? 12 : 9} r="3.2" className="tag-dot" data-status={status} />
      <text x={w / 2 + 4} y={expanded ? 15 : 13} textAnchor="middle" className="tag-name">
        {name}
      </text>
      <text x={w / 2} y={expanded ? 28 : -8} textAnchor="middle" className="label-detail">
        {role}
      </text>
      <text x={w / 2} y={expanded ? 40 : -20} textAnchor="middle" className="label-detail">
        {task}
      </text>
    </g>
  )
}
