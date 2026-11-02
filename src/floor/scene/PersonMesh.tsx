import { useLayoutEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three'
import type { BodyPose } from '../motion.ts'
import { lookFor, type Look } from '../looks.ts'
import { accent } from './palette.ts'

const skinMat = new Map<string, MeshStandardMaterial>()
const clothMat = new Map<string, MeshStandardMaterial>()

function skin(color: string) {
  let mat = skinMat.get(color)
  if (!mat) {
    mat = new MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.02 })
    skinMat.set(color, mat)
  }
  return mat
}

function cloth(color: string, rough = 0.7) {
  let mat = clothMat.get(`${color}-${rough}`)
  if (!mat) {
    mat = new MeshStandardMaterial({ color, roughness: rough, metalness: 0.03 })
    clothMat.set(`${color}-${rough}`, mat)
  }
  return mat
}

const eyeWhite = new MeshStandardMaterial({ color: '#f7f5f2', roughness: 0.3 })
const pupilMat = new MeshStandardMaterial({ color: '#1a120e', roughness: 0.35 })
const mouthMat = new MeshStandardMaterial({ color: '#a15a52', roughness: 0.5 })

const thighGeo = new CapsuleGeometry(0.058, 0.3, 3, 8)
const shinGeo = new CapsuleGeometry(0.048, 0.28, 3, 8)
const armGeo = new CapsuleGeometry(0.044, 0.22, 3, 8)
const foreGeo = new CapsuleGeometry(0.038, 0.2, 3, 8)
const torsoGeo = new CapsuleGeometry(0.132, 0.28, 4, 10)
const headGeo = new SphereGeometry(0.112, 20, 16)
const neckGeo = new CylinderGeometry(0.046, 0.054, 0.08, 12)
const handGeo = new BoxGeometry(0.058, 0.072, 0.03)
const shoeGeo = new BoxGeometry(0.1, 0.05, 0.2)
const soleGeo = new BoxGeometry(0.108, 0.018, 0.21)

const STATURE: Record<string, number> = {
  jv: 1.045,
  marj: 1,
  alex: 0.97,
  mechanicus: 1.03,
  sage: 1.005,
  dev: 0.985,
  tech: 1.02,
  gia: 0.96,
}

type Parts = {
  root: Group | null
  hip: Group | null
  thighL: Group | null
  thighR: Group | null
  kneeL: Group | null
  kneeR: Group | null
  armL: Group | null
  armR: Group | null
  elbowL: Group | null
  elbowR: Group | null
  spine: Group | null
}

function poseLeg(thigh: Group, knee: Group, swing: number, sit: number, bend: number) {
  thigh.rotation.x = swing * 0.62 * (1 - sit) + sit * 1.28
  knee.rotation.x = -bend * (1 - sit) - sit * 1.22
}

function poseArm(arm: Group, elbow: Group, swing: number, sit: number, side: number) {
  arm.rotation.x = swing * 0.55 * (1 - sit) + 0.12 * (1 - sit) + sit * 0.62
  arm.rotation.z = side * 0.1
  elbow.rotation.x = -0.2 * (1 - sit) - sit * 1.05
}

