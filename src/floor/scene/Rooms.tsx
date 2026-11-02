import { useEffect, useMemo, useState } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Shape,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from 'three'
import { brand } from '../../brand.tsx'
import { facingForSpot } from './facing.ts'
import {
  CONF_SEATS,
  MEETING_TABLE,
  deskNameplates,
  deskPoint,
  poseView,
  seatsIn,
  type FloorAgent,
  type Pose,
} from '../motion.ts'
import { accent, night } from './palette.ts'
import { useOfficeMaps, useTiled, type OfficeMaps } from './textures.ts'

const H = 2.62
const T = 0.16
const NORTH = ['alex', 'sage', 'dev'] as const
const SOUTH = ['mechanicus', 'tech', 'gia'] as const
const POD_COLOR = [accent.pink, accent.orange, accent.light]

type Opening = { at: number; span: number; sill: number; head: number; frosted?: boolean }

export function OfficeWorld({ agents }: { agents: FloorAgent[] }) {
  const maps = useOfficeMaps()
  const offline = new Set(agents.filter((agent) => agent.status === 'offline').map((agent) => agent.slug))
  return (
    <group>
      <Floors maps={maps} />
      <Shell city={maps.city} plaster={maps.plaster} />
      <WorkPods offline={offline} />
      <ExecutiveOffice slug="jv" dim={offline.has('jv')} />
      <ExecutiveOffice slug="marj" dim={offline.has('marj')} />
      <Kitchen />
      <Storage />
      <Restroom />
      <MeetingRoom />
      <Lounge rug={maps.rug} />
      <ReadingNook />
      <Decor />
      <CeilingCans />
    </group>
  )
}

function Floors({ maps }: { maps: OfficeMaps }) {
  const oak = useTiled(maps.oak, 16.3 / 1.7, 12.05 / 1.7)
  const carpet = useTiled(maps.carpet, 6.5 / 0.62, 4.15 / 0.62)
  const kitchen = useTiled(maps.tile, 3.2 / 0.42, 4.15 / 0.42)
  const bath = useTiled(maps.tile, 1.55 / 0.38, 2.55 / 0.38)
  return (
    <group>
      <mesh position={[8.2, -0.08, 6.15]} receiveShadow>
        <boxGeometry args={[16.95, 0.16, 12.65]} />
        <meshStandardMaterial color={night.woodEdge} roughness={0.72} />
      </mesh>
      <mesh position={[8.2, 0.012, 6.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16.3, 12.05]} />
        <meshStandardMaterial color={night.wood} map={oak ?? undefined} roughness={0.58} metalness={0.02} />
      </mesh>
      <mesh position={[4.15, 0.02, 8.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 4.15]} />
        <meshStandardMaterial color={night.carpet} map={carpet ?? undefined} roughness={0.94} />
      </mesh>
      <mesh position={[10.6, 0.022, 2.35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.2, 4.15]} />
        <meshStandardMaterial color="#f7f5f1" map={kitchen ?? undefined} roughness={0.28} metalness={0.04} />
      </mesh>
      <mesh position={[15.35, 0.022, 1.55]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.55, 2.55]} />
        <meshStandardMaterial color="#f7f5f1" map={bath ?? undefined} roughness={0.28} metalness={0.04} />
      </mesh>
    </group>
  )
}

function Shell({ city, plaster }: { city: Texture | null; plaster: Texture | null }) {
  return (
    <group>
      <WallRun
        axis="x"
        x={0}
        z={0}
        length={16.4}
        outside={-1}
        city={city}
        plaster={plaster}
        openings={[
          { at: 2.55, span: 3.1, sill: 0.9, head: 2.2 },
          { at: 7.2, span: 2.05, sill: 0.9, head: 2.2 },
          { at: 10.55, span: 2.15, sill: 0.9, head: 2.2 },
          { at: 15.35, span: 0.7, sill: 1.4, head: 2.05, frosted: true },
        ]}
      />
      <WallRun
        axis="z"
        x={0}
        z={0}
        length={12.2}
        outside={-1}
        city={city}
        plaster={plaster}
        openings={[
          { at: 2.25, span: 2.5, sill: 0.9, head: 2.2 },
          { at: 8.7, span: 4.3, sill: 0.9, head: 2.2 },
        ]}
      />
      <WallRun
        axis="z"
        x={16.26}
        z={0}
        length={12.2}
        outside={1}
        city={city}
        plaster={plaster}
        openings={[
          { at: 1.45, span: 0.7, sill: 1.4, head: 2.05, frosted: true },
          { at: 4.85, span: 2.1, sill: 0.9, head: 2.2 },
          { at: 9.5, span: 3.1, sill: 0.9, head: 2.2 },
        ]}
      />
      <WallRun
        axis="x"
        x={0}
        z={12.06}
        length={11.2}
        outside={1}
        city={city}
        plaster={plaster}
        openings={[
          { at: 2.5, span: 3.2, sill: 0.9, head: 2.2 },
          { at: 7.3, span: 2.5, sill: 0.9, head: 2.2 },
        ]}
      />
      <WallRun
        axis="x"
        x={13.35}
        z={12.06}
        length={3.05}
        outside={1}
        city={city}
        plaster={plaster}
        openings={[{ at: 1.65, span: 1.45, sill: 0.9, head: 2.2 }]}
      />
      <Inner plaster={plaster} />
    </group>
  )
}

