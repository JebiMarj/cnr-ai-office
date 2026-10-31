import { useEffect, useMemo, useState } from 'react'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from 'three'
import { brand } from '../../brand.tsx'
import { deskPoint, type FloorAgent } from '../motion.ts'
import { accent, night } from './palette.ts'

const NORTH = ['alex', 'sage', 'dev'] as const
const SOUTH = ['mechanicus', 'tech', 'gia'] as const
const POD_COLOR = [accent.pink, accent.orange, accent.light]

function useWood() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = night.wood
    ctx.fillRect(0, 0, 512, 512)
    for (let row = 0; row < 18; row += 1) {
      ctx.fillStyle = row % 2 ? '#54392c' : '#3e2b22'
      ctx.fillRect(0, row * 28, 512, 26)
      ctx.strokeStyle = 'rgba(255,220,180,0.05)'
      ctx.beginPath()
      ctx.moveTo(0, row * 28 + 8)
      ctx.bezierCurveTo(120, row * 28 + 4, 260, row * 28 + 16, 512, row * 28 + 6)
      ctx.stroke()
    }
    const texture = new CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.colorSpace = SRGBColorSpace
    texture.repeat.set(3.2, 3.2)
    return texture
  }, [])
}

function useCity() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    const sky = ctx.createLinearGradient(0, 0, 0, 256)
    sky.addColorStop(0, '#140c18')
    sky.addColorStop(0.55, '#2a1840')
    sky.addColorStop(1, '#3a2218')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 512, 256)
    const towers = [40, 90, 130, 180, 230, 290, 340, 400, 450]
    towers.forEach((x, index) => {
      const h = 70 + ((index * 37) % 110)
      ctx.fillStyle = '#0c0a12'
      ctx.fillRect(x, 250 - h, 28 + (index % 3) * 8, h)
      ctx.fillStyle = index % 2 ? accent.light : accent.pink
      for (let y = 250 - h + 8; y < 240; y += 12) {
        for (let lx = x + 4; lx < x + 24; lx += 8) {
          if ((lx + y) % 3 === 0) ctx.fillRect(lx, y, 3, 4)
        }
      }
    })
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])
}

export function OfficeWorld({ agents }: { agents: FloorAgent[] }) {
  const wood = useWood()
  const city = useCity()
  const offline = new Set(agents.filter((agent) => agent.status === 'offline').map((agent) => agent.slug))
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8.2, -0.08, 6.1]} receiveShadow>
        <boxGeometry args={[18.2, 14.2, 0.16]} />
        <meshStandardMaterial color="#141218" />
      </mesh>
      <FloorSlab x={4.3} z={8.6} w={8.2} d={6.4} map={wood} color={night.wood} />
      <FloorSlab x={12.4} z={9.3} w={7.2} d={5} map={wood} color={night.woodDark} />
      <FloorSlab x={2.9} z={2.5} w={5.2} d={4.4} color={night.carpet} />
      <FloorSlab x={7.25} z={2.5} w={3.1} d={4.4} color={night.carpetDark} />
      <FloorSlab x={10.6} z={2.3} w={3.2} d={4.1} color={night.tile} tile />
      <FloorSlab x={14.2} z={4.8} w={3.6} d={3.3} color="#34303a" />
      <Walls />
      {city ? <CityWindows texture={city} /> : null}
      <WorkPods offline={offline} />
      <ExecutiveOffice slug="jv" />
      <ExecutiveOffice slug="marj" />
      <Kitchen />
      <Storage />
      <Restroom />
      <MeetingRoom />
      <Lounge />
      <ReadingNook />
      <Plant x={1.1} z={1.1} />
      <Plant x={8.2} z={1.2} scale={0.8} />
      <Plant x={15.6} z={8.2} />
      <Plant x={9.4} z={10.6} scale={1.1} />
      <Lights />
    </group>
  )
}

function FloorSlab({
  x,
  z,
  w,
  d,
  color,
  map,
  tile = false,
}: {
  x: number
  z: number
  w: number
  d: number
  color: string
  map?: CanvasTexture | null
  tile?: boolean
}) {
  return (
    <mesh position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} map={map ?? undefined} roughness={tile ? 0.35 : 0.82} metalness={tile ? 0.08 : 0.02} />
    </mesh>
  )
}