function apply(parts: Parts, sit: number, phase: number, walking: boolean) {
  if (!parts.root || !parts.hip || !parts.spine) return
  if (!parts.thighL || !parts.thighR || !parts.kneeL || !parts.kneeR) return
  if (!parts.armL || !parts.armR || !parts.elbowL || !parts.elbowR) return
  const step = walking ? Math.sin(phase) : 0
  parts.root.position.y = walking ? Math.abs(Math.sin(phase * 2)) * 0.03 : 0
  parts.hip.position.y = 1 - sit * 0.46
  parts.hip.position.z = sit * 0.04
  const bendL = walking ? Math.max(0, Math.sin(phase + 0.35)) * 0.75 : 0
  const bendR = walking ? Math.max(0, Math.sin(phase + Math.PI + 0.35)) * 0.75 : 0
  poseLeg(parts.thighL, parts.kneeL, step, sit, bendL)
  poseLeg(parts.thighR, parts.kneeR, -step, sit, bendR)
  poseArm(parts.armL, parts.elbowL, -step, sit, -1)
  poseArm(parts.armR, parts.elbowR, step, sit, 1)
  parts.spine.rotation.y = walking ? -step * 0.1 : 0
  parts.spine.rotation.x = walking ? 0.06 : sit * 0.05
}

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
  const parts = useRef<Parts>({
    root: null,
    hip: null,
    thighL: null,
    thighR: null,
    kneeL: null,
    kneeR: null,
    armL: null,
    armR: null,
    elbowL: null,
    elbowR: null,
    spine: null,
  })
  const gaitRef = useRef(gait)
  const phaseRef = useRef(phase)
  gaitRef.current = gait
  phaseRef.current = phase

  useLayoutEffect(() => {
    apply(parts.current, gait === 'sit' ? 1 : 0, phase, gait === 'walk')
  }, [gait, phase])

  useFrame((_, dt) => {
    const walking = gaitRef.current === 'walk'
    const sitTarget = gaitRef.current === 'sit' ? 1 : 0
    const current = parts.current.hip ? parts.current.hip.position.y : 1
    const sitNow = (1 - current) / 0.46
    const k = 1 - Math.exp(-dt * (walking ? 14 : 9))
    const sit = sitNow + (sitTarget - sitNow) * (gaitRef.current === 'walk' ? 1 : k)
    apply(parts.current, Math.min(1, Math.max(0, sit)), phaseRef.current, walking)
  })

  const exec = look.outfit === 'suit' || look.outfit === 'vp'
  return (
    <group rotation={[0, yaw, 0]} scale={STATURE[slug] ?? 1}>
      {waiting ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.32, 0.4, 28]} />
          <meshBasicMaterial color={accent.light} toneMapped={false} />
        </mesh>
      ) : null}
      <group ref={(node) => { parts.current.root = node }}>
        <group ref={(node) => { parts.current.hip = node }} position={[0, 1, 0]}>
          <Leg side={-1} look={look} thighRef={(node) => { parts.current.thighL = node }} kneeRef={(node) => { parts.current.kneeL = node }} />
          <Leg side={1} look={look} thighRef={(node) => { parts.current.thighR = node }} kneeRef={(node) => { parts.current.kneeR = node }} />
          <group ref={(node) => { parts.current.spine = node }}>
            <Torso look={look} exec={exec} />
            <Arm side={-1} look={look} hold={look.tablet} shoulderRef={(node) => { parts.current.armL = node }} elbowRef={(node) => { parts.current.elbowL = node }} />
            <Arm side={1} look={look} shoulderRef={(node) => { parts.current.armR = node }} elbowRef={(node) => { parts.current.elbowR = node }} />
            <Head look={look} />
          </group>
        </group>
      </group>
    </group>
  )
}

function Leg({
  side,
  look,
  thighRef,
  kneeRef,
}: {
  side: number
  look: Look
  thighRef: (node: Group | null) => void
  kneeRef: (node: Group | null) => void
}) {
  const heel = look.outfit === 'vp'
  return (
    <group ref={thighRef} position={[side * 0.09, 0.02, 0]}>
      <mesh geometry={thighGeo} material={cloth(look.pants)} position={[0, -0.208, 0]} castShadow />
      <group ref={kneeRef} position={[0, -0.416, 0]}>
        <mesh geometry={shinGeo} material={cloth(look.pants, 0.78)} position={[0, -0.188, 0]} castShadow />
        <mesh geometry={heel ? soleGeo : shoeGeo} material={cloth(look.shoes, 0.42)} position={[0, -0.4, heel ? 0.02 : 0.05]} castShadow />
        {heel ? <mesh position={[0, -0.36, -0.04]} material={cloth(look.shoes, 0.4)}><boxGeometry args={[0.07, 0.08, 0.05]} /></mesh> : null}
      </group>
    </group>
  )
}

