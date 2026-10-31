import type { ReactNode } from 'react'
import { brand } from '../brand.tsx'
import { poly, project, tilePoints, type Vec } from './motion.ts'

export type Furnishing = { key: string; depth: number; node: ReactNode }

const BOOK = ['#E4396E', '#F79521', '#FEBD63', '#f6f1e8', '#8d3a55', '#2f6d58', '#d7cdc4', '#6b3a2a']

export function furnishings(): Furnishing[] {
  const items: Furnishing[] = []
  const add = (key: string, x: number, y: number, node: ReactNode) => {
    items.push({ key, depth: x + y, node })
  }

  add('lib-shelf-a', 0.7, 1.7, <Bookcase key="lsa" x={0.55} y={0.55} />)
  add('lib-shelf-b', 0.7, 3.3, <Bookcase key="lsb" x={0.55} y={2.15} />)
  add('lib-chair-a', 2.35, 4.55, <Armchair key="lca" x={2.35} y={4.55} />)
  add('lib-chair-b', 4.05, 4.85, <Armchair key="lcb" x={4.05} y={4.85} tone="gold" />)
  add('lib-table', 3.2, 3.7, <SideTable key="lst" x={3.15} y={3.35} book />)

  add('pan-counter', 2.2, 7.7, <Counter key="ctr" x={0.55} y={7.15} />)
  add('pan-fridge', 4.3, 7.9, <Fridge key="fr" x={3.85} y={7.2} />)
  add('pan-coffee', 1.7, 8.3, <CoffeeMachine key="cm" x={1.55} y={7.55} />)
  add('pan-table', 3.3, 10.2, <DiningSet key="din" x={3.15} y={9.85} />)

  add('lounge-sofa-n', 3.4, 14.9, <Sofa key="lsn" x={3.3} y={14.55} seats={3} />)
  add('lounge-sofa-s', 3.4, 16.6, <Sofa key="lss" x={3.35} y={16.15} seats={3} />)
  add('lounge-table', 3.4, 15.6, <CoffeeTable key="lct" x={3.2} y={15.35} />)

  add('rest-sofa-n', 12.1, 14.95, <Sofa key="rsn" x={12.1} y={14.5} seats={3} />)
  add('rest-sofa-s', 12.2, 16.55, <Sofa key="rss" x={12.15} y={16.1} seats={2} />)
  add('rest-table', 13.9, 15.7, <CoffeeTable key="rct" x={13.55} y={15.35} />)

  add('gym-tread', 16.85, 15.9, <Treadmill key="tr" x={16.85} y={15.55} />)
  add('gym-rack', 19.55, 15.95, <DumbbellRack key="dr" x={19.55} y={15.35} />)
  add('gym-bench', 22.35, 16.3, <WeightBench key="wb" x={22.15} y={15.85} />)

  add('conf-table', 22.2, 10.4, <ConferenceTable key="conf" />)

  add('jv-shelf', 24.6, 1.5, <Bookcase key="jvs" x={24.55} y={0.7} tall />)
  add('vp-shelf', 16.7, 1.4, <Bookcase key="vps" x={16.6} y={0.65} />)

  add('rec-desk', 12.2, 19.7, <ReceptionDesk key="rec" x={11.15} y={18.85} />)

  const plants: Array<[string, number, number, number?]> = [
    ['p1', 0.7, 5.5, 0.9],
    ['p2', 6.3, 1.15, 0.85],
    ['p3', 15.5, 1.2, 0.8],
    ['p4', 20.2, 1.05, 0.9],
    ['p5', 24.9, 4.6, 0.85],
    ['p6', 17.2, 4.7, 0.8],
    ['p7', 6.5, 16.7, 0.9],
    ['p8', 14.3, 16.6, 0.75],
    ['p9', 24.6, 16.5, 0.8],
    ['p10', 10.4, 19.9, 0.7],
  ]
  for (const [key, x, y, scale] of plants) {
    add(key, x, y, <Plant x={x} y={y} scale={scale} kind={key === 'p4' || key === 'p6' ? 'snake' : 'leaf'} />)
  }

  add('lamp-lounge', 0.85, 13.5, <FloorLamp x={0.75} y={13.35} />)
  add('lamp-rest', 14.2, 13.5, <FloorLamp x={14.15} y={13.4} />)
  add('pendant-conf', 22, 9.2, <Pendant x={21.8} y={8.7} />)
  add('pendant-pantry', 3.2, 10, <Pendant x={3.2} y={9.7} />)
  add('pendant-rec', 12.4, 19.2, <Pendant x={12.3} y={18.7} />)
  add('frame-work', 8.4, 0.35, <Frame x={8.2} y={0.15} />)
  add('frame-work-b', 12.2, 0.35, <Frame x={12.1} y={0.15} hue="pink" />)
  add('frame-rest', 14.15, 13.3, <Frame x={14.05} y={13.2} hue="gold" />)

  return items
}