function WallRun({
  axis,
  x,
  z,
  length,
  outside,
  openings,
  city,
  plaster,
}: {
  axis: 'x' | 'z'
  x: number
  z: number
  length: number
  outside: 1 | -1
  openings: Opening[]
  city: Texture | null
  plaster: Texture | null
}) {
  const sorted = [...openings].sort((a, b) => a.at - b.at)
  const solids: Array<{ from: number; to: number }> = []
  let cursor = 0
  for (const opening of sorted) {
    const start = Math.max(0, opening.at - opening.span / 2)
    const end = Math.min(length, opening.at + opening.span / 2)
    if (start > cursor + 0.02) solids.push({ from: cursor, to: start })
    cursor = Math.max(cursor, end)
  }
  if (cursor < length - 0.02) solids.push({ from: cursor, to: length })
  return (
    <group>
      {solids.map((seg) => (
        <group key={`${seg.from}-${seg.to}`}>
          <WallBox axis={axis} x={x} z={z} from={seg.from} to={seg.to} y0={0} y1={H} plaster={plaster} />
          <Skirt axis={axis} x={x} z={z} from={seg.from} to={seg.to} outside={outside} />
        </group>
      ))}
      {sorted.map((opening) => (
        <group key={`win-${opening.at}`}>
          <WallBox axis={axis} x={x} z={z} from={opening.at - opening.span / 2} to={opening.at + opening.span / 2} y0={0} y1={opening.sill} plaster={plaster} />
          <WallBox axis={axis} x={x} z={z} from={opening.at - opening.span / 2} to={opening.at + opening.span / 2} y0={opening.head} y1={H} plaster={plaster} />
          <Skirt axis={axis} x={x} z={z} from={opening.at - opening.span / 2} to={opening.at + opening.span / 2} outside={outside} />
          <WindowInsert axis={axis} x={x} z={z} at={opening.at} span={opening.span} sill={opening.sill} head={opening.head} outside={outside} city={city} frosted={opening.frosted} />
        </group>
      ))}
    </group>
  )
}

function alongPosition(axis: 'x' | 'z', x: number, z: number, along: number, y: number): [number, number, number] {
  if (axis === 'x') return [x + along, y, z + T / 2]
  return [x + T / 2, y, z + along]
}

function WallBox({
  axis,
  x,
  z,
  from,
  to,
  y0,
  y1,
  plaster,
}: {
  axis: 'x' | 'z'
  x: number
  z: number
  from: number
  to: number
  y0: number
  y1: number
  plaster: Texture | null
}) {
  const len = to - from
  const h = y1 - y0
  if (len < 0.03 || h < 0.03) return null
  const mid = (from + to) / 2
  const args: [number, number, number] = axis === 'x' ? [len, h, T] : [T, h, len]
  return (
    <mesh position={alongPosition(axis, x, z, mid, (y0 + y1) / 2)} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={night.wall} map={plaster ?? undefined} roughness={0.9} />
    </mesh>
  )
}

function Skirt({
  axis,
  x,
  z,
  from,
  to,
  outside,
}: {
  axis: 'x' | 'z'
  x: number
  z: number
  from: number
  to: number
  outside: 1 | -1
}) {
  const len = to - from
  if (len < 0.04) return null
  const mid = (from + to) / 2
  const inset = -outside * 0.025
  const pos: [number, number, number] =
    axis === 'x' ? [x + mid, 0.06, z + T / 2 + inset] : [x + T / 2 + inset, 0.06, z + mid]
  const args: [number, number, number] = axis === 'x' ? [len, 0.12, T + 0.05] : [T + 0.05, 0.12, len]
  return (
    <mesh position={pos} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={night.skirting} roughness={0.68} />
    </mesh>
  )
}

function WindowInsert({
  axis,
  x,
  z,
  at,
  span,
  sill,
  head,
  outside,
  city,
  frosted,
}: {
  axis: 'x' | 'z'
  x: number
  z: number
  at: number
  span: number
  sill: number
  head: number
  outside: 1 | -1
  city: Texture | null
  frosted?: boolean
}) {
  const y = (sill + head) / 2
  const h = head - sill
  const mid = alongPosition(axis, x, z, at, y)
  const spin: [number, number, number] = axis === 'z' ? [0, Math.PI / 2, 0] : [0, 0, 0]
  const cityPos: [number, number, number] =
    axis === 'x'
      ? [x + at, y, outside < 0 ? z - 0.04 : z + T + 0.04]
      : [outside < 0 ? x - 0.04 : x + T + 0.04, y, z + at]
  return (
    <group>
      {!frosted && city ? (
        <mesh position={cityPos} rotation={spin}>
          <planeGeometry args={[span * 1.08, h * 1.08]} />
          <meshStandardMaterial map={city} emissive="#ffd2a4" emissiveMap={city} emissiveIntensity={0.95} roughness={0.45} side={DoubleSide} />
        </mesh>
      ) : null}
      <mesh position={mid} rotation={spin}>
        <planeGeometry args={[span - 0.06, h - 0.06]} />
        <meshStandardMaterial
          color={frosted ? '#e6eef3' : night.glass}
          transparent
          opacity={frosted ? 0.72 : 0.2}
          roughness={0.05}
          metalness={0.04}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={alongPosition(axis, x, z, at, head)}>
        <boxGeometry args={axis === 'x' ? [span + 0.08, 0.05, T + 0.03] : [T + 0.03, 0.05, span + 0.08]} />
        <meshStandardMaterial color={night.trim} roughness={0.45} />
      </mesh>
      <mesh position={alongPosition(axis, x, z, at, sill)}>
        <boxGeometry args={axis === 'x' ? [span + 0.08, 0.05, T + 0.04] : [T + 0.04, 0.05, span + 0.08]} />
        <meshStandardMaterial color={night.trim} roughness={0.45} />
      </mesh>
      <mesh position={alongPosition(axis, x, z, at - span / 2, y)}>
        <boxGeometry args={axis === 'x' ? [0.045, h, T + 0.03] : [T + 0.03, h, 0.045]} />
        <meshStandardMaterial color={night.trim} />
      </mesh>
      <mesh position={alongPosition(axis, x, z, at + span / 2, y)}>
        <boxGeometry args={axis === 'x' ? [0.045, h, T + 0.03] : [T + 0.03, h, 0.045]} />
        <meshStandardMaterial color={night.trim} />
      </mesh>
    </group>
  )
}