function Arm({
  side,
  look,
  hold = false,
  shoulderRef,
  elbowRef,
}: {
  side: number
  look: Look
  hold?: boolean
  shoulderRef: (node: Group | null) => void
  elbowRef: (node: Group | null) => void
}) {
  return (
    <group ref={shoulderRef} position={[side * 0.2, 0.38, 0]}>
      <mesh geometry={armGeo} material={cloth(look.top)} position={[0, -0.154, 0]} castShadow />
      <group ref={elbowRef} position={[0, -0.308, 0]}>
        <mesh geometry={foreGeo} material={cloth(look.top)} position={[0, -0.138, 0]} castShadow />
        <mesh geometry={handGeo} material={skin(look.skin)} position={[side * 0.01, -0.29, 0.02]} castShadow />
        {hold ? (
          <mesh position={[0, -0.3, 0.06]} rotation={[0.4, 0, side * 0.2]}>
            <boxGeometry args={[0.16, 0.22, 0.012]} />
            <meshStandardMaterial color="#f6f1e8" roughness={0.42} />
          </mesh>
        ) : null}
      </group>
    </group>
  )
}

function Torso({ look, exec }: { look: Look; exec: boolean }) {
  const tailored = look.outfit === 'suit' ? 1.12 : look.outfit === 'vp' ? 1.04 : 1
  return (
    <group>
      <mesh geometry={torsoGeo} material={cloth(look.top)} position={[0, 0.18, 0]} scale={[tailored, 1, exec ? 0.96 : 1]} castShadow />
      <mesh position={[0, 0.04, 0]} material={cloth('#241c18', 0.55)}>
        <cylinderGeometry args={[0.145 * tailored, 0.15 * tailored, 0.045, 14]} />
      </mesh>
      <mesh position={[0, 0.22, 0.12]} material={cloth(look.shirt, 0.48)}>
        <boxGeometry args={[look.tie ? 0.07 : 0.1, look.tie ? 0.16 : 0.12, 0.02]} />
      </mesh>
      {look.tie ? (
        <group>
          <mesh position={[0, 0.26, 0.135]} material={cloth(look.accent, 0.38)}>
            <boxGeometry args={[0.045, 0.045, 0.016]} />
          </mesh>
          <mesh position={[0, 0.14, 0.132]} material={cloth(look.accent, 0.4)}>
            <boxGeometry args={[0.034, 0.18, 0.012]} />
          </mesh>
        </group>
      ) : null}
      {exec ? (
        <group>
          <mesh position={[-0.06, 0.24, 0.11]} rotation={[0.15, 0.35, 0.55]} material={cloth(look.top, 0.58)}>
            <boxGeometry args={[0.07, 0.16, 0.018]} />
          </mesh>
          <mesh position={[0.06, 0.24, 0.11]} rotation={[0.15, -0.35, -0.55]} material={cloth(look.top, 0.58)}>
            <boxGeometry args={[0.07, 0.16, 0.018]} />
          </mesh>
        </group>
      ) : null}
      {look.outfit === 'hoodie' ? (
        <mesh position={[0, 0.42, 0.02]} material={cloth(look.top)}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
      ) : null}
    </group>
  )
}