export function DeskTop({
  x,
  y,
  w,
  d,
  h = 20,
  wood = '#6a4632',
  edge = '#3a261c',
}: {
  x: number
  y: number
  w: number
  d: number
  h?: number
  wood?: string
  edge?: string
}) {
  const nw = project(x, y)
  const ne = project(x + w, y)
  const se = project(x + w, y + d)
  const sw = project(x, y + d)
  const up = (p: Vec, lift = h) => ({ x: p.x, y: p.y - lift })
  const legs = [nw, ne, se, sw]
  return (
    <g className="furn desk-top">
      {legs.map((foot, index) => (
        <line
          key={index}
          x1={foot.x}
          y1={foot.y}
          x2={up(foot, h - 4).x}
          y2={up(foot, h - 4).y}
          stroke="#2a211c"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}
      <polygon points={poly([up(sw, h - 4), up(se, h - 4), up(se), up(sw)])} fill={edge} />
      <polygon points={poly([up(se, h - 4), up(ne, h - 4), up(ne), up(se)])} fill="#4a3024" />
      <polygon points={poly([up(nw), up(ne), up(se), up(sw)])} fill={wood} />
      <polygon points={poly([up(nw, h + 1.4), up(ne, h + 1.4), up(se, h + 0.2), up(sw, h + 0.2)])} fill="rgba(255,255,255,0.08)" />
    </g>
  )
}

export function Blotter({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  return (
    <polygon
      points={tilePoints(x, y, w, d)}
      fill="#1d3a32"
      opacity="0.85"
      transform={`translate(0 ${-h})`}
    />
  )
}

export function Monitor({
  x,
  y,
  color,
  wide = false,
  lift = 0,
}: {
  x: number
  y: number
  color: string
  wide?: boolean
  lift?: number
}) {
  const p = project(x, y)
  const w = wide ? 34 : 24
  return (
    <g className="furn" transform={`translate(${p.x} ${p.y - lift})`}>
      <ellipse cx="0" cy="0" rx={wide ? 10 : 7} ry="3" fill="#2a241c" />
      <rect x="-1.4" y={-16} width="2.8" height="16" fill="#3a342c" />
      <rect x={-w / 2} y={-34} width={w} height={wide ? 20 : 16} rx="2" fill="#120e14" stroke="#3a342c" />
      <rect x={-w / 2 + 2} y={-31} width={w - 4} height={wide ? 14 : 11} rx="1" fill={color} className="screen-glow" />
    </g>
  )
}

export function Keyboard({ x, y, lift = 0 }: { x: number; y: number; lift?: number }) {
  const p = project(x, y)
  return (
    <g className="furn" transform={`translate(${p.x} ${p.y - lift})`}>
      <rect x="-9" y="-4" width="16" height="6" rx="1" fill="#2c2832" transform="skewX(-18)" />
      <path d="M-7 -2 h10 M-7 0 h10" stroke="#4a4454" strokeWidth="0.6" />
      <ellipse cx="11" cy="1" rx="2.4" ry="1.5" fill="#3a3444" />
    </g>
  )
}

export function OfficeChair({ x, y, exec = false }: { x: number; y: number; exec?: boolean }) {
  const p = project(x, y)
  const back = exec ? 40 : 30
  return (
    <g className="furn chair" data-prop={exec ? 'exec-chair' : 'office-chair'} transform={`translate(${p.x} ${p.y})`}>
      <ellipse cx="0" cy="2" rx="12" ry="4.5" fill="rgba(0,0,0,0.28)" />
      {[-8, -3, 3, 8].map((cx) => (
        <ellipse key={cx} cx={cx} cy={cx > 0 ? 3 : 1} rx="2.1" ry="1.2" fill="#1a1c22" />
      ))}
      <path d="M-11 1 L0 -5 L11 1 L0 6 Z" fill="#23262e" />
      <rect x="-1.1" y={-12} width="2.2" height="10" fill="#3a3e48" />
      <path d="M-11 -12 L0 -18 L12 -11 L1 -6 Z" fill={exec ? '#3a2434' : '#3a3144'} />
      <path d="M-7 -12 L0 -16 L8 -11 L1 -8 Z" fill={exec ? '#5a3450' : '#4a3c56'} />
      <path
        d={`M-16 -12 Q-18 ${-back} 0 ${-back - 6} Q18 ${-back} 16 -12 Q0 -4 -16 -12`}
        fill={exec ? '#241820' : '#2a2433'}
      />
      <path
        d={`M-11 -14 Q-12 ${-back + 8} 0 ${-back} Q12 ${-back + 8} 11 -14 Q0 -8 -11 -14`}
        fill={exec ? '#5c3a4e' : '#3a3148'}
      />
      {exec ? (
        <g>
          <path d="M-13 -16 q-2 6 1 8" fill="none" stroke="#3a2434" strokeWidth="2.4" />
          <path d="M13 -14 q2 6 -1 8" fill="none" stroke="#3a2434" strokeWidth="2.4" />
          {[-3, 0, 3].map((dot) => (
            <circle key={dot} cx={dot} cy={-back + 8} r="0.7" fill={brand.colors.gold} />
          ))}
        </g>
      ) : null}
    </g>
  )
}

function Sofa({ x, y, seats }: { x: number; y: number; seats: number }) {
  const p = project(x, y)
  const w = seats === 3 ? 78 : 54
  return (
    <g className="furn" data-prop="sofa" transform={`translate(${p.x} ${p.y})`}>
      <ellipse cx="0" cy="4" rx={w / 2} ry="8" fill="rgba(0,0,0,0.25)" />
      <path d={`M${-w / 2} 2 L0 -8 L${w / 2} 2 L0 10 Z`} fill="#2a1824" />
      <path d={`M${-w / 2 + 8} -2 L0 -10 L${w / 2 - 8} -2 L0 4 Z`} fill="#4a2840" />
      {Array.from({ length: seats }, (_, index) => {
        const cx = -w / 2 + 16 + index * ((w - 20) / seats)
        return (
          <g key={index}>
            <ellipse cx={cx} cy="-6" rx="11" ry="6" fill="#5a3050" />
            <ellipse cx={cx} cy="-9" rx="9" ry="4.5" fill="#6e3a5c" />
            <rect x={cx - 7} y={-28} width="14" height="16" rx="4" fill="#3a2034" />
            <rect x={cx - 5} y={-26} width="10" height="12" rx="3" fill={index === 1 ? '#6a3058' : '#4a2844'} />
          </g>
        )
      })}
      <path d={`M${-w / 2 - 4} -4 q-4 8 2 12`} fill="none" stroke="#3a2034" strokeWidth="5" strokeLinecap="round" />
      <path d={`M${w / 2 + 4} -2 q4 8 -2 12`} fill="none" stroke="#3a2034" strokeWidth="5" strokeLinecap="round" />
      <rect x={-8} y={-22} width="10" height="8" rx="2" fill={brand.colors.gold} opacity="0.85" transform="rotate(-8)" />
    </g>
  )
}

function CoffeeTable({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="coffee-table" transform={`translate(${p.x} ${p.y})`}>
      <line x1="-16" y1="4" x2="-14" y2="-8" stroke="#3a2a22" strokeWidth="2" />
      <line x1="16" y1="2" x2="14" y2="-10" stroke="#3a2a22" strokeWidth="2" />
      <line x1="-6" y1="8" x2="-4" y2="-4" stroke="#3a2a22" strokeWidth="2" />
      <line x1="8" y1="7" x2="6" y2="-5" stroke="#3a2a22" strokeWidth="2" />
      <path d="M-20 -8 L4 -16 L24 -6 L0 2 Z" fill="#6a4632" />
      <path d="M-16 -8 L2 -14 L18 -6 L0 0 Z" fill="#8a5a3c" />
      <Cup local={{ x: -4, y: -10 }} />
      <rect x="6" y="-14" width="8" height="5" rx="0.6" fill={brand.colors.paper} transform="rotate(-12)" />
    </g>
  )
}

function SideTable({ x, y, book = false }: { x: number; y: number; book?: boolean }) {
  const p = project(x, y)
  return (
    <g className="furn" transform={`translate(${p.x} ${p.y})`}>
      <line x1="-8" y1="2" x2="-6" y2="-8" stroke="#3a2a22" strokeWidth="1.6" />
      <line x1="8" y1="2" x2="6" y2="-8" stroke="#3a2a22" strokeWidth="1.6" />
      <path d="M-12 -8 L2 -14 L14 -6 L0 0 Z" fill="#5a3a2c" />
      {book ? <rect x="-2" y="-16" width="8" height="5" rx="0.5" fill={brand.colors.paper} /> : <Cup local={{ x: 0, y: -12 }} />}
    </g>
  )
}

function Bookcase({ x, y, tall = false }: { x: number; y: number; tall?: boolean }) {
  const p = project(x, y)
  const shelves = tall ? 4 : 3
  return (
    <g className="furn" data-prop="bookshelf" transform={`translate(${p.x} ${p.y})`}>
      <path d="M-26 4 L-8 -8 L-8 -58 L-26 -46 Z" fill="#3a2a22" />
      <path d="M-8 -8 L18 -2 L18 -52 L-8 -58 Z" fill="#4a3428" />
      <path d="M18 -2 L24 2 L24 -48 L18 -52 Z" fill="#2a1e16" />
      {Array.from({ length: shelves }, (_, shelf) => {
        const y0 = -8 - shelf * 14
        return (
          <g key={shelf}>
            <path d={`M-24 ${y0} L-6 ${y0 - 8} L16 ${y0 - 4} L-2 ${y0 + 4} Z`} fill="#2a1c14" />
            {BOOK.map((color, index) => {
              const bx = -20 + index * 4.1
              const h = 8 + ((index + shelf) % 3)
              return <rect key={color + index} className="book" x={bx} y={y0 - h - 1} width="3.2" height={h} fill={color} />
            })}
          </g>
        )
      })}
    </g>
  )
}

function Armchair({ x, y, tone = 'plum' }: { x: number; y: number; tone?: 'plum' | 'gold' }) {
  const p = project(x, y)
  const back = tone === 'gold' ? '#6a5030' : '#4a2840'
  const pad = tone === 'gold' ? '#8a6840' : '#6a3858'
  return (
    <g className="furn" data-prop="armchair" transform={`translate(${p.x} ${p.y})`}>
      <line x1="-8" y1="2" x2="-7" y2="-8" stroke="#3a2a22" strokeWidth="1.8" />
      <line x1="8" y1="2" x2="7" y2="-8" stroke="#3a2a22" strokeWidth="1.8" />
      <line x1="-4" y1="6" x2="-3" y2="-4" stroke="#3a2a22" strokeWidth="1.8" />
      <line x1="5" y1="6" x2="4" y2="-4" stroke="#3a2a22" strokeWidth="1.8" />
      <path d="M-14 -6 L0 -14 L16 -5 L2 3 Z" fill={back} />
      <path d="M-8 -8 L0 -12 L10 -6 L2 -2 Z" fill={pad} />
      <path d="M-10 -10 Q-12 -32 0 -36 Q12 -32 10 -10 Q0 -4 -10 -10" fill={back} />
      <path d="M-6 -12 Q-7 -28 0 -30 Q7 -28 6 -12 Q0 -8 -6 -12" fill={pad} />
      <path d="M-16 -8 q-3 8 2 10" fill="none" stroke={back} strokeWidth="4" />
      <path d="M16 -6 q3 8 -2 10" fill="none" stroke={back} strokeWidth="4" />
    </g>
  )
}

function Counter({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="counter" transform={`translate(${p.x} ${p.y})`}>
      <path d="M-8 6 L46 -8 L58 -2 L4 14 Z" fill="#2a2420" />
      <path d="M-6 -2 L44 -16 L56 -8 L6 6 Z" fill="#3a322c" />
      <path d="M-2 -18 L48 -30 L62 -20 L12 -8 Z" fill="#6a5648" />
      <path d="M2 -20 L44 -30 L54 -22 L12 -12 Z" fill="#8a7260" />
      <path d="M8 -6 v-8 M28 -12 v-8" stroke={brand.colors.gold} strokeWidth="1.2" />
      <ellipse cx="24" cy="-24" rx="6" ry="2.4" fill="#c45a48" />
      <circle cx="22" cy="-26" r="2" fill="#e4396e" />
      <circle cx="26" cy="-27" r="1.6" fill="#f79521" />
    </g>
  )
}

function Fridge({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="fridge" transform={`translate(${p.x} ${p.y})`}>
      <rect x="-12" y="-48" width="24" height="48" rx="2" fill="#d5dbe4" />
      <rect x="-12" y="-48" width="24" height="16" rx="2" fill="#c5ced8" />
      <path d="M-12 -32 h24" stroke="#9aa6b4" strokeWidth="1" />
      <rect x="7" y="-42" width="1.6" height="8" rx="0.6" fill={brand.colors.gold} />
      <rect x="7" y="-26" width="1.6" height="12" rx="0.6" fill={brand.colors.gold} />
      <rect x="-12" y="-4" width="24" height="4" fill="#8b95a3" />
    </g>
  )
}

function CoffeeMachine({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="coffee-machine" transform={`translate(${p.x} ${p.y})`}>
      <rect x="-8" y="-22" width="16" height="20" rx="2" fill="#2a2428" />
      <rect x="-6" y="-28" width="8" height="8" rx="1" fill="#8ec8e8" opacity="0.85" />
      <rect x="-3" y="-16" width="6" height="4" rx="1" fill={brand.colors.orange} />
      <path d="M-1 -12 v4" stroke="#c8ccd4" strokeWidth="1.2" />
      <rect x="-3" y="-8" width="6" height="5" rx="1" fill={brand.colors.paper} />
      <path d="M0 -30 q2 -4 0 -6" fill="none" stroke="rgba(246,241,232,0.7)" strokeWidth="0.8" />
    </g>
  )
}

function DiningSet({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="dining-table" transform={`translate(${p.x} ${p.y})`}>
      <CafeChair local={{ x: -16, y: 6 }} />
      <CafeChair local={{ x: 14, y: 8 }} />
      <line x1="0" y1="4" x2="0" y2="-14" stroke="#4a3428" strokeWidth="3" />
      <ellipse cx="0" cy="-16" rx="20" ry="9" fill="#6a4632" />
      <ellipse cx="0" cy="-18" rx="16" ry="7" fill="#8a5e42" />
      <CafeChair local={{ x: -8, y: -24 }} />
      <CafeChair local={{ x: 10, y: -26 }} />
    </g>
  )
}

function CafeChair({ local }: { local: Vec }) {
  return (
    <g transform={`translate(${local.x} ${local.y})`}>
      <line x1="-4" y1="4" x2="-3" y2="-6" stroke="#5a4030" strokeWidth="1.3" />
      <line x1="4" y1="4" x2="3" y2="-6" stroke="#5a4030" strokeWidth="1.3" />
      <path d="M-5 -6 h10 l-1 4 h-8 z" fill="#6a4a38" />
      <path d="M-4 -8 h8 v8 h-8 z" fill="#5a4030" />
      <path d="M-3 -6 h6 M-3 -3 h6" stroke="#d7cdc4" strokeWidth="0.5" />
    </g>
  )
}

function Treadmill({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="treadmill" transform={`translate(${p.x} ${p.y})`}>
      <path d="M-22 4 L18 -6 L26 -2 L-14 8 Z" fill="#1c2128" />
      <path d="M-18 2 L16 -6 L22 -3 L-12 5 Z" fill="#2a313a" />
      <path className="tread-belt" d="M-16 1 L14 -6" stroke="#8b93a0" strokeWidth="2" strokeDasharray="4 3" />
      <rect x="10" y="-40" width="4" height="32" fill="#3a404a" />
      <rect x="18" y="-38" width="3" height="28" fill="#2a3038" />
      <path d="M8 -36 h16 v10 h-16 z" fill="#12161c" stroke={brand.colors.orange} />
      <rect x="10" y="-34" width="12" height="6" fill={brand.colors.gold} className="screen-glow" />
      <path d="M6 -28 h8" stroke="#8b93a0" strokeWidth="1.4" />
    </g>
  )
}

function DumbbellRack({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="dumbbell-rack" transform={`translate(${p.x} ${p.y})`}>
      <path d="M-16 4 L-6 -2 L-4 -28 L-14 -22 Z" fill="#2a2e36" />
      <path d="M14 2 L6 -4 L8 -30 L16 -24 Z" fill="#3a404a" />
      {[0, 1, 2].map((row) => (
        <g key={row} transform={`translate(0 ${-10 - row * 8})`}>
          <line x1="-12" y1="0" x2="12" y2="-2" stroke="#8b93a0" strokeWidth="2" />
          <circle cx="-12" cy="0" r={4 - row * 0.4} fill={row === 1 ? brand.colors.orange : '#1a1e24'} />
          <circle cx="12" cy="-2" r={4 - row * 0.4} fill={row === 1 ? brand.colors.gold : '#1a1e24'} />
        </g>
      ))}
    </g>
  )
}

function WeightBench({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="weight-bench" transform={`translate(${p.x} ${p.y})`}>
      <line x1="-18" y1="4" x2="-16" y2="-6" stroke="#2a2e36" strokeWidth="2" />
      <line x1="16" y1="2" x2="14" y2="-8" stroke="#2a2e36" strokeWidth="2" />
      <path d="M-20 -6 L16 -16 L22 -12 L-14 -2 Z" fill="#3a2a38" />
      <path d="M-14 -8 L12 -16 L16 -13 L-10 -5 Z" fill="#5a3a50" />
      <path d="M8 -18 v-14 M18 -20 v-12" stroke="#3a404a" strokeWidth="2" />
      <line x1="2" y1="-32" x2="24" y2="-36" stroke="#c8ccd4" strokeWidth="2.2" />
      <circle cx="2" cy="-32" r="5" fill="#1a1e24" stroke={brand.colors.orange} />
      <circle cx="24" cy="-36" r="5" fill="#1a1e24" stroke={brand.colors.gold} />
    </g>
  )
}

function ConferenceTable() {
  const p = project(21.6, 8.9)
  const seats = [
    [-34, 8],
    [30, 2],
    [-8, 18],
    [18, 16],
    [2, -30],
  ]
  return (
    <g className="furn" data-prop="conference-table" transform={`translate(${p.x} ${p.y})`}>
      {seats.map(([x, y], index) => (
        <g key={index} transform={`translate(${x} ${y})`}>
          <path d="M-8 2 L0 -4 L8 2 L0 6 Z" fill="#2a2433" />
          <path d="M-6 0 Q-7 -16 0 -18 Q7 -16 6 0 Q0 4 -6 0" fill="#3a3148" />
        </g>
      ))}
      <ellipse cx="0" cy="-8" rx="46" ry="20" fill="#241c30" />
      <ellipse cx="0" cy="-12" rx="40" ry="16" fill="#2e2440" stroke={brand.colors.pink} strokeWidth="1.4" />
    </g>
  )
}

function ReceptionDesk({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  const wall = project(x + 0.2, y - 0.85)
  return (
    <g className="furn" data-room="reception" data-prop="reception">
      <g transform={`translate(${wall.x} ${wall.y})`}>
        <rect x="-28" y="-46" width="70" height="36" rx="2" fill="#16121a" stroke={brand.colors.gold} />
        <image href={brand.logo.small} x="-22" y="-40" width="24" height="24" />
        <text x="8" y="-22" className="rec-sign">
          CREATE & REACH
        </text>
      </g>
      <g transform={`translate(${p.x} ${p.y})`}>
        <path d="M-30 6 Q-6 16 34 4 L28 -8 Q-4 6 -26 -6 Z" fill="#3a241c" />
        <path d="M-28 -4 Q-2 8 32 -4 L28 -12 Q0 0 -24 -12 Z" fill="#6a4632" />
        <path d="M-22 -10 Q0 -4 24 -12" fill="none" stroke={brand.colors.gold} strokeWidth="1" />
      </g>
    </g>
  )
}

export function Plant({
  x,
  y,
  scale = 1,
  kind = 'leaf',
}: {
  x: number
  y: number
  scale?: number
  kind?: 'leaf' | 'snake'
}) {
  const p = project(x, y)
  return (
    <g className="furn" data-prop="plant" transform={`translate(${p.x} ${p.y}) scale(${scale})`}>
      <ellipse cx="0" cy="2" rx="10" ry="4" fill="rgba(0,0,0,0.3)" />
      <path d="M-6 0 h12 l-1.4 8 h-9.2 z" fill="#3a2922" />
      <path d="M-5 0 h10 l-1 5 h-8 z" fill="#4a332c" />
      <ellipse cx="0" cy="-1" rx="5" ry="1.4" fill="#2a1c14" />
      {kind === 'snake' ? (
        <g>
          <path d="M-2 -2 q-6 -16 -1 -28 q2 12 1 28 z" fill="#1f4d40" />
          <path d="M1 -2 q4 -18 2 -30 q-1 12 -2 30 z" fill="#2f6d58" />
          <path d="M0 -2 q8 -14 6 -26 q-3 10 -6 26 z" fill="#3d8a70" />
        </g>
      ) : (
        <g>
          <ellipse cx="-6" cy="-12" rx="7" ry="4" fill="#1f4d40" transform="rotate(-30)" />
          <ellipse cx="6" cy="-14" rx="7" ry="4" fill="#2f6d58" transform="rotate(28)" />
          <ellipse cx="0" cy="-18" rx="6" ry="5" fill="#3d8a70" />
          <circle cx="1" cy="-16" r="2" fill="rgba(254,189,99,0.45)" />
        </g>
      )}
    </g>
  )
}

function FloorLamp({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn lamp-glow" data-prop="floor-lamp" transform={`translate(${p.x} ${p.y})`}>
      <ellipse cx="0" cy="2" rx="16" ry="6" fill={brand.colors.gold} opacity="0.16" />
      <rect x="-1.3" y="-36" width="2.6" height="36" fill="#3a3144" />
      <path d="M-8 -36 h16 l-3 8 h-10 z" fill={brand.colors.gold} />
    </g>
  )
}

function Pendant({ x, y }: { x: number; y: number }) {
  const p = project(x, y)
  return (
    <g className="furn lamp-glow" data-prop="pendant" transform={`translate(${p.x} ${p.y})`}>
      <line x1="0" y1="-8" x2="0" y2="-52" stroke="#d7cdc4" strokeWidth="0.7" />
      <path d="M-7 -8 h14 l-3 8 h-8 z" fill={brand.colors.orange} />
      <ellipse cx="0" cy="2" rx="14" ry="5" fill={brand.colors.orange} opacity="0.18" />
    </g>
  )
}

function Frame({ x, y, hue = 'orange' }: { x: number; y: number; hue?: 'orange' | 'pink' | 'gold' }) {
  const p = project(x, y)
  const color = hue === 'pink' ? brand.colors.pink : hue === 'gold' ? brand.colors.gold : brand.colors.orange
  return (
    <g className="furn" data-prop="frame" transform={`translate(${p.x} ${p.y - 36})`}>
      <rect x="-12" y="-16" width="24" height="18" rx="1" fill="#1a140e" stroke={brand.colors.gold} />
      <rect x="-9" y="-13" width="18" height="12" fill={color} opacity="0.75" />
      <path d="M-8 -4 l5 -6 4 4 3 -3 4 5 h-16 z" fill="#140c18" opacity="0.45" />
    </g>
  )
}

function Cup({ local }: { local: Vec }) {
  return (
    <g transform={`translate(${local.x} ${local.y})`}>
      <rect x="-2.4" y="-5" width="5" height="5" rx="1" fill={brand.colors.paper} />
      <rect x="-1.8" y="-4.2" width="3.6" height="1.6" fill={brand.colors.orange} />
    </g>
  )
}

export function SkylineWindow({
  x0,
  x1,
  marker,
  towers,
}: {
  x0: number
  x1: number
  marker: string
  towers: Array<{ t: number; w: number; h: number }>
}) {
  const a = project(x0, 0)
  const b = project(x1, 0)
  const at = (t: number, lift: number) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t - lift,
  })
  const quad = (low: number, high: number) => poly([at(0, high), at(1, high), at(1, low), at(0, low)])
  return (
    <g className="skyline-window" data-prop={marker}>
      <polygon points={quad(26, 78)} fill="#120c18" />
      <polygon points={quad(58, 78)} fill={brand.colors.pink} opacity="0.22" />
      <polygon points={quad(40, 62)} fill={brand.colors.orange} opacity="0.12" />
      <circle cx={at(0.78, 70).x} cy={at(0.78, 70).y} r="3.2" fill={brand.colors.gold} opacity="0.8" />
      {towers.map((tower) => (
        <polygon
          key={`${tower.t}-${tower.h}`}
          points={poly([
            at(tower.t, 26),
            at(tower.t + tower.w, 26),
            at(tower.t + tower.w, 26 + tower.h),
            at(tower.t, 26 + tower.h),
          ])}
          fill="#0c0a12"
        />
      ))}
      {towers.flatMap((tower) =>
        [0.25, 0.5, 0.75].flatMap((tx) =>
          [10, 22, 34].map((lift) => {
            const spot = at(tower.t + tower.w * tx, 30 + (lift % tower.h))
            return <rect key={`${tower.t}-${tx}-${lift}`} x={spot.x} y={spot.y} width="1.3" height="1.3" fill={lift === 22 ? brand.colors.pink : brand.colors.gold} />
          }),
        ),
      )}
      <polygon points={quad(26, 78)} fill="none" stroke={brand.colors.gold} strokeWidth="1.5" />
      <polyline points={poly([at(0.33, 26), at(0.33, 78)])} fill="none" stroke="rgba(254,189,99,0.45)" strokeWidth="0.8" />
      <polyline points={poly([at(0.66, 26), at(0.66, 78)])} fill="none" stroke="rgba(254,189,99,0.45)" strokeWidth="0.8" />
    </g>
  )
}

export function GlassPane({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const a = project(x0, y0)
  const b = project(x1, y1)
  const h = 58
  const mid = (lift: number) => poly([{ x: a.x, y: a.y - lift }, { x: b.x, y: b.y - lift }])
  return (
    <g className="glass-pane">
      <polygon
        points={poly([a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }])}
        fill="rgba(246,241,232,0.06)"
        stroke={brand.colors.gold}
        strokeWidth="1.4"
      />
      <polyline points={mid(20)} fill="none" stroke="rgba(254,189,99,0.35)" strokeWidth="0.7" />
      <polyline points={mid(40)} fill="none" stroke="rgba(254,189,99,0.35)" strokeWidth="0.7" />
      <polyline points={mid(h)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
    </g>
  )
}

export function DoorLeaf({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const a = project(x0, y0)
  const b = project(x1, y1)
  const open = { x: a.x + (b.x - a.x) * 0.72, y: a.y + (b.y - a.y) * 0.72 - 8 }
  return (
    <g className="furn" data-prop="door">
      <polygon points={poly([a, open, { x: open.x, y: open.y - 36 }, { x: a.x, y: a.y - 40 }])} fill="#1a140e" stroke={brand.colors.gold} strokeWidth="1" />
      <circle cx={(a.x + open.x) / 2} cy={(a.y + open.y) / 2 - 18} r="1.1" fill={brand.colors.gold} />
    </g>
  )
}