function Inner({ plaster }: { plaster: Texture | null }) {
  return (
    <group>
      <Wall x={5.6} z={0.2} w={T} d={4.6} plaster={plaster} glass />
      <Wall x={0.2} z={4.8} w={1.4} d={T} plaster={plaster} />
      <Wall x={3.2} z={4.8} w={2.4} d={T} plaster={plaster} />
      <Lintel x={1.6} z={4.8} w={1.6} d={T} plaster={plaster} />
      <Door x={2.15} z={4.8} yaw={0} />
      <Wall x={5.6} z={4.8} w={1.0} d={T} plaster={plaster} />
      <Wall x={7.7} z={4.8} w={1.2} d={T} plaster={plaster} />
      <Lintel x={6.6} z={4.8} w={1.1} d={T} plaster={plaster} />
      <Door x={7.15} z={4.8} yaw={0} />
      <Wall x={8.9} z={4.6} w={0.7} d={T} plaster={plaster} />
      <Wall x={11.3} z={4.6} w={1.0} d={T} plaster={plaster} />
      <Lintel x={9.6} z={4.6} w={1.7} d={T} plaster={plaster} />
      <Door x={10.45} z={4.6} yaw={0} />
      <Wall x={12.3} z={0.2} w={T} d={2.8} plaster={plaster} />
      <Wall x={12.3} z={3.05} w={T} d={1.2} plaster={plaster} glass />
      <Wall x={12.3} z={5.35} w={T} d={1.25} plaster={plaster} glass />
      <Lintel x={12.3} z={4.25} w={T} d={1.1} plaster={plaster} />
      <Door x={12.3} z={4.7} yaw={Math.PI / 2} />
      <Wall x={12.3} z={6.6} w={3.9} d={T} plaster={plaster} glass />
      <Wall x={16.12} z={3.05} w={T} d={3.55} plaster={plaster} glass />
      <Wall x={14.5} z={0.2} w={T} d={2.6} plaster={plaster} />
      <Wall x={14.5} z={2.95} w={0.7} d={T} plaster={plaster} />
      <Wall x={15.7} z={2.95} w={0.55} d={T} plaster={plaster} />
      <Lintel x={15.05} z={2.95} w={0.7} d={T} plaster={plaster} />
      <Door x={15.35} z={2.95} yaw={0} />
      <Lintel x={11.2} z={12.06} w={2.15} d={T} plaster={plaster} />
      <Door x={12.25} z={12.06} yaw={0} open />
    </group>
  )
}

function Wall({
  x,
  z,
  w,
  d,
  plaster,
  glass = false,
}: {
  x: number
  z: number
  w: number
  d: number
  plaster: Texture | null
  glass?: boolean
}) {
  const proudX = w > d ? 0 : 0.04
  const proudZ = d > w ? 0 : 0.04
  return (
    <group>
      <mesh position={[x + w / 2, H / 2, z + d / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
        {glass ? (
          <meshStandardMaterial color={night.glass} transparent opacity={0.18} roughness={0.05} metalness={0.04} />
        ) : (
          <meshStandardMaterial color={night.wall} map={plaster ?? undefined} roughness={0.9} />
        )}
      </mesh>
      {glass ? (
        <mesh position={[x + w / 2, 0.05, z + d / 2]}>
          <boxGeometry args={[w, 0.1, d]} />
          <meshStandardMaterial color={night.metal} metalness={0.65} roughness={0.3} />
        </mesh>
      ) : (
        <mesh position={[x + w / 2, 0.06, z + d / 2]} receiveShadow>
          <boxGeometry args={[w + proudX, 0.12, d + proudZ]} />
          <meshStandardMaterial color={night.skirting} roughness={0.68} />
        </mesh>
      )}
    </group>
  )
}

function Lintel({ x, z, w, d, plaster }: { x: number; z: number; w: number; d: number; plaster: Texture | null }) {
  return (
    <mesh position={[x + w / 2, 2.38, z + d / 2]} castShadow receiveShadow>
      <boxGeometry args={[w, 0.48, d]} />
      <meshStandardMaterial color={night.wall} map={plaster ?? undefined} roughness={0.9} />
    </mesh>
  )
}

function Door({ x, z, yaw, open = false }: { x: number; z: number; yaw: number; open?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <group rotation={[0, open ? 1.15 : 0.2, 0]}>
        <mesh position={[0.4, 1.05, 0]} castShadow>
          <boxGeometry args={[0.78, 2.08, 0.045]} />
          <meshStandardMaterial color="#d7b07c" roughness={0.52} />
        </mesh>
        <mesh position={[0.4, 1.48, 0.026]}>
          <boxGeometry args={[0.4, 0.72, 0.012]} />
          <meshStandardMaterial color={night.glass} transparent opacity={0.35} roughness={0.06} />
        </mesh>
        <mesh position={[0.68, 1.02, 0.03]}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <meshStandardMaterial color={accent.light} metalness={0.7} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

function WorkPods({ offline }: { offline: Set<string> }) {
  return (
    <group>
      {NORTH.map((slug, index) => (
        <Pod key={slug} slug={slug} color={POD_COLOR[index]!} facing={0} dim={offline.has(slug)} />
      ))}
      {SOUTH.map((slug, index) => (
        <Pod key={slug} slug={slug} color={POD_COLOR[index]!} facing={Math.PI} dim={offline.has(slug)} />
      ))}
      {NORTH.map((slug, index) => {
        const feet = deskPoint(slug, false)
        const color = POD_COLOR[index]!
        return (
          <mesh key={`divider-${slug}`} position={[feet.x, 1.06, 7.72]} castShadow>
            <boxGeometry args={[1.28, 0.5, 0.04]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.16} roughness={0.46} />
          </mesh>
        )
      })}
      <mesh position={[4.0, 1.28, 7.72]}>
        <boxGeometry args={[4.5, 0.02, 0.015]} />
        <meshStandardMaterial color={accent.pink} emissive={accent.pink} emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function Pod({ slug, color, facing, dim }: { slug: string; color: string; facing: number; dim: boolean }) {
  const feet = deskPoint(slug, false)
  const south = facing === 0
  const deskZ = feet.y + (south ? 0.55 : -0.55)
  return (
    <group>
      <mesh position={[feet.x, 0.74, deskZ]} castShadow receiveShadow>
        <boxGeometry args={[1.42, 0.06, 0.72]} />
        <meshStandardMaterial color="#d7b07a" roughness={0.5} />
      </mesh>
      <mesh position={[feet.x - 0.66, 0.38, deskZ]}>
        <boxGeometry args={[0.06, 0.72, 0.64]} />
        <meshStandardMaterial color="#b8894f" roughness={0.6} />
      </mesh>
      <mesh position={[feet.x + 0.66, 0.38, deskZ]}>
        <boxGeometry args={[0.06, 0.72, 0.64]} />
        <meshStandardMaterial color="#b8894f" roughness={0.6} />
      </mesh>
      <mesh position={[feet.x, 0.782, deskZ + (south ? -0.14 : 0.14)]}>
        <boxGeometry args={[0.34, 0.016, 0.13]} />
        <meshStandardMaterial color="#2a3036" roughness={0.45} />
      </mesh>
      <mesh position={[feet.x + 0.28, 0.786, deskZ + (south ? -0.12 : 0.12)]}>
        <boxGeometry args={[0.055, 0.012, 0.085]} />
        <meshStandardMaterial color="#3c434c" />
      </mesh>
      <Monitor x={feet.x} y={1.04} z={deskZ + (south ? 0.24 : -0.24)} yaw={south ? Math.PI : 0} color={color} dim={dim} />
      <TaskChair x={feet.x} z={feet.y} yaw={facing} accentColor={color} />
    </group>
  )
}

function Monitor({
  x,
  y,
  z,
  yaw,
  color,
  dim,
}: {
  x: number
  y: number
  z: number
  yaw: number
  color: string
  dim: boolean
}) {
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <group rotation={[-0.4, 0, 0]}>
      <mesh position={[0, 0, -0.02]} castShadow>
        <boxGeometry args={[0.52, 0.32, 0.025]} />
        <meshStandardMaterial color="#1c2128" metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[0.46, 0.26]} />
        <meshStandardMaterial color={dim ? '#2a2824' : '#122033'} emissive={dim ? '#000000' : color} emissiveIntensity={dim ? 0 : 0.7} />
      </mesh>
      <mesh position={[0, -0.2, -0.02]}>
        <boxGeometry args={[0.07, 0.08, 0.05]} />
        <meshStandardMaterial color="#2c333b" metalness={0.45} roughness={0.4} />
      </mesh>
      </group>
    </group>
  )
}

function TaskChair({ x, z, yaw, accentColor }: { x: number; z: number; yaw: number; accentColor: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <StarBase />
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.48, 0.07, 0.46]} />
        <meshStandardMaterial color="#2c3138" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.78, -0.2]} castShadow>
        <boxGeometry args={[0.44, 0.48, 0.06]} />
        <meshStandardMaterial color="#262c34" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.98, -0.2]}>
        <boxGeometry args={[0.46, 0.045, 0.07]} />
        <meshStandardMaterial color={accentColor} roughness={0.42} />
      </mesh>
      <mesh position={[-0.24, 0.56, -0.02]}>
        <boxGeometry args={[0.04, 0.035, 0.26]} />
        <meshStandardMaterial color="#2a3038" />
      </mesh>
      <mesh position={[0.24, 0.56, -0.02]}>
        <boxGeometry args={[0.04, 0.035, 0.26]} />
        <meshStandardMaterial color="#2a3038" />
      </mesh>
    </group>
  )
}