function Walls() {
  const h = 2.55
  const t = 0.14
  return (
    <group>
      <Wall x={0} z={0} w={16.4} d={t} h={h} />
      <Wall x={0} z={0} w={t} d={12.2} h={h} />
      <Wall x={16.26} z={0} w={t} d={12.2} h={h} />
      <Wall x={0} z={12.06} w={11.2} d={t} h={h} />
      <Wall x={13.35} z={12.06} w={3.05} d={t} h={h} />
      <Door x={12.25} z={12.06} yaw={0} open />
      <Wall x={5.6} z={0.2} w={t} d={4.6} h={h} glass />
      <Wall x={0.2} z={4.8} w={1.4} d={t} h={h} />
      <Wall x={3.2} z={4.8} w={2.4} d={t} h={h} />
      <Door x={2.15} z={4.8} yaw={0} />
      <Wall x={5.6} z={4.8} w={1.0} d={t} h={h} />
      <Wall x={7.7} z={4.8} w={1.2} d={t} h={h} />
      <Door x={7.15} z={4.8} yaw={0} />
      <Wall x={8.9} z={4.6} w={0.7} d={t} h={h} />
      <Wall x={11.3} z={4.6} w={1.0} d={t} h={h} />
      <Door x={10.45} z={4.6} yaw={0} />
      <Wall x={12.3} z={0.2} w={t} d={2.8} h={h} />
      <Wall x={12.3} z={3.05} w={t} d={1.2} h={h} glass />
      <Wall x={12.3} z={5.35} w={t} d={1.25} h={h} glass />
      <Door x={12.3} z={4.7} yaw={Math.PI / 2} />
      <Wall x={12.3} z={6.6} w={3.9} d={t} h={h} glass />
      <Wall x={16.12} z={3.05} w={t} d={3.55} h={h} glass />
      <Wall x={14.5} z={0.2} w={t} d={2.6} h={h} />
      <Wall x={14.5} z={2.95} w={0.7} d={t} h={h} />
      <Wall x={15.7} z={2.95} w={0.55} d={t} h={h} />
      <Door x={15.35} z={2.95} yaw={0} />
    </group>
  )
}

function Wall({ x, z, w, d, h, glass = false }: { x: number; z: number; w: number; d: number; h: number; glass?: boolean }) {
  return (
    <mesh position={[x + w / 2, h / 2, z + d / 2]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      {glass ? (
        <meshStandardMaterial color={night.glass} transparent opacity={0.22} roughness={0.08} />
      ) : (
        <meshStandardMaterial color={night.wall} roughness={0.88} />
      )}
    </mesh>
  )
}

function Door({ x, z, yaw, open = false }: { x: number; z: number; yaw: number; open?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw + (open ? 0.7 : 0.35), 0]}>
      <mesh position={[0.32, 1.05, 0]} castShadow>
        <boxGeometry args={[0.64, 2.1, 0.05]} />
        <meshStandardMaterial color="#3a2c24" roughness={0.62} />
      </mesh>
      <mesh position={[0.55, 1.0, 0.03]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color={accent.light} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

function CityWindows({ texture }: { texture: CanvasTexture }) {
  return (
    <group>
      <Window x={2.7} z={0.09} w={3.6} texture={texture} />
      <Window x={7.25} z={0.09} w={2.4} texture={texture} />
      <Window x={10.6} z={0.09} w={2.2} texture={texture} />
    </group>
  )
}

function Window({ x, z, w, texture }: { x: number; z: number; w: number; texture: CanvasTexture }) {
  return (
    <group position={[x, 1.55, z]}>
      <mesh>
        <planeGeometry args={[w, 1.35]} />
        <meshStandardMaterial map={texture} emissive="#ffd0a8" emissiveMap={texture} emissiveIntensity={0.85} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.74, 0.03]}>
        <boxGeometry args={[w + 0.08, 0.05, 0.04]} />
        <meshStandardMaterial color={night.trim} />
      </mesh>
      <mesh position={[0, -0.74, 0.03]}>
        <boxGeometry args={[w + 0.08, 0.05, 0.04]} />
        <meshStandardMaterial color={night.trim} />
      </mesh>
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
    </group>
  )
}

