import { toSceneAgents, type SceneAgent } from './scene.ts'
import type { OfficeListener, OfficeSnapshot, OfficeSource } from './types.ts'

/**
 * Phase 2 seam. A walking office scene should subscribe here and read
 * getSceneAgents(). The React dashboard is just one consumer of this store.
 */
export type OfficeStore = {
  getState: () => OfficeSnapshot
  subscribe: (listener: OfficeListener) => () => void
  getSceneAgents: (now?: Date) => SceneAgent[]
  start: () => void
  destroy: () => void
}

export function createOfficeStore(source: OfficeSource): OfficeStore {
  let snapshot = source.initial
  const listeners = new Set<OfficeListener>()
  let stop = () => {}
  let started = false

  return {
    getState: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getSceneAgents(now = new Date()) {
      return toSceneAgents(snapshot, now)
    },
    start() {
      if (started) return
      started = true
      stop = source.start((next) => {
        snapshot = next
        listeners.forEach((listener) => listener())
      })
    },
    destroy() {
      stop()
      stop = () => {}
      started = false
    },
  }
}