function StarBase() {
  return (
    <group>
      {Array.from({ length: 5 }, (_, index) => (
        <group key={index} rotation={[0, (index * Math.PI * 2) / 5, 0]}>
          <mesh position={[0, 0.075, 0.15]} rotation={[0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.028, 0.018, 0.2]} />
            <meshStandardMaterial color="#6a737c" metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.04, 0.24]}>
            <sphereGeometry args={[0.026, 10, 8]} />
            <meshStandardMaterial color="#22262c" roughness={0.55} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.028, 0.034, 0.32, 10]} />
        <meshStandardMaterial color="#d5dbe2" metalness={0.72} roughness={0.22} />
      </mesh>
    </group>
  )
}

function ExecutiveOffice({ slug, dim }: { slug: 'jv' | 'marj'; dim: boolean }) {
  const feet = deskPoint(slug, slug === 'jv')
  const boss = slug === 'jv'
  const deskZ = feet.y - 0.9
  return (
    <group>
      <mesh position={[feet.x, 0.74, deskZ]} castShadow receiveShadow>
        <boxGeometry args={[boss ? 1.9 : 1.55, 0.06, 0.82]} />
        <meshStandardMaterial color="#d7b07a" roughness={0.48} />
      </mesh>
      <mesh position={[feet.x, 0.38, deskZ]}>
        <boxGeometry args={[boss ? 1.75 : 1.4, 0.68, 0.74]} />
        <meshStandardMaterial color="#c9955a" roughness={0.58} />
      </mesh>
      <Monitor x={feet.x - 0.28} y={1.08} z={deskZ - 0.28} yaw={0} color={boss ? accent.pink : accent.orange} dim={dim} />
      {boss ? <Monitor x={feet.x + 0.32} y={1.08} z={deskZ - 0.28} yaw={0} color={accent.orange} dim={dim} /> : null}
      <mesh position={[feet.x + 0.05, 0.782, deskZ + 0.12]}>
        <boxGeometry args={[0.32, 0.015, 0.12]} />
        <meshStandardMaterial color="#2a3036" />
      </mesh>
      <ExecChair x={feet.x} z={feet.y} yaw={Math.PI} color={boss ? '#241c18' : '#4a2438'} />
      {boss ? <Bookcase x={4.55} z={0.58} /> : <Credenza x={6.15} z={0.55} />}
      {boss ? (
        <group>
          <SideChair x={1.35} z={3.2} yaw={Math.PI} />
          <SideChair x={2.95} z={3.2} yaw={Math.PI} />
        </group>
      ) : (
        <SideChair x={7.15} z={3.35} yaw={Math.PI} />
      )}
    </group>
  )
}

