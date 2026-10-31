import { forwardRef, useImperativeHandle, useRef, type RefObject } from 'react'
import { ACESFilmicToneMapping, Vector3 } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { isWaiting } from '../motion.ts'
import {
  buildFloorLabels,
  placeLabels,
  poseView,
  type FloorAgent,
  type Pose,
  type Vec,
} from '../motion.ts'
import { CAMERA_HOME } from './palette.ts'
import { OfficeWorld } from './Rooms.tsx'
import { PersonMesh } from './PersonMesh.tsx'
import { yawFor } from './facing.ts'

export type OfficeView = { reset: () => void }

type Props = {
  agents: FloorAgent[]
  poses: Pose[]
  selected: string | null
  onSelect: (slug: string) => void
  labelRoot: RefObject<HTMLDivElement | null>
}

const OfficeCanvas = forwardRef<OfficeView, Props>(function OfficeCanvas(props, ref) {
  const controls = useRef<OrbitControlsImpl>(null)
  useImperativeHandle(ref, () => ({
    reset() {
      const orbit = controls.current
      if (!orbit) return
      orbit.object.position.set(...CAMERA_HOME.position)
      orbit.target.set(...CAMERA_HOME.target)
      orbit.update()
    },
  }))
  return (
    <Canvas
      className="office-canvas"
      shadows={false}
      dpr={[1, 1.25]}
      camera={{ position: CAMERA_HOME.position, fov: 36, near: 0.08, far: 80 }}
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <color attach="background" args={['#100c14']} />
      <fog attach="fog" args={['#100c14', 22, 42]} />
      <hemisphereLight args={['#b7c6de', '#4a3428', 1.05]} />
      <ambientLight intensity={0.55} color="#ffe8d2" />
      <directionalLight position={[5, 14, 9]} intensity={1.8} color="#ffe0c2" />
      <OfficeWorld agents={props.agents} />
      <Crew agents={props.agents} poses={props.poses} onSelect={props.onSelect} />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3.2}
        maxDistance={24}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.08}
      />
      <Aim />
      <LabelProjector agents={props.agents} poses={props.poses} selected={props.selected} labelRoot={props.labelRoot} />
    </Canvas>
  )
})

export default OfficeCanvas

function Aim() {
  const camera = useThree((state) => state.camera)
  const controls = useThree((state) => state.controls as unknown as OrbitControlsImpl | null)
  const ready = useRef(false)
  useFrame(() => {
    if (ready.current || !controls) return
    camera.position.set(...CAMERA_HOME.position)
    controls.target.set(...CAMERA_HOME.target)
    controls.update()
    ready.current = true
  })
  return null
}

function Crew({
  agents,
  poses,
  onSelect,
}: {
  agents: FloorAgent[]
  poses: Pose[]
  onSelect: (slug: string) => void
}) {
  const bySlug = new Map(poses.map((pose) => [pose.slug, pose]))
  return (
    <group>
      {agents.map((agent) => {
        const pose = bySlug.get(agent.slug)
        if (!pose) return null
        const view = poseView(pose)
        if (!view) return null
        const gait = view.walking ? 'walk' : pose.body
        return (
          <group
            key={agent.slug}
            position={[view.x, 0, view.y]}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(agent.slug)
            }}
          >
            <PersonMesh
              slug={agent.slug}
              gait={gait}
              phase={pose.traveled * 6.2}
              yaw={yawFor(pose, agent.slug)}
              waiting={isWaiting(agent)}
            />
          </group>
        )
      })}
    </group>
  )
}

function LabelProjector({
  agents,
  poses,
  selected,
  labelRoot,
}: {
  agents: FloorAgent[]
  poses: Pose[]
  selected: string | null
  labelRoot: RefObject<HTMLDivElement | null>
}) {
  const { camera, size } = useThree()
  const scratch = useRef(new Vector3())
  const bySlug = new Map(poses.map((pose) => [pose.slug, pose]))
  useFrame(() => {
    const root = labelRoot.current
    if (!root) return
    const personAt: Record<string, Vec | null> = {}
    for (const agent of agents) {
      const pose = bySlug.get(agent.slug)
      const view = pose ? poseView(pose) : null
      personAt[agent.slug] = view ? { x: view.x, y: view.y } : null
    }
    const toScreen = (point: Vec) => {
      scratch.current.set(point.x, 1.62, point.y)
      scratch.current.project(camera)
      return {
        x: (scratch.current.x * 0.5 + 0.5) * size.width,
        y: (-scratch.current.y * 0.5 + 0.5) * size.height,
      }
    }
    const specs = buildFloorLabels(agents, personAt, selected, toScreen).map((spec) => ({
      ...spec,
      lift: spec.h > 20 ? 18 : 8,
    }))
    const placed = placeLabels(specs)
    for (const label of placed) {
      const el = root.querySelector<HTMLElement>(`[data-floor-label="${label.id}"]`)
      if (!el) continue
      el.style.display = 'grid'
      el.style.transform = `translate(${label.x}px, ${label.y}px)`
    }
  })
  return null
}