function Pod({ slug, color, facing, dim }: { slug: string; color: string; facing: number; dim: boolean }) {
  const feet = deskPoint(slug, false)
  const deskZ = feet.y + (facing === 0 ? 0.55 : -0.55)
  return (
    <group>
      <mesh position={[feet.x, 0.74, deskZ]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.06, 0.72]} />
        <meshStandardMaterial color={night.woodDark} roughness={0.55} />
      </mesh>
      <mesh position={[feet.x - 0.62, 0.38, deskZ]}>
        <boxGeometry args={[0.05, 0.7, 0.7]} />
        <meshStandardMaterial color="#2a2420" />
      </mesh>
      <mesh position={[feet.x + 0.62, 0.38, deskZ]}>
        <boxGeometry args={[0.05, 0.7, 0.7]} />
        <meshStandardMaterial color="#2a2420" />
      </mesh>
      <mesh position={[feet.x, 0.96, deskZ + (facing === 0 ? 0.18 : -0.18)]} rotation={[facing === 0 ? -0.15 : 0.15, 0, 0]}>
        <boxGeometry args={[0.62, 0.36, 0.03]} />
        <meshStandardMaterial color="#12141a" roughness={0.3} />
      </mesh>
      <mesh position={[feet.x, 0.96, deskZ + (facing === 0 ? 0.2 : -0.2)]}>
        <boxGeometry args={[0.52, 0.26, 0.01]} />
        <meshStandardMaterial color={dim ? '#2a241c' : color} emissive={dim ? '#000' : color} emissiveIntensity={dim ? 0 : 0.35} />
      </mesh>
      <mesh position={[feet.x, 0.78, deskZ - (facing === 0 ? 0.12 : -0.12)]}>
        <boxGeometry args={[0.36, 0.02, 0.14]} />
        <meshStandardMaterial color="#3a4048" />
      </mesh>
      {facing === 0 ? (
        <mesh position={[feet.x, 1.05, 7.7]}>
          <boxGeometry args={[1.35, 0.46, 0.045]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.45} />
        </mesh>
      ) : null}
      <TaskChair x={feet.x} z={feet.y} yaw={facing} color={color} />
    </group>
  )
}

function TaskChair({ x, z, yaw, color }: { x: number; z: number; yaw: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial color="#2a2e34" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 8]} />
        <meshStandardMaterial color="#8d939c" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.46, 0.07, 0.46]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.78, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.06]} />
        <meshStandardMaterial color="#2a2e34" roughness={0.6} />
      </mesh>
    </group>
  )
}

function ExecutiveOffice({ slug }: { slug: 'jv' | 'marj' }) {
  const feet = deskPoint(slug, slug === 'jv')
  const boss = slug === 'jv'
  return (
    <group>
      <mesh position={[feet.x, 0.76, feet.y - 0.85]} castShadow receiveShadow>
        <boxGeometry args={[boss ? 1.7 : 1.5, 0.06, 0.78]} />
        <meshStandardMaterial color="#5a3e2e" roughness={0.48} />
      </mesh>
      <mesh position={[feet.x, 0.4, feet.y - 0.85]}>
        <boxGeometry args={[0.08, 0.7, 0.7]} />
        <meshStandardMaterial color="#3a2a22" />
      </mesh>
      <mesh position={[feet.x, 1.15, feet.y - 1.15]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.7, 0.4, 0.03]} />
        <meshStandardMaterial color="#101218" />
      </mesh>
      <mesh position={[feet.x, 1.15, feet.y - 1.12]}>
        <boxGeometry args={[0.58, 0.28, 0.01]} />
        <meshStandardMaterial color={boss ? accent.pink : accent.orange} emissive={boss ? accent.pink : accent.orange} emissiveIntensity={0.25} />
      </mesh>
      <ExecChair x={feet.x} z={feet.y} plum={!boss} />
      <Bookcase x={boss ? 4.7 : 6.0} z={0.55} />
    </group>
  )
}