function ExecChair({ x, z, yaw, color }: { x: number; z: number; yaw: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <StarBase />
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.54, 0.09, 0.52]} />
        <meshStandardMaterial color={color} roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.92, -0.22]} castShadow>
        <boxGeometry args={[0.52, 0.72, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[-0.28, 0.62, 0]}>
        <boxGeometry args={[0.05, 0.04, 0.32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.28, 0.62, 0]}>
        <boxGeometry args={[0.05, 0.04, 0.32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

function SideChair({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.18, 0.24, 0.16]}>
            <boxGeometry args={[0.04, 0.48, 0.04]} />
            <meshStandardMaterial color="#c9955a" />
          </mesh>
          <mesh position={[side * 0.18, 0.24, -0.16]}>
            <boxGeometry args={[0.04, 0.48, 0.04]} />
            <meshStandardMaterial color="#c9955a" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.46, 0.06, 0.46]} />
        <meshStandardMaterial color="#4a342c" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.76, -0.2]} castShadow>
        <boxGeometry args={[0.46, 0.48, 0.06]} />
        <meshStandardMaterial color="#3a2a24" roughness={0.55} />
      </mesh>
    </group>
  )
}

function Bookcase({ x, z }: { x: number; z: number }) {
  const spines = [accent.pink, accent.orange, accent.light, '#f6f1e8', '#6b3a4a', '#2f6d58', '#243044', '#e7d3b0']
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.95, -0.14]} castShadow>
        <boxGeometry args={[1.25, 1.9, 0.06]} />
        <meshStandardMaterial color="#c9955a" roughness={0.6} />
      </mesh>
      <mesh position={[-0.6, 0.95, 0]} castShadow>
        <boxGeometry args={[0.06, 1.9, 0.34]} />
        <meshStandardMaterial color="#b8894f" />
      </mesh>
      <mesh position={[0.6, 0.95, 0]} castShadow>
        <boxGeometry args={[0.06, 1.9, 0.34]} />
        <meshStandardMaterial color="#b8894f" />
      </mesh>
      {[0.28, 0.72, 1.16, 1.6].map((shelf) => (
        <mesh key={shelf} position={[0, shelf, 0]}>
          <boxGeometry args={[1.14, 0.04, 0.3]} />
          <meshStandardMaterial color="#d7b07a" />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((shelf) =>
        spines.map((color, index) => (
          <mesh key={`${shelf}-${index}`} position={[-0.48 + index * 0.135, 0.46 + shelf * 0.44, 0.08]}>
            <boxGeometry args={[0.1, 0.26 - (index % 3) * 0.03, 0.05]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        )),
      )}
    </group>
  )
}

function Credenza({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.15, 0.8, 0.4]} />
        <meshStandardMaterial color="#c9955a" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.44]} />
        <meshStandardMaterial color="#e6d3b0" roughness={0.4} />
      </mesh>
    </group>
  )
}

function Kitchen() {
  const stools = seatsIn('pantry').filter((seat) => seat.pose === 'sit')
  return (
    <group>
      <mesh position={[10.45, 0.46, 0.58]} castShadow receiveShadow>
        <boxGeometry args={[2.85, 0.88, 0.62]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.5} />
      </mesh>
      <mesh position={[10.45, 0.92, 0.58]}>
        <boxGeometry args={[2.95, 0.05, 0.68]} />
        <meshStandardMaterial color="#ece8e1" roughness={0.28} metalness={0.05} />
      </mesh>
      <mesh position={[9.7, 0.96, 0.58]}>
        <boxGeometry args={[0.46, 0.03, 0.32]} />
        <meshStandardMaterial color="#c5ced6" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[9.7, 1.1, 0.4]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
        <meshStandardMaterial color="#e4ebf1" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[10.65, 1.08, 0.55]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.26]} />
        <meshStandardMaterial color="#2c2826" roughness={0.45} />
      </mesh>
      <mesh position={[10.15, 1.85, 0.4]} castShadow>
        <boxGeometry args={[1.5, 0.5, 0.32]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.48} />
      </mesh>
      <mesh position={[11.75, 1.05, 0.55]} castShadow>
        <boxGeometry args={[0.68, 1.95, 0.64]} />
        <meshStandardMaterial color="#e7eef3" roughness={0.3} metalness={0.18} />
      </mesh>
      <mesh position={[11.98, 1.2, 0.88]}>
        <boxGeometry args={[0.03, 0.72, 0.03]} />
        <meshStandardMaterial color={accent.light} metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[10.7, 1.55, 0.5]}>
        <boxGeometry args={[0.42, 0.24, 0.3]} />
        <meshStandardMaterial color="#d5dbe3" metalness={0.25} roughness={0.35} />
      </mesh>
      <mesh position={[10.8, 0.74, 2.85]} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 24]} />
        <meshStandardMaterial color="#e4cda6" roughness={0.48} />
      </mesh>
      <mesh position={[10.8, 0.38, 2.85]}>
        <cylinderGeometry args={[0.045, 0.07, 0.68, 10]} />
        <meshStandardMaterial color="#f4f1ea" />
      </mesh>
      {stools.map((seat) => (
        <Stool key={seat.id} x={seat.point.x} z={seat.point.y} />
      ))}
    </group>
  )
}

function Stool({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 14]} />
        <meshStandardMaterial color={accent.orange} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.42, 8]} />
        <meshStandardMaterial color="#2c3138" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 14]} />
        <meshStandardMaterial color="#3a4048" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Storage() {
  const bins = [accent.pink, accent.orange, accent.light, '#3d8f6a', '#3a6ea5', accent.orange]
  return (
    <group position={[13.4, 0, 0.7]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.55, 1.8, 0.42]} />
        <meshStandardMaterial color="#c9955a" roughness={0.6} />
      </mesh>
      {bins.map((color, index) => (
        <mesh key={`${color}-${index}`} position={[-0.48 + (index % 3) * 0.46, 0.42 + Math.floor(index / 3) * 0.7, 0.16]}>
          <boxGeometry args={[0.36, 0.3, 0.28]} />
          <meshStandardMaterial color={color} roughness={0.52} />
        </mesh>
      ))}
    </group>
  )
}

