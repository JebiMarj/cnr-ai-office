export type DemoStore = {
  read: () => string | null
  write: (value: string | null) => void
}

export function memoryStore(initial: string | null = null): DemoStore {
  let value = initial
  return {
    read: () => value,
    write: (next) => {
      value = next
    },
  }
}

export function sessionStore(key: string): DemoStore {
  return {
    read: () => {
      try {
        return sessionStorage.getItem(key)
      } catch {
        return null
      }
    },
    write: (value) => {
      try {
        if (value == null) sessionStorage.removeItem(key)
        else sessionStorage.setItem(key, value)
      } catch {
        /* This tab cannot persist the sample. The in-memory copy still runs. */
      }
    },
  }
}

export function sessionKey(workspace: string): string {
  return `cnri-showcase-session-v1:${workspace}`
}

export function pendingKey(workspace: string): string {
  return `cnri-showcase-pending-v1:${workspace}`
}

export function writePendingGoal(goal: string, store: DemoStore): void {
  store.write(goal)
}

export function takePendingGoal(store: DemoStore): string | null {
  const value = store.read()
  if (!value || !value.trim()) return null
  store.write(null)
  return value
}