function ExecChair({ x, z, plum }: { x: number; z: number; plum: boolean }) {
  const color = plum ? '#4a2438' : '#241c18'
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.06, 16]} />
        <meshStandardMaterial color="#2a2e34" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.52, 0.1, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.95, -0.22]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Bookcase({ x, z }: { x: number; z: number }) {
  const colors = [accent.pink, accent.orange, accent.light, '#f6f1e8', '#6b3a4a', '#2f6d58']
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.9, 1.8, 0.32]} />
        <meshStandardMaterial color="#3a2a22" roughness={0.7} />
      </mesh>
      {[0, 1, 2].map((shelf) =>
        colors.map((color, index) => (
          <mesh key={`${shelf}-${color}`} position={[-0.32 + index * 0.12, 0.55 + shelf * 0.42, 0.12]}>
            <boxGeometry args={[0.09, 0.26, 0.05]} />
            <meshStandardMaterial color={color} />
          </mesh>
        )),
      )}
    </group>
  )
}

function Kitchen() {
  return (
    <group>
      <mesh position={[10.6, 0.9, 0.7]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.9, 0.65]} />
        <meshStandardMaterial color="#3a342e" roughness={0.6} />
      </mesh>
      <mesh position={[10.6, 1.38, 0.7]}>
        <boxGeometry args={[3.1, 0.06, 0.72]} />
        <meshStandardMaterial color="#d9d3c8" roughness={0.35} />
      </mesh>
      <mesh position={[9.7, 1.42, 0.7]}>
        <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
        <meshStandardMaterial color="#9aa3ad" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[11.7, 1.15, 0.55]} castShadow>
        <boxGeometry args={[0.7, 1.7, 0.65]} />
        <meshStandardMaterial color="#d5dbe3" roughness={0.4} />
      </mesh>
      <mesh position={[11.95, 1.2, 0.88]}>
        <boxGeometry args={[0.04, 0.7, 0.04]} />
        <meshStandardMaterial color={accent.light} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[9.55, 1.15, 1.15]} castShadow>
        <boxGeometry args={[0.28, 0.36, 0.32]} />
        <meshStandardMaterial color="#2a2428" />
      </mesh>
      <mesh position={[10.7, 0.74, 3.45]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 20]} />
        <meshStandardMaterial color="#6a4632" roughness={0.5} />
      </mesh>
      <mesh position={[10.7, 0.4, 3.45]}>
        <cylinderGeometry args={[0.06, 0.08, 0.6, 10]} />
        <meshStandardMaterial color="#3a2e28" />
      </mesh>
      <Stool x={10.25} z={3.5} />
      <Stool x={11.35} z={3.55} />
    </group>
  )
}

function Stool({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.05, 12]} />
        <meshStandardMaterial color={accent.orange} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#2a2e34" metalness={0.4} />
      </mesh>
    </group>
  )
}

function Storage() {
  const bins = [accent.pink, accent.orange, accent.light, '#2f6d58', accent.pink, accent.orange]
  return (
    <group position={[13.4, 0, 1.4]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.5, 1.8, 0.45]} />
        <meshStandardMaterial color="#3a342c" />
      </mesh>
      {bins.map((color, index) => (
        <mesh key={`${color}-${index}`} position={[-0.45 + (index % 3) * 0.42, 0.4 + Math.floor(index / 3) * 0.7, 0.18]}>
          <boxGeometry args={[0.32, 0.28, 0.28]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
    </group>
  )
}

function Restroom() {
  return (
    <group>
      <mesh position={[15.35, 1.7, 2.7]}>
        <boxGeometry args={[0.46, 0.12, 0.02]} />
        <meshStandardMaterial color={night.trim} />
      </mesh>
    </group>
  )
}

function MeetingRoom() {
  const chairs = [
    [14.25, 3.7],
    [15.2, 4.7],
    [14.25, 5.7],
    [13.3, 4.7],
  ]
  return (
    <group>
      <mesh position={[14.25, 0.74, 4.7]} castShadow>
        <cylinderGeometry args={[0.95, 0.95, 0.04, 32]} />
        <meshStandardMaterial color="#d5deea" transparent opacity={0.55} roughness={0.08} metalness={0.15} />
      </mesh>
      <mesh position={[14.25, 0.4, 4.7]}>
        <cylinderGeometry args={[0.08, 0.12, 0.65, 12]} />
        <meshStandardMaterial color="#c8ced6" metalness={0.6} roughness={0.3} />
      </mesh>
      {chairs.map(([x, z]) => (
        <TaskChair key={`${x}-${z}`} x={x!} z={z!} yaw={Math.atan2(14.25 - x!, 4.7 - z!)} color={accent.light} />
      ))}
    </group>
  )
}

function Lounge() {
  return (
    <group>
      <Sofa x={13.2} z={7.7} />
      <Armchair x={14.8} z={9.5} yaw={-0.6} />
      <Armchair x={15.3} z={10.6} yaw={-1.2} />
      <Armchair x={12.3} z={10.3} yaw={0.8} />
      <mesh position={[13.6, 0.32, 9.3]} castShadow>
        <boxGeometry args={[0.9, 0.08, 0.55]} />
        <meshStandardMaterial color="#6a4632" roughness={0.5} />
      </mesh>
      <mesh position={[13.6, 0.16, 9.3]}>
        <boxGeometry args={[0.08, 0.28, 0.5]} />
        <meshStandardMaterial color="#3a2a22" />
      </mesh>
      <Reception />
    </group>
  )
}

function Sofa({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[2.1, 0.32, 0.8]} />
        <meshStandardMaterial color="#4a3040" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.62, -0.32]} castShadow>
        <boxGeometry args={[2.1, 0.45, 0.16]} />
        <meshStandardMaterial color="#3a2434" />
      </mesh>
      <mesh position={[-0.55, 0.48, 0.05]}>
        <boxGeometry args={[0.55, 0.16, 0.5]} />
        <meshStandardMaterial color="#5a3850" />
      </mesh>
      <mesh position={[0.15, 0.48, 0.05]}>
        <boxGeometry args={[0.55, 0.16, 0.5]} />
        <meshStandardMaterial color="#6a4058" />
      </mesh>
      <mesh position={[0.7, 0.5, 0.02]} rotation={[0, 0.2, 0.1]}>
        <boxGeometry args={[0.32, 0.16, 0.32]} />
        <meshStandardMaterial color={accent.light} />
      </mesh>
    </group>
  )
}

