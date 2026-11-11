import type { ReactNode } from 'react'
import type { AgentState, Teammate, Tenant } from './types.ts'
import { clockAngles } from './time.ts'

/* ---------- isometric helpers ---------- */
const S = 46
const C = 0.866
const W = 16 // room size along x (units)
const D = 11 // room size along y
const H = 3.3 // wall height
const OX = 60 + D * C * S
const OY = 175
type Pt = [number, number]
const P = (x: number, y: number, z = 0): Pt => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S]
const pts = (a: Pt[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)))
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function Box({ x, y, z = 0, w, d, h, color, top, left, right, stroke }: { x: number; y: number; z?: number; w: number; d: number; h: number; color: string; top?: string; left?: string; right?: string; stroke?: string }) {
  const t = top ?? shade(color, 0.12)
  const l = left ?? shade(color, -0.08)
  const r = right ?? shade(color, -0.22)
  const sw = stroke ? 0.8 : 0
  return (
    <g stroke={stroke} strokeWidth={sw} strokeLinejoin="round">
      <polygon points={pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={l} />
      <polygon points={pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)])} fill={r} />
      <polygon points={pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)])} fill={t} />
    </g>
  )
}

/** Draw children in a wall plane. plane 'back' = y=0 (u along +x), 'side' = x=0 (u along +y). Units: px, v grows downward from z=0. */
function Wall({ plane, children }: { plane: 'back' | 'side'; children: ReactNode }) {
  const [ex, ey] = plane === 'back' ? P(0, 0, 0) : P(0, D, 0)
  // side wall: u runs from the front corner (y = D) toward the back (y = 0) so text reads left to right
  const m = plane === 'back' ? `matrix(${C},0.5,0,1,${ex},${ey})` : `matrix(${C},-0.5,0,1,${ex},${ey})`
  return <g transform={m}>{children}</g>
}
/** Draw children flat on the floor (u along +x, v along +y), px units. */
function Floor({ children, z = 0 }: { children: ReactNode; z?: number }) {
  const [ex, ey] = P(0, 0, z)
  return <g transform={`matrix(${C},0.5,${-C},0.5,${ex},${ey})`}>{children}</g>
}

function wrap(text: string, max = 26, lines = 2) {
  const words = text.split(/\s+/)
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      out.push(cur.trim())
      cur = w
    } else cur = `${cur} ${w}`
  }
  if (cur.trim()) out.push(cur.trim())
  if (out.length > lines) {
    const kept = out.slice(0, lines)
    kept[lines - 1] = kept[lines - 1].replace(/.{0,2}$/, '') + '…'
    return kept
  }
  return out
}

/* ---------- furniture ---------- */
function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const [px, py] = P(x + 0.25 * s, y + 0.25 * s, 0.55 * s)
  return (
    <g>
      <Box x={x} y={y} w={0.5 * s} d={0.5 * s} h={0.55 * s} color="#C9895B" />
      <g fill="#3E9B5A">
        <ellipse cx={px - 10 * s} cy={py - 16 * s} rx={11 * s} ry={17 * s} transform={`rotate(-25 ${px - 10 * s} ${py - 16 * s})`} />
        <ellipse cx={px + 10 * s} cy={py - 18 * s} rx={10 * s} ry={18 * s} transform={`rotate(25 ${px + 10 * s} ${py - 18 * s})`} fill="#52B26C" />
        <ellipse cx={px} cy={py - 26 * s} rx={9 * s} ry={20 * s} fill="#2F8A4C" />
      </g>
    </g>
  )
}

function Sofa({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <Box x={x} y={y} w={3.2} d={0.35} h={1.0} color={shade(color, -0.1)} />
      <Box x={x} y={y + 0.35} w={0.35} d={1.1} h={0.75} color={shade(color, -0.05)} />
      <Box x={x + 0.35} y={y + 0.35} w={2.5} d={1.1} h={0.45} color={color} />
      <Box x={x + 2.85} y={y + 0.35} w={0.35} d={1.1} h={0.75} color={shade(color, -0.05)} />
    </g>
  )
}

