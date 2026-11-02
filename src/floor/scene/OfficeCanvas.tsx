import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type RefObject } from 'react'
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, Vector3, type DirectionalLight, type PerspectiveCamera } from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, OrbitControls } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
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
import { CAMERA_HOME, SHOTS, frameOffice } from './palette.ts'
import { DeskNameplates, OfficeWorld } from './Rooms.tsx'
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

type Frame = { position: [number, number, number]; target: [number, number, number] }

function shotFrame(): Frame | null {
  if (typeof window === 'undefined') return null
  const shot = new URLSearchParams(window.location.search).get('shot')
  return shot && SHOTS[shot] ? SHOTS[shot] : null
}

function viewFor(aspect: number): Frame {
  return shotFrame() ?? frameOffice(aspect)
}

function applyFrame(camera: PerspectiveCamera, controls: OrbitControlsImpl, frame: Frame) {
  camera.fov = 33
  camera.position.set(...frame.position)
  camera.updateProjectionMatrix()
  controls.target.set(...frame.target)
  controls.update()
}

const OfficeCanvas = forwardRef<OfficeView, Props>(function OfficeCanvas(props, ref) {
  const controls = useRef<OrbitControlsImpl>(null)
  useImperativeHandle(ref, () => ({
    reset() {
      const orbit = controls.current
      const camera = orbit?.object
      if (!orbit || !camera || !('isPerspectiveCamera' in camera)) return
      applyFrame(camera as PerspectiveCamera, orbit, frameOffice(camera.aspect || 1.55))
    },
  }))
  return (
    <Canvas
      className="office-canvas"
      shadows
      dpr={[1, 1.5]}
      camera={{ position: CAMERA_HOME.position, fov: 33, near: 0.08, far: 90 }}
      gl={{
        antialias: false,
        alpha: false,
        preserveDrawingBuffer: true,
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.04,
        outputColorSpace: SRGBColorSpace,
      }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = PCFSoftShadowMap
      }}
    >
      <color attach="background" args={['#161018']} />
      <hemisphereLight args={['#fff6ea', '#d9c6b0', 0.32]} />
      <ambientLight intensity={0.18} color="#fff4ea" />
      <KeyLight />
      <directionalLight position={[-7, 8, -3]} intensity={0.22} color="#d7e3f6" />
      <Environment files="/hdri/studio_small_03_1k.hdr" environmentIntensity={0.32} background={false} />
      <ContactShadows position={[8.2, 0.03, 6.1]} opacity={0.32} scale={22} blur={2.6} far={3.4} resolution={512} color="#2c241c" />
      <OfficeWorld agents={props.agents} />
      <DeskNameplates agents={props.agents} poses={props.poses} />
      <Crew agents={props.agents} poses={props.poses} onSelect={props.onSelect} />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={3.4}
        maxDistance={32}
        minPolarAngle={0.28}
        maxPolarAngle={Math.PI / 2.08}
        target={CAMERA_HOME.target}
      />
      <Aim />
      <LabelProjector agents={props.agents} poses={props.poses} selected={props.selected} labelRoot={props.labelRoot} />
      <EffectComposer enableNormalPass multisampling={4}>
        <N8AO halfRes aoRadius={0.62} intensity={1.05} distanceFalloff={0.55} quality="performance" color="#241c18" />
        <Bloom mipmapBlur luminanceThreshold={1.08} intensity={0.42} luminanceSmoothing={0.24} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
})

export default OfficeCanvas

function KeyLight() {
  const light = useRef<DirectionalLight>(null)
  useLayoutEffect(() => {
    const lamp = light.current
    if (!lamp) return
    lamp.target.position.set(8.2, 0, 5.8)
    lamp.target.updateMatrixWorld(true)
  }, [])
  return (
    <directionalLight
      ref={light}
      position={[8.4, 16.5, 12.5]}
      intensity={1.22}
      color="#fff3e4"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-bias={-0.00035}
      shadow-normalBias={0.045}
      shadow-camera-near={2}
      shadow-camera-far={36}
      shadow-camera-left={-13}
      shadow-camera-right={13}
      shadow-camera-top={12}
      shadow-camera-bottom={-12}
    />
  )
}

function Aim() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const controls = useThree((state) => state.controls as unknown as OrbitControlsImpl | null)
  const ready = useRef(false)
  useFrame(() => {
    if (ready.current || !controls || size.width < 2) return
    if (!('isPerspectiveCamera' in camera)) return
    applyFrame(camera as PerspectiveCamera, controls, viewFor(size.width / Math.max(1, size.height)))
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
      scratch.current.set(point.x, 1.82, point.y)
      scratch.current.project(camera)
      return {
        x: (scratch.current.x * 0.5 + 0.5) * size.width,
        y: (-scratch.current.y * 0.5 + 0.5) * size.height,
      }
    }
    const specs = buildFloorLabels(agents, personAt, selected, toScreen).map((spec) => ({
      ...spec,
      lift: spec.h > 20 ? 20 : 12,
    }))
    const placed = placeLabels(specs)
    const seen = new Set(placed.map((label) => label.id))
    root.querySelectorAll<HTMLElement>('[data-floor-label]').forEach((el) => {
      const id = el.dataset.floorLabel
      if (id && !seen.has(id)) el.style.display = 'none'
    })
    for (const label of placed) {
      const el = root.querySelector<HTMLElement>(`[data-floor-label="${label.id}"]`)
      if (!el) continue
      el.style.display = 'grid'
      el.style.transform = `translate(${label.x}px, ${label.y}px)`
    }
  })
  return null
}