function Restroom() {
  return (
    <group>
      <mesh position={[15.35, 0.38, 0.7]} castShadow>
        <boxGeometry args={[0.42, 0.4, 0.55]} />
        <meshStandardMaterial color="#f7f7f5" roughness={0.32} />
      </mesh>
      <mesh position={[15.35, 0.66, 0.52]}>
        <boxGeometry args={[0.38, 0.1, 0.42]} />
        <meshStandardMaterial color="#fbfbf9" roughness={0.28} />
      </mesh>
      <mesh position={[15.35, 0.95, 0.82]}>
        <boxGeometry args={[0.42, 0.5, 0.12]} />
        <meshStandardMaterial color="#f4f4f2" />
      </mesh>
      <mesh position={[15.4, 0.55, 2.15]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.4]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.45} />
      </mesh>
      <mesh position={[15.4, 0.94, 2.15]}>
        <boxGeometry args={[0.36, 0.05, 0.26]} />
        <meshStandardMaterial color="#d5dee6" metalness={0.6} roughness={0.22} />
      </mesh>
      <mesh position={[15.4, 1.4, 0.22]}>
        <boxGeometry args={[0.42, 0.55, 0.02]} />
        <meshStandardMaterial color="#d7e6ee" metalness={0.3} roughness={0.12} />
      </mesh>
    </group>
  )
}

function MeetingRoom() {
  const table = MEETING_TABLE
  const chairs = [
    { x: CONF_SEATS.jv!.x, z: CONF_SEATS.jv!.y, yaw: -Math.PI / 2, color: accent.light },
    { x: CONF_SEATS.marj!.x, z: CONF_SEATS.marj!.y, yaw: Math.PI / 2, color: accent.orange },
    { x: table.x, z: table.y - 1.15, yaw: 0, color: accent.light },
    { x: table.x, z: table.y + 1.15, yaw: Math.PI, color: accent.pink },
  ]
  return (
    <group>
      <mesh position={[table.x, 0.74, table.y]} castShadow>
        <cylinderGeometry args={[0.7, 0.7, 0.03, 40]} />
        <meshStandardMaterial color="#d5e6f2" transparent opacity={0.38} roughness={0.04} metalness={0.12} />
      </mesh>
      <mesh position={[table.x, 0.76, table.y]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.012, 8, 40]} />
        <meshStandardMaterial color="#d5dde4" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[table.x, 0.4, table.y]}>
        <cylinderGeometry args={[0.07, 0.12, 0.64, 16]} />
        <meshStandardMaterial color="#d8dee6" metalness={0.68} roughness={0.25} />
      </mesh>
      {chairs.map((chair) => (
        <TaskChair key={`${chair.x}-${chair.z}`} x={chair.x} z={chair.z} yaw={chair.yaw} accentColor={chair.color} />
      ))}
      <mesh position={[table.x, 1.5, 3.22]} castShadow>
        <boxGeometry args={[1.15, 0.68, 0.04]} />
        <meshStandardMaterial color="#1a1e24" />
      </mesh>
      <mesh position={[table.x, 1.5, 3.25]}>
        <planeGeometry args={[1.02, 0.56]} />
        <meshStandardMaterial color="#142033" emissive={accent.orange} emissiveIntensity={0.18} />
      </mesh>
    </group>
  )
}

function Lounge({ rug }: { rug: Texture | null }) {
  const chairs = seatsIn('lounge').filter((seat) => seat.point.y >= 9)
  return (
    <group>
      <mesh position={[13.5, 0.026, 9.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.6, 3.3]} />
        <meshStandardMaterial color="#e6d3bc" map={rug ?? undefined} roughness={0.92} />
      </mesh>
      <Sofa x={13.37} z={8.15} />
      {chairs.map((seat) => (
        <Armchair key={seat.id} x={seat.point.x} z={seat.point.y} yaw={facingForSpot(seat.point)} />
      ))}
      <CoffeeTable x={13.45} z={9.25} />
      <Reception />
    </group>
  )
}

function Sofa({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.45, 0.28, 0.86]} />
        <meshStandardMaterial color="#e2b15a" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.5, -0.36]} castShadow>
        <boxGeometry args={[3.45, 0.46, 0.16]} />
        <meshStandardMaterial color="#c9923e" roughness={0.7} />
      </mesh>
      {[-1.1, 0.05, 1.15].map((cx) => (
        <mesh key={`seat-${cx}`} position={[cx, 0.4, 0.04]} castShadow>
          <boxGeometry args={[1.05, 0.1, 0.68]} />
          <meshStandardMaterial color="#f0c56e" roughness={0.66} />
        </mesh>
      ))}
      {[-1.1, 0.05, 1.15].map((cx) => (
        <mesh key={`back-${cx}`} position={[cx, 0.62, -0.28]}>
          <boxGeometry args={[1.0, 0.28, 0.12]} />
          <meshStandardMaterial color="#f3d48a" roughness={0.68} />
        </mesh>
      ))}
      <mesh position={[1.3, 0.52, 0.08]} rotation={[0.1, 0.3, 0.25]}>
        <boxGeometry args={[0.32, 0.16, 0.32]} />
        <meshStandardMaterial color={accent.pink} roughness={0.6} />
      </mesh>
      <mesh position={[-1.15, 0.52, 0.1]} rotation={[0, -0.2, -0.15]}>
        <boxGeometry args={[0.3, 0.16, 0.3]} />
        <meshStandardMaterial color={accent.light} roughness={0.6} />
      </mesh>
      <mesh position={[-1.78, 0.42, 0]} castShadow>
        <boxGeometry args={[0.16, 0.32, 0.86]} />
        <meshStandardMaterial color="#c9923e" />
      </mesh>
      <mesh position={[1.78, 0.42, 0]} castShadow>
        <boxGeometry args={[0.16, 0.32, 0.86]} />
        <meshStandardMaterial color="#c9923e" />
      </mesh>
    </group>
  )
}

