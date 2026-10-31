import { brand } from '../brand.tsx'
import { poly, project } from './motion.ts'

export function agentColor(slug: string): string {
  if (slug in brand.agents) return brand.agents[slug as keyof typeof brand.agents]
  return brand.colors.gold
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
        points={poly([
          { x: a.x, y: a.y - h },
          { x: b.x, y: b.y - h },
        ])}
        fill="none"
        stroke={lip}
        strokeWidth="2.5"
      />
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
