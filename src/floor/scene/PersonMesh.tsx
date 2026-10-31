import { CapsuleGeometry, MeshStandardMaterial } from 'three'
import type { BodyPose } from '../motion.ts'
import { lookFor, type Look } from '../looks.ts'
import { accent } from './palette.ts'

const skinMat = new Map<string, MeshStandardMaterial>()
const clothMat = new Map<string, MeshStandardMaterial>()

function skin(color: string) {
  let mat = skinMat.get(color)
  if (!mat) {
    mat = new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02 })
    skinMat.set(color, mat)
  }
  return mat
}

function cloth(color: string, rough = 0.72) {
  let mat = clothMat.get(`${color}-${rough}`)
  if (!mat) {
    mat = new MeshStandardMaterial({ color, roughness: rough, metalness: 0.04 })
    clothMat.set(`${color}-${rough}`, mat)
  }
  return mat
}

const limb = new CapsuleGeometry(0.05, 0.26, 4, 8)
const shin = new CapsuleGeometry(0.045, 0.24, 4, 8)
const armGeo = new CapsuleGeometry(0.04, 0.22, 4, 8)
const forearm = new CapsuleGeometry(0.036, 0.2, 4, 8)

export function PersonMesh({
  slug,
  gait,
  phase,
  yaw,
  waiting,
}: {
  slug: string
  gait: BodyPose
  phase: number
  yaw: number
  waiting: boolean
}) {
  const look = lookFor(slug)
  const sit = gait === 'sit'
  const swing = gait === 'walk' ? Math.sin(phase) : 0
  const exec = look.outfit === 'suit' || look.outfit === 'vp'
  return (
    <group rotation={[0, yaw, 0]} position={[0, sit ? -0.02 : 0, 0]}>
      {waiting ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.34, 0.42, 28]} />
          <meshBasicMaterial color={accent.light} />
        </mesh>
      ) : null}
      <Leg side={-1} look={look} sit={sit} swing={swing} />
      <Leg side={1} look={look} sit={sit} swing={-swing} />
      <group position={[0, sit ? 0.5 : 0.98, sit ? 0.08 : 0]}>
        <Torso look={look} exec={exec} />
        <Arm side={-1} look={look} swing={-swing} sit={sit} />
        <Arm side={1} look={look} swing={swing} sit={sit} hold={look.tablet} />
        <Head look={look} />
      </group>
    </group>
  )
}

function Leg({ side, look, sit, swing }: { side: number; look: Look; sit: boolean; swing: number }) {
  return (
    <group position={[side * 0.09, sit ? 0.48 : 0.92, sit ? 0.02 : 0]} rotation={[sit ? 1.35 : swing * 0.7, 0, 0]}>
      <mesh geometry={limb} material={cloth(look.pants)} position={[0, -0.18, 0]} castShadow />
      <group position={[0, -0.36, 0]} rotation={[sit ? -1.45 : Math.max(0, -swing) * 0.5, 0, 0]}>
        <mesh geometry={shin} material={cloth(look.pants, 0.8)} position={[0, -0.16, 0]} castShadow />
        <mesh position={[0, -0.32, 0.05]} castShadow material={cloth(look.shoes, 0.45)}>
          <boxGeometry args={[0.1, 0.06, look.outfit === 'vp' ? 0.16 : 0.2]} />
        </mesh>
      </group>
    </group>
  )
}

function Arm({
  side,
  look,
  swing,
  sit,
  hold = false,
}: {
  side: number
  look: Look
  swing: number
  sit: boolean
  hold?: boolean
}) {
  return (
    <group position={[side * 0.22, 0.28, 0]} rotation={[sit ? 0.4 : swing * 0.7, 0, side * 0.12]}>
      <mesh geometry={armGeo} material={cloth(look.top)} position={[0, -0.14, 0]} castShadow />
      <group position={[0, -0.3, 0]} rotation={[sit ? -0.8 : 0.15, 0, 0]}>
        <mesh geometry={forearm} material={cloth(look.top)} position={[0, -0.12, 0]} castShadow />
        <mesh position={[0, -0.26, 0]} material={skin(look.skin)}>
          <sphereGeometry args={[0.04, 10, 10]} />
        </mesh>
        {hold ? (
          <mesh position={[0, -0.28, 0.05]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.11, 0.16, 0.012]} />
            <meshStandardMaterial color="#f6f1e8" roughness={0.4} />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}

function Torso({ look, exec }: { look: Look; exec: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow material={cloth(look.top)}>
        <capsuleGeometry args={[exec ? 0.16 : 0.15, 0.28, 4, 10]} />
      </mesh>
      <mesh position={[0, 0.16, 0.1]} material={cloth(look.shirt, 0.55)}>
        <boxGeometry args={[0.1, look.tie ? 0.16 : 0.1, 0.02]} />
      </mesh>
      {look.tie ? (
        <mesh position={[0, 0.05, 0.12]} material={cloth(look.accent, 0.4)}>
          <boxGeometry args={[0.04, 0.2, 0.015]} />
        </mesh>
      ) : null}
      {look.outfit === 'hoodie' ? (
        <mesh position={[0, 0.28, 0.02]} material={cloth(look.top)}>
          <sphereGeometry args={[0.12, 12, 10]} />
        </mesh>
      ) : null}
    </group>
  )
}

function Head({ look }: { look: Look }) {
  return (
    <group position={[0, 0.48, 0]}>
      <mesh castShadow material={skin(look.skin)}>
        <sphereGeometry args={[0.12, 18, 16]} />
      </mesh>
      <mesh position={[0, 0.04, 0]} material={cloth(look.hair, 0.65)}>
        <sphereGeometry args={[0.125, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      </mesh>
      {look.outfit === 'vp' ? (
        <mesh position={[0, 0.1, -0.04]} material={cloth(look.hair)}>
          <sphereGeometry args={[0.05, 10, 10]} />
        </mesh>
      ) : null}
      <mesh position={[-0.04, 0.02, 0.1]} material={skin('#1a120e')}>
        <sphereGeometry args={[0.012, 8, 8]} />
      </mesh>
      <mesh position={[0.04, 0.02, 0.1]} material={skin('#1a120e')}>
        <sphereGeometry args={[0.012, 8, 8]} />
      </mesh>
      {look.glasses ? (
        <mesh position={[0, 0.02, 0.11]} material={cloth('#241820', 0.3)}>
          <boxGeometry args={[0.14, 0.012, 0.01]} />
        </mesh>
      ) : null}
      {look.headset ? (
        <mesh position={[0.11, 0.0, 0]} material={cloth('#1a2830', 0.4)}>
          <boxGeometry args={[0.03, 0.05, 0.04]} />
        </mesh>
      ) : null}
    </group>
  )
}