function Armchair({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.24, 0]} castShadow>
        <boxGeometry args={[0.72, 0.28, 0.72]} />
        <meshStandardMaterial color="#e2b15a" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.42, 0.02]}>
        <boxGeometry args={[0.6, 0.08, 0.56]} />
        <meshStandardMaterial color="#f0c56e" />
      </mesh>
      <mesh position={[0, 0.54, -0.28]} castShadow>
        <boxGeometry args={[0.72, 0.42, 0.12]} />
        <meshStandardMaterial color="#c9923e" />
      </mesh>
      <mesh position={[-0.38, 0.4, 0]}>
        <boxGeometry args={[0.1, 0.24, 0.72]} />
        <meshStandardMaterial color="#c9923e" />
      </mesh>
      <mesh position={[0.38, 0.4, 0]}>
        <boxGeometry args={[0.1, 0.24, 0.72]} />
        <meshStandardMaterial color="#c9923e" />
      </mesh>
    </group>
  )
}

function CoffeeTable({ x, z }: { x: number; z: number }) {
  const legs: Array<[number, number]> = [
    [-0.42, -0.22],
    [0.42, -0.22],
    [-0.42, 0.22],
    [0.42, 0.22],
  ]
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.06, 0.62]} />
        <meshStandardMaterial color="#c9955a" roughness={0.46} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.86, 0.035, 0.46]} />
        <meshStandardMaterial color="#a87440" />
      </mesh>
      {legs.map(([lx, lz]) => (
        <mesh key={`${lx}-${lz}`} position={[lx, 0.17, lz]}>
          <boxGeometry args={[0.05, 0.32, 0.05]} />
          <meshStandardMaterial color="#6a4632" />
        </mesh>
      ))}
      <mesh position={[-0.12, 0.39, 0]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[0.26, 0.025, 0.18]} />
        <meshStandardMaterial color="#f6f1e8" />
      </mesh>
      <mesh position={[0.22, 0.4, 0.04]}>
        <cylinderGeometry args={[0.05, 0.04, 0.06, 12]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.35} />
      </mesh>
    </group>
  )
}

function useArc(inner: number, outer: number, a0: number, a1: number, depth: number) {
  return useMemo(() => {
    const shape = new Shape()
    shape.absarc(0, 0, outer, a0, a1, false)
    shape.absarc(0, 0, inner, a1, a0, true)
    const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 28 })
    geo.rotateX(-Math.PI / 2)
    geo.computeVertexNormals()
    return geo
  }, [inner, outer, a0, a1, depth])
}

function useLogo() {
  const [map, setMap] = useState<Texture | null>(null)
  useEffect(() => {
    const loader = new TextureLoader()
    loader.load(brand.logo.small, (tex) => {
      tex.colorSpace = SRGBColorSpace
      setMap(tex)
    })
  }, [])
  return map
}

function Reception() {
  const base = useArc(0.48, 0.86, 0.35, 2.55, 0.86)
  const top = useArc(0.44, 0.9, 0.35, 2.55, 0.06)
  const logo = useLogo()
  return (
    <group position={[14.85, 0, 10.85]} rotation={[0, 0.9, 0]}>
      <mesh geometry={base} castShadow receiveShadow>
        <meshStandardMaterial color="#f4f1ea" roughness={0.55} side={DoubleSide} />
      </mesh>
      <mesh geometry={top} position={[0, 0.86, 0]} castShadow>
        <meshStandardMaterial color="#14a39a" roughness={0.32} emissive="#0d6e68" emissiveIntensity={0.18} side={DoubleSide} />
      </mesh>
      <mesh position={[0.15, 1.35, -0.15]}>
        <boxGeometry args={[0.7, 0.7, 0.04]} />
        <meshStandardMaterial color="#16141a" />
      </mesh>
      {logo ? (
        <mesh position={[0.15, 1.35, -0.12]}>
          <planeGeometry args={[0.48, 0.48]} />
          <meshStandardMaterial map={logo} />
        </mesh>
      ) : null}
    </group>
  )
}

function ReadingNook() {
  const seats = seatsIn('nook').filter((seat) => seat.pose === 'sit')
  return (
    <group>
      {seats.map((seat) => (
        <Armchair key={seat.id} x={seat.point.x} z={seat.point.y} yaw={facingForSpot(seat.point)} />
      ))}
      <mesh position={[9.2, 0.2, 7.1]} castShadow>
        <boxGeometry args={[0.28, 0.06, 0.2]} />
        <meshStandardMaterial color={accent.orange} />
      </mesh>
      <mesh position={[9.2, 0.28, 7.1]}>
        <boxGeometry args={[0.22, 0.05, 0.16]} />
        <meshStandardMaterial color="#f4efe6" />
      </mesh>
    </group>
  )
}

function Decor() {
  return (
    <group>
      <Plant x={0.7} z={4.15} kind="tree" />
      <Plant x={5.15} z={3.55} />
      <Plant x={8.35} z={0.95} kind="snake" />
      <Plant x={9.15} z={4.15} />
      <Plant x={0.65} z={11.15} kind="tree" />
      <Plant x={7.75} z={6.15} scale={0.85} />
      <Plant x={11.25} z={7.35} />
      <Plant x={15.85} z={7.35} kind="tree" />
      <Plant x={15.85} z={11.35} />
      <Plant x={11.35} z={11.25} kind="snake" />
      <Plant x={13.05} z={5.85} scale={0.8} />
      <Art x={2.3} z={0.2} colors={[accent.pink, accent.light]} />
      <Art x={4.15} z={0.2} colors={['#2f6d58', accent.orange]} wide />
      <Art x={7.15} z={0.2} colors={[accent.orange, '#f6f1e8']} />
      <Art x={10.4} z={0.2} colors={['#d7e2ea', accent.pink]} />
      <group position={[15.9, 0, 8.55]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.48, 0]} rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[0.62, 0.82, 0.04]} />
          <meshStandardMaterial color="#f4f0e8" />
        </mesh>
        <mesh position={[0, 0.5, 0.03]} rotation={[-0.18, 0, 0]}>
          <planeGeometry args={[0.48, 0.66]} />
          <meshStandardMaterial color={accent.pink} />
        </mesh>
      </group>
    </group>
  )
}