function Head({ look }: { look: Look }) {
  return (
    <group position={[0, 0.62, 0]}>
      <mesh geometry={neckGeo} material={skin(look.skin)} position={[0, -0.08, 0]} castShadow />
      <mesh geometry={headGeo} material={skin(look.skin)} castShadow scale={[0.96, 1.06, 1]} />
      <Hair look={look} />
      <mesh position={[-0.11, -0.01, 0]} material={skin(look.skin)}>
        <sphereGeometry args={[0.022, 10, 8]} />
      </mesh>
      <mesh position={[0.11, -0.01, 0]} material={skin(look.skin)}>
        <sphereGeometry args={[0.022, 10, 8]} />
      </mesh>
      <mesh position={[-0.038, 0.012, 0.098]} material={eyeWhite}>
        <sphereGeometry args={[0.016, 10, 8]} />
      </mesh>
      <mesh position={[0.038, 0.012, 0.098]} material={eyeWhite}>
        <sphereGeometry args={[0.016, 10, 8]} />
      </mesh>
      <mesh position={[-0.038, 0.01, 0.11]} material={pupilMat}>
        <sphereGeometry args={[0.008, 8, 8]} />
      </mesh>
      <mesh position={[0.038, 0.01, 0.11]} material={pupilMat}>
        <sphereGeometry args={[0.008, 8, 8]} />
      </mesh>
      <mesh position={[-0.038, 0.04, 0.1]} rotation={[0, 0, 0.25]} material={cloth(look.hair, 0.6)}>
        <boxGeometry args={[0.032, 0.008, 0.01]} />
      </mesh>
      <mesh position={[0.038, 0.04, 0.1]} rotation={[0, 0, -0.25]} material={cloth(look.hair, 0.6)}>
        <boxGeometry args={[0.032, 0.008, 0.01]} />
      </mesh>
      <mesh position={[0, -0.012, 0.108]} material={skin(look.skin)}>
        <sphereGeometry args={[0.012, 8, 8]} />
      </mesh>
      <mesh position={[0, -0.038, 0.1]} material={mouthMat}>
        <boxGeometry args={[0.036, 0.008, 0.01]} />
      </mesh>
      {look.glasses ? (
        <group position={[0, 0.012, 0.1]}>
          <mesh position={[-0.038, 0, 0.012]}>
            <torusGeometry args={[0.02, 0.004, 6, 14]} />
            <meshStandardMaterial color="#241820" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0.038, 0, 0.012]}>
            <torusGeometry args={[0.02, 0.004, 6, 14]} />
            <meshStandardMaterial color="#241820" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.012]}>
            <boxGeometry args={[0.02, 0.006, 0.006]} />
            <meshStandardMaterial color="#241820" />
          </mesh>
        </group>
      ) : null}
      {look.headset ? (
        <group>
          <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} material={cloth('#1a2830', 0.45)}>
            <torusGeometry args={[0.1, 0.012, 6, 16, Math.PI]} />
          </mesh>
          <mesh position={[0.11, 0, 0.02]} material={cloth('#1a2830', 0.4)}>
            <boxGeometry args={[0.03, 0.06, 0.05]} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}

function Hair({ look }: { look: Look }) {
  const mat = cloth(look.hair, 0.68)
  if (look.outfit === 'vp') {
    return (
      <group>
        <mesh material={mat} position={[0, 0.02, -0.02]} scale={[1.04, 0.78, 1.06]} castShadow>
          <sphereGeometry args={[0.118, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.66]} />
        </mesh>
        <mesh material={mat} position={[0.06, -0.04, -0.09]} castShadow>
          <sphereGeometry args={[0.048, 12, 10]} />
        </mesh>
      </group>
    )
  }
  if (look.outfit === 'creative') {
    return (
      <group>
        <mesh material={mat} position={[0, 0.0, -0.01]} scale={[1.05, 0.9, 1.08]} castShadow>
          <sphereGeometry args={[0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
        </mesh>
        <mesh material={mat} position={[0.02, -0.06, -0.12]} rotation={[0.7, 0, 0]} castShadow>
          <capsuleGeometry args={[0.028, 0.12, 3, 6]} />
        </mesh>
      </group>
    )
  }
  if (look.outfit === 'cardigan') {
    return (
      <mesh material={mat} position={[0, 0.015, -0.02]} scale={[1.04, 0.78, 1.08]} castShadow>
        <sphereGeometry args={[0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
      </mesh>
    )
  }
  return (
    <mesh material={mat} position={[0, 0.03, -0.015]} scale={[1.03, 0.62, 1.05]} castShadow>
      <sphereGeometry args={[0.118, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
    </mesh>
  )
}