function Armchair({ x, z, yaw }: { x: number; z: number; yaw: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.7, 0.28, 0.7]} />
        <meshStandardMaterial color="#5a4030" />
      </mesh>
      <mesh position={[0, 0.62, -0.28]}>
        <boxGeometry args={[0.7, 0.42, 0.12]} />
        <meshStandardMaterial color="#4a3428" />
      </mesh>
    </group>
  )
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
  const logo = useLogo()
  return (
    <group position={[13.1, 0, 10.7]}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[1.8, 0.9, 0.55]} />
        <meshStandardMaterial color={accent.pink} roughness={0.48} emissive={accent.pink} emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[0, 0.96, 0]}>
        <boxGeometry args={[1.9, 0.07, 0.66]} />
        <meshStandardMaterial color={accent.light} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.55, -0.7]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial color="#16121a" />
      </mesh>
      {logo ? (
        <mesh position={[0, 1.55, -0.68]}>
          <planeGeometry args={[0.7, 0.7]} />
          <meshStandardMaterial map={logo} />
        </mesh>
      ) : null}
    </group>
  )
}

function ReadingNook() {
  return (
    <group>
      <Bookcase x={9.2} z={7.15} />
      <Armchair x={10.4} z={7.7} yaw={-2.4} />
    </group>
  )
}

function Plant({ x, z, scale = 1 }: { x: number; z: number; scale?: number }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.14, 0.12, 0.28, 12]} />
        <meshStandardMaterial color="#3a2922" />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <meshStandardMaterial color="#1f4d40" />
      </mesh>
      <mesh position={[0.12, 0.62, 0.05]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#2f6d58" />
      </mesh>
    </group>
  )
}

function Lights() {
  const spots: Array<[number, number, string]> = [
    [2.4, 2.2, '#ffd2a8'],
    [7.2, 2.2, '#ffd2a8'],
    [10.6, 2.0, '#fff1dd'],
    [4.0, 7.6, '#ffe0c0'],
    [13.4, 9.2, '#ffd0b0'],
    [14.2, 4.7, '#ffe6cc'],
  ]
  return (
    <group>
      {spots.map(([x, z, color]) => (
        <group key={`${x}-${z}`}>
          <mesh position={[x, 2.35, z]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
          </mesh>
          <pointLight position={[x, 2.2, z]} color={color} intensity={18} distance={9} decay={2} />
        </group>
      ))}
      <mesh position={[4.0, 1.16, 7.7]}>
        <boxGeometry args={[4.2, 0.03, 0.03]} />
        <meshStandardMaterial color={accent.pink} emissive={accent.pink} emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}