function Plant({ x, z, scale = 1, kind = 'bush' }: { x: number; z: number; scale?: number; kind?: 'bush' | 'tree' | 'snake' }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[kind === 'tree' ? 0.16 : 0.13, 0.12, 0.32, 12]} />
        <meshStandardMaterial color={kind === 'snake' ? '#f4f1ea' : '#b4633a'} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.03, 10]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>
      {kind === 'snake' ? (
        <group>
          {[0, 1, 2, 3, 4].map((leaf) => (
            <mesh key={leaf} position={[Math.sin(leaf) * 0.05, 0.55 + leaf * 0.08, Math.cos(leaf) * 0.04]} rotation={[0.2, leaf, 0.3]}>
              <boxGeometry args={[0.06, 0.28, 0.02]} />
              <meshStandardMaterial color={leaf % 2 ? '#1f6b4a' : '#2f8a5b'} />
            </mesh>
          ))}
        </group>
      ) : (
        <group>
          <mesh position={[0, kind === 'tree' ? 0.7 : 0.48, 0]} castShadow>
            <sphereGeometry args={[kind === 'tree' ? 0.28 : 0.2, 12, 10]} />
            <meshStandardMaterial color="#1e5a40" roughness={0.75} />
          </mesh>
          <mesh position={[0.14, kind === 'tree' ? 0.82 : 0.58, 0.06]}>
            <sphereGeometry args={[kind === 'tree' ? 0.2 : 0.14, 10, 8]} />
            <meshStandardMaterial color="#2f7a52" roughness={0.72} />
          </mesh>
          <mesh position={[-0.12, kind === 'tree' ? 0.78 : 0.55, -0.05]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#246348" />
          </mesh>
        </group>
      )}
    </group>
  )
}

function Art({ x, z, colors, wide = false }: { x: number; z: number; colors: [string, string]; wide?: boolean }) {
  const w = wide ? 0.95 : 0.62
  return (
    <group position={[x, 1.55, z]}>
      <mesh castShadow>
        <boxGeometry args={[w + 0.08, 0.5, 0.03]} />
        <meshStandardMaterial color="#f7f4ee" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[w, 0.4]} />
        <meshStandardMaterial color={colors[0]} />
      </mesh>
      <mesh position={[w * 0.18, -0.04, 0.03]}>
        <circleGeometry args={[0.1, 16]} />
        <meshStandardMaterial color={colors[1]} />
      </mesh>
    </group>
  )
}

const CANS: Array<[number, number, string]> = [
  [2.2, 2.05, '#fff1dd'],
  [4.2, 2.1, '#fff1dd'],
  [7.2, 2.15, '#fff1dd'],
  [10.15, 1.25, '#fff7ee'],
  [10.7, 3.05, '#fff7ee'],
  [2.0, 7.75, '#ffe6c4'],
  [4.0, 7.75, '#ffe6c4'],
  [6.05, 7.75, '#ffe6c4'],
  [13.4, 9.15, '#ffe2be'],
  [15.05, 10.55, '#ffe2be'],
  [14.25, 4.7, '#fff0dc'],
  [13.4, 1.45, '#fff4e6'],
  [15.4, 1.5, '#fff6ee'],
  [9.9, 7.35, '#ffe6c4'],
  [8.5, 5.5, '#ffe6c4'],
]

function CeilingCans() {
  return (
    <group>
      {CANS.map(([x, z, color]) => (
        <group key={`${x}-${z}`} position={[x, 0, z]}>
          <mesh position={[0, 2.54, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.035, 16]} />
            <meshStandardMaterial color="#f7f4ee" roughness={0.4} />
          </mesh>
          <mesh position={[0, 2.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.1, 18]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.7} side={DoubleSide} />
          </mesh>
          <pointLight position={[0, 2.35, 0]} color={color} intensity={46} distance={7.2} decay={2} />
        </group>
      ))}
    </group>
  )
}

function plateSpot(slug: string): { x: number; z: number } {
  const feet = deskPoint(slug, slug === 'jv')
  if (slug === 'jv' || slug === 'marj') return { x: feet.x + (slug === 'jv' ? 0.62 : 0.48), z: feet.y - 0.9 }
  if (slug === 'alex' || slug === 'sage' || slug === 'dev') return { x: feet.x + 0.42, z: feet.y + 0.55 }
  return { x: feet.x + 0.42, z: feet.y - 0.55 }
}

export function DeskNameplates({ agents, poses }: { agents: FloorAgent[]; poses: Pose[] }) {
  const bySlug = new Map(poses.map((pose) => [pose.slug, pose]))
  const personAt: Record<string, { x: number; y: number } | null> = {}
  for (const agent of agents) {
    const pose = bySlug.get(agent.slug)
    const view = pose ? poseView(pose) : null
    personAt[agent.slug] = view ? { x: view.x, y: view.y } : null
  }
  return (
    <group>
      {deskNameplates(agents, personAt).map((plate) => {
        const spot = plateSpot(plate.slug)
        return <Nameplate key={plate.slug} name={plate.name} x={spot.x} z={spot.z} />
      })}
    </group>
  )
}

function Nameplate({ name, x, z }: { name: string; x: number; z: number }) {
  const map = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 160
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#f7f4ee'
    ctx.fillRect(0, 0, 512, 160)
    ctx.strokeStyle = '#c9955a'
    ctx.lineWidth = 14
    ctx.strokeRect(10, 10, 492, 140)
    ctx.fillStyle = '#2a241c'
    ctx.font = '600 72px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const label = name.length > 12 ? `${name.slice(0, 11)}…` : name
    ctx.fillText(label, 256, 84)
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [name])
  const width = Math.min(0.46, 0.2 + name.length * 0.028)
  return (
    <group position={[x, 0.8, z]}>
      <mesh position={[0, 0.07, 0]} rotation={[-0.7, 0, 0]} castShadow>
        <planeGeometry args={[width, 0.11]} />
        <meshStandardMaterial map={map ?? undefined} color="#f7f4ee" roughness={0.45} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 0.02, 0.03]}>
        <boxGeometry args={[width * 0.72, 0.03, 0.045]} />
        <meshStandardMaterial color="#6b442c" roughness={0.5} />
      </mesh>
    </group>
  )
}