/* ---------- people ---------- */
type DeskProps = { layer: 'base' | 'labels' | 'names'; mate: Teammate; state: AgentState | undefined; gx: number; gy: number; selected: boolean; onSelect: (slug: string) => void; primary: string; accent: string }

function Desk({ layer, mate, state, gx, gy, onSelect, selected, accent }: DeskProps) {
  const status = state?.status ?? 'offline'
  const w = 2.1, d = 1.0
  const deskTop = '#E9D2B0'
  const screen = status === 'working' ? '#7CC7FF' : status === 'waiting_on_jv' ? '#FFD08A' : status === 'idle' ? '#B9C6D3' : '#4B5563'
  const cx = gx + w / 2 - 0.32, cy = gy + d + 0.3
  const [hx, hy] = P(cx + 0.32, cy + 0.32, 1.42)
  const [bx, by] = P(cx + 0.32, cy + 0.32, 0.5)
  const present = status !== 'offline'
  const [tx, ty] = P(gx + w / 2, gy + d + 1.05, 0)
  const tagW = mate.name.length * 8 + 32
  const bubbleText = state?.currentTask && (status === 'working' || status === 'waiting_on_jv') ? wrap(state.currentTask) : null
  const bw = bubbleText ? Math.max(...bubbleText.map((l) => l.length)) * 6.9 + 26 : 0
  const bh = bubbleText ? bubbleText.length * 16 + 12 : 0
  const bubbleY = hy - 40 - bh
  const cls = `desk desk-${status}${selected ? ' desk-selected' : ''}`
  if (layer === 'names') {
    return (
      <g className={cls} onClick={() => onSelect(mate.slug)} style={{ cursor: 'pointer' }}>
        <title>{`${mate.name} · ${mate.role}`}</title>
        <g transform={`translate(${tx - tagW / 2} ${ty - 2})`}>
          <rect width={tagW} height={24} rx={12} fill="#fff" stroke={status === 'waiting_on_jv' ? accent : 'rgba(20,20,30,0.12)'} strokeWidth={status === 'waiting_on_jv' ? 1.6 : 1} filter="url(#tagShadow)" />
          <circle cx={14} cy={12} r={5} fill={present ? mate.color : '#B8BCC6'} />
          <text x={25} y={16.5} className="tag-text">{mate.name}</text>
        </g>
      </g>
    )
  }
  if (layer === 'labels') {
    return (
      <g className={cls} onClick={() => onSelect(mate.slug)} style={{ cursor: 'pointer' }}>
      {status === 'waiting_on_jv' && (
        <g className="alert" transform={`translate(${hx + 26} ${hy - 26})`}>
          <circle r={11} fill={accent} stroke="#fff" strokeWidth={2} />
          <text y={4.5} textAnchor="middle" className="alert-text">!</text>
        </g>
      )}
      {status === 'idle' && (
        <g transform={`translate(${hx + 18} ${hy - 20})`}>
          <circle r={9} fill="#22A06B" stroke="#fff" strokeWidth={2} />
          <path d="M -4 0 L -1 3 L 4 -3" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
        </g>
      )}
      {bubbleText && (
        <g transform={`translate(${hx - bw / 2} ${bubbleY})`}><g className="bubble">
          <rect width={bw} height={bh} rx={10} fill="#fff" stroke={status === 'waiting_on_jv' ? accent : 'rgba(20,20,30,0.12)'} filter="url(#tagShadow)" />
          <path d={`M ${bw / 2 - 7} ${bh - 0.5} L ${bw / 2} ${bh + 9} L ${bw / 2 + 7} ${bh - 0.5} Z`} fill="#fff" />
          {bubbleText.map((l, i) => (
            <text key={i} x={13} y={21 + i * 16} className="bubble-text">{l}</text>
          ))}
        </g></g>
      )}
      </g>
    )
  }
  return (
    <g className={cls} onClick={() => onSelect(mate.slug)} style={{ cursor: 'pointer' }}>
      <title>{`${mate.name} · ${mate.role}`}</title>
      {/* desk mat shadow */}
      <polygon points={pts([P(gx - 0.1, gy - 0.1), P(gx + w + 0.1, gy - 0.1), P(gx + w + 0.1, gy + d + 1.2), P(gx - 0.1, gy + d + 1.2)])} fill="rgba(0,0,0,0.05)" />
      {/* legs + top */}
      <Box x={gx} y={gy} w={0.08} d={d} h={0.72} color="#8A7560" />
      <Box x={gx + w - 0.08} y={gy} w={0.08} d={d} h={0.72} color="#8A7560" />
      <Box x={gx + 0.08} y={gy} w={w - 0.16} d={0.06} h={0.6} z={0.12} color="#B79C7E" />
      <Box x={gx} y={gy} z={0.72} w={w} d={d} h={0.07} color={deskTop} />
      {/* monitor */}
      <Box x={gx + w / 2 - 0.08} y={gy + 0.2} z={0.79} w={0.16} d={0.1} h={0.25} color="#2B2B33" />
      <Box x={gx + 0.45} y={gy + 0.18} z={1.0} w={1.2} d={0.07} h={0.68} color="#22232A" left={screen} />
      {/* keyboard + mug + small desk flag in teammate color */}
      <Box x={gx + 0.6} y={gy + 0.6} z={0.79} w={0.9} d={0.22} h={0.03} color="#F4F4F6" />
      {status === 'idle' && <Box x={gx + 1.7} y={gy + 0.55} z={0.79} w={0.14} d={0.14} h={0.16} color="#FFFFFF" />}
      <Box x={gx + 0.12} y={gy + 0.15} z={0.79} w={0.05} d={0.05} h={0.5} color="#777" />
      <polygon points={pts([P(gx + 0.15, gy + 0.17, 1.29), P(gx + 0.15, gy + 0.55, 1.19), P(gx + 0.15, gy + 0.17, 1.08)])} fill={mate.color} />
      {/* chair seat */}
      <Box x={cx} y={cy} z={0.42} w={0.64} d={0.62} h={0.09} color={shade(mate.color, -0.25)} />
      <Box x={cx + 0.28} y={cy + 0.27} w={0.08} d={0.08} h={0.42} color="#3A3A40" />
      {/* person (seen from behind) */}
      {present && (
        <g className="person">
          <rect x={bx - 15} y={by - 34} width={30} height={40} rx={13} fill={mate.color} />
          <circle cx={hx} cy={hy} r={10.5} fill={mate.skin} />
          <path d={`M ${hx - 11} ${hy + 2} A 11 11 0 0 1 ${hx + 11} ${hy + 2} Q ${hx} ${hy + 7} ${hx - 11} ${hy + 2} Z`} fill={mate.hair} />
          <circle cx={hx} cy={hy - 3} r={10.8} fill={mate.hair} clipPath={undefined} opacity={0.95} />
          {status === 'waiting_on_jv' && (
            <g className="hand-up">
              <path d={`M ${bx + 12} ${by - 26} Q ${bx + 26} ${by - 40} ${bx + 22} ${by - 64}`} stroke={mate.color} strokeWidth={7} strokeLinecap="round" fill="none" />
              <circle cx={bx + 22} cy={by - 66} r={5} fill={mate.skin} />
            </g>
          )}
        </g>
      )}
      {/* chair back (in front of the person) */}
      <Box x={cx} y={cy + 0.56} z={0.5} w={0.64} d={0.08} h={0.5} color={shade(mate.color, -0.3)} />
    </g>
  )
}

