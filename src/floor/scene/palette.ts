import { PerspectiveCamera, Vector3 } from 'three'

/** Floor accents JV asked for. The header brand stays the sampled logo colours. */
export const accent = {
  pink: '#E4386E',
  orange: '#F9A23C',
  light: '#FDBE6A',
} as const

export const night = {
  wall: '#e6e3dc',
  skirting: '#f6f3ed',
  wood: '#e4c89a',
  woodEdge: '#b58958',
  carpet: '#c4c2c8',
  tile: '#f3f1ec',
  metal: '#aeb6bf',
  glass: '#c5d4e4',
  trim: '#f4f0e8',
  ground: '#322c38',
} as const

const scratch = new Vector3()
const cam = new PerspectiveCamera(33, 1, 0.08, 90)
const target = new Vector3(8.15, 0.35, 5.9)
const view = new Vector3(0.32, 1.05, 0.82).normalize()

const OFFICE_CORNERS: Array<[number, number, number]> = [
  [-0.2, 0, -0.2],
  [16.6, 0, -0.2],
  [-0.2, 0, 12.45],
  [16.6, 0, 12.45],
  [-0.2, 2.65, -0.2],
  [16.6, 2.65, -0.2],
  [-0.2, 2.65, 12.45],
  [16.6, 2.65, 12.45],
]

/** 3/4 from the south-east, high enough to read the plan, tight enough to fill the frame. */
export function frameOffice(aspect: number): { position: [number, number, number]; target: [number, number, number] } {
  cam.fov = 33
  cam.aspect = Math.max(0.45, aspect)
  cam.near = 0.08
  cam.far = 90
  let lo = 8
  let hi = 48
  for (let i = 0; i < 22; i += 1) {
    const dist = (lo + hi) / 2
    cam.position.copy(target).addScaledVector(view, dist)
    cam.lookAt(target)
    cam.updateProjectionMatrix()
    cam.updateMatrixWorld()
    let maxNdc = 0
    for (const corner of OFFICE_CORNERS) {
      scratch.set(corner[0], corner[1], corner[2]).project(cam)
      maxNdc = Math.max(maxNdc, Math.abs(scratch.x), Math.abs(scratch.y))
    }
    if (maxNdc > 0.88) lo = dist
    else hi = dist
  }
  const position = target.clone().addScaledVector(view, hi)
  return {
    position: [position.x, position.y, position.z],
    target: [target.x, target.y, target.z],
  }
}

export const CAMERA_HOME = frameOffice(1.55)

export const SHOTS: Record<string, { position: [number, number, number]; target: [number, number, number] }> = {
  rotate: { position: [-1.2, 11.2, 2.4], target: [8.3, 0.45, 6.4] },
  offices: { position: [7.4, 5.4, 6.6], target: [4.0, 0.75, 2.1] },
  pods: { position: [4.15, 5.6, 12.2], target: [4.1, 0.65, 7.85] },
  lounge: { position: [11.6, 5.6, 15.2], target: [14.4, 0.5, 10.3] },
  kitchen: { position: [12.8, 5.4, 6.8], target: [10.5, 0.55, 2.3] },
  meeting: { position: [16.4, 5.2, 7.6], target: [14.25, 0.7, 4.7] },
}
