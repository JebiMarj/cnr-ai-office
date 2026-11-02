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
  rotate: { position: [-2.2, 12.4, 1.6], target: [8.1, 0.5, 6.1] },
  offices: { position: [8.8, 6.6, 8.2], target: [3.8, 0.7, 2.05] },
  pods: { position: [4.1, 7.4, 14.2], target: [4.05, 0.55, 7.7] },
  lounge: { position: [18.6, 7.2, 16.4], target: [13.6, 0.45, 9.5] },
  kitchen: { position: [13.6, 5.8, 7.2], target: [10.55, 0.75, 2.15] },
  meeting: { position: [17.8, 6.4, 8.6], target: [14.25, 0.65, 4.7] },
}