/* ---------- floor ---------- */
export function OfficeFloor({ tenant, agents, now, selected, onSelect }: { tenant: Tenant; agents: Record<string, AgentState>; now: Date; selected: string | null; onSelect: (slug: string) => void }) {
  const { brand } = tenant
  const mates = tenant.teammates
  const cols = 3
  const rows = Math.ceil(mates.length / cols)
  const rowGap = rows <= 2 ? 3.6 : 2.9
  const seats = mates.map((m, i) => ({ m, gx: 1.4 + (i % cols) * 4.0, gy: 1.7 + Math.floor(i / cols) * rowGap }))
  // painter's order: back to front
  const ordered = [...seats].sort((a, b) => a.gx + a.gy - (b.gx + b.gy))
  const clock = clockAngles(now, tenant.workspace.timezone)
  const wallSide = shade(brand.wall, -0.07)
  const slab = brand.primary
  const [clx, cly] = [12.6 * S, -2.35 * S]

  return (
    <svg viewBox="0 0 1200 830" className="office-svg" role="img" aria-label={`${tenant.workspace.name} floor`}>
      <defs>
        <filter id="tagShadow" x="-20%" y="-30%" width="140%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#1d1a24" floodOpacity="0.16" />
        </filter>
        <linearGradient id="win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE8FF" />
          <stop offset="1" stopColor="#9CC9F2" />
        </linearGradient>
        <pattern id="tiles" width="46" height="46" patternUnits="userSpaceOnUse">
          <rect width="46" height="46" fill={brand.floor} />
          <path d="M 46 0 L 0 0 0 46" fill="none" stroke={shade(brand.floor, -0.06)} strokeWidth="1" />
        </pattern>
      </defs>

      {/* slab */}
      <polygon points={pts([P(0, D, 0), P(W, D, 0), P(W, D, -0.35), P(0, D, -0.35)])} fill={shade(slab, -0.05)} />
      <polygon points={pts([P(W, 0, 0), P(W, D, 0), P(W, D, -0.35), P(W, 0, -0.35)])} fill={shade(slab, -0.3)} />
      {/* floor */}
      <Floor>
        <rect width={W * S} height={D * S} fill="url(#tiles)" />
        <rect x={1.0 * S} y={1.2 * S} width={11.6 * S} height={(rows * rowGap + 0.6) * S} rx={10} fill={shade(brand.floor, 0.35)} opacity={0.9} />
        <rect x={10.6 * S} y={8.0 * S} width={4.6 * S} height={2.6 * S} rx={14} fill={shade(brand.primary, 0.78)} />
        <polygon points={`${6.2 * S},0 ${8.6 * S},0 ${10.4 * S},${3.4 * S} ${8.0 * S},${3.4 * S}`} fill="#ffffff" opacity={0.28} />
      </Floor>

      {/* walls */}
      <polygon points={pts([P(0, 0, 0), P(0, D, 0), P(0, D, H), P(0, 0, H)])} fill={wallSide} />
      <polygon points={pts([P(0, 0, 0), P(W, 0, 0), P(W, 0, H), P(0, 0, H)])} fill={brand.wall} />
      <polygon points={pts([P(0, 0, H), P(W, 0, H), P(W, -0.25, H), P(-0.25, -0.25, H), P(-0.25, D, H), P(0, D, H)])} fill={shade(brand.wall, -0.18)} />
      {/* skirting */}
      <polygon points={pts([P(0, 0, 0), P(W, 0, 0), P(W, 0, 0.18), P(0, 0, 0.18)])} fill={shade(brand.wall, -0.12)} />
      <polygon points={pts([P(0, 0, 0), P(0, D, 0), P(0, D, 0.18), P(0, 0, 0.18)])} fill={shade(brand.wall, -0.2)} />

      {/* back wall: windows + clock */}
      <Wall plane="back">
        {[6.1, 8.5].map((x) => (
          <g key={x}>
            <rect x={x * S} y={-2.75 * S} width={2.1 * S} height={1.65 * S} fill="url(#win)" stroke="#fff" strokeWidth={5} />
            <line x1={(x + 1.05) * S} y1={-2.75 * S} x2={(x + 1.05) * S} y2={-1.1 * S} stroke="#fff" strokeWidth={4} />
            <line x1={x * S} y1={-1.92 * S} x2={(x + 2.1) * S} y2={-1.92 * S} stroke="#fff" strokeWidth={3} />
          </g>
        ))}
        <circle cx={clx} cy={cly} r={22} fill="#fff" stroke="#2B2B33" strokeWidth={3} />
        <line x1={clx} y1={cly} x2={clx + 11 * Math.sin((clock.hour * Math.PI) / 180)} y2={cly - 11 * Math.cos((clock.hour * Math.PI) / 180)} stroke="#2B2B33" strokeWidth={3} strokeLinecap="round" />
        <line x1={clx} y1={cly} x2={clx + 16 * Math.sin((clock.minute * Math.PI) / 180)} y2={cly - 16 * Math.cos((clock.minute * Math.PI) / 180)} stroke={brand.primary} strokeWidth={2} strokeLinecap="round" />
        {/* framed art */}
        <rect x={2.0 * S} y={-2.6 * S} width={1.3 * S} height={0.95 * S} fill={shade(brand.accent, 0.55)} stroke="#2B2B33" strokeWidth={3} />
        <circle cx={2.45 * S} cy={-2.2 * S} r={9} fill={brand.primary} />
        <path d={`M ${2.05 * S} ${-1.7 * S} L ${2.7 * S} ${-2.15 * S} L ${3.25 * S} ${-1.7 * S} Z`} fill={brand.accent} />
      </Wall>

      {/* side wall: sign + board */}
      <Wall plane="side">
        <rect x={7.3 * S} y={-2.85 * S} width={2.6 * S} height={1.5 * S} rx={4} fill="#F7E7C6" stroke="#B08A5A" strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={(7.45 + (i % 3) * 0.8) * S} y={(-2.7 + Math.floor(i / 3) * 0.65) * S} width={0.55 * S} height={0.45 * S} fill={[brand.gold, '#9AD3F5', '#F6A6C1', '#B7E4A8', brand.gold, '#F6A6C1'][i]} />
        ))}
        <image href={brand.logo} x={1.9 * S} y={-3.0 * S} width={0.85 * S} height={0.85 * S} />
        <text x={2.95 * S} y={-2.5 * S} className="wall-sign">{tenant.workspace.officeSign}</text>
        <text x={2.97 * S} y={-2.15 * S} className="wall-sub">{tenant.platform.name}</text>
        <rect x={2.97 * S} y={-2.02 * S} width={3.4 * S} height={4} fill={brand.primary} />
      </Wall>

      {/* back-wall furniture: pantry */}
      <Box x={12.6} y={0.15} w={3.1} d={0.9} h={1.0} color="#E8E2DA" top="#C9B9A6" />
      <Box x={13.0} y={0.25} z={1.0} w={0.45} d={0.4} h={0.55} color="#2E2E36" />
      <Box x={14.2} y={0.3} z={1.0} w={0.6} d={0.3} h={0.25} color={brand.accent} />
      {/* bookshelf on side wall */}
      <Box x={0.12} y={8.2} w={0.55} d={2.3} h={2.1} color="#9C7A57" />
      {[0.5, 1.05, 1.6].map((z, i) => (
        <polygon key={z} points={pts([P(0.68, 8.35, z), P(0.68, 10.35, z), P(0.68, 10.35, z + 0.35), P(0.68, 8.35, z + 0.35)])} fill={[brand.primary, brand.accent, '#5B8DEF'][i]} opacity={0.85} />
      ))}
      <Plant x={0.3} y={0.3} s={1.15} />

      {/* desks back-to-front */}
      {ordered.map(({ m, gx, gy }) => (
        <Desk key={m.slug} layer="base" mate={m} state={agents[m.slug]} gx={gx} gy={gy} onSelect={onSelect} selected={selected === m.slug} primary={brand.primary} accent={brand.accent} />
      ))}

      {/* lounge */}
      <Sofa x={11.4} y={8.3} color={shade(brand.primary, -0.15)} />
      <Box x={12.1} y={10.0} w={1.6} d={0.55} h={0.35} color="#C9A57D" />
      <Plant x={15.2} y={10.3} s={1.1} />
      <Plant x={14.9} y={1.5} s={0.9} />
      {ordered.map(({ m, gx, gy }) => (
        <Desk key={`l-${m.slug}`} layer="labels" mate={m} state={agents[m.slug]} gx={gx} gy={gy} onSelect={onSelect} selected={selected === m.slug} primary={brand.primary} accent={brand.accent} />
      ))}
      {ordered.map(({ m, gx, gy }) => (
        <Desk key={`n-${m.slug}`} layer="names" mate={m} state={agents[m.slug]} gx={gx} gy={gy} onSelect={onSelect} selected={selected === m.slug} primary={brand.primary} accent={brand.accent} />
      ))}
    </svg>
  )
}
