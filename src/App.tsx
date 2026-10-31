import { useEffect, useState, useSyncExternalStore } from 'react'
import { brand } from './brand.tsx'
import { ActivityFeed } from './components/ActivityFeed.tsx'
import { ApprovalsDesk } from './components/ApprovalsDesk.tsx'
import { Background } from './components/Background.tsx'
import { BossOffice } from './components/BossOffice.tsx'
import { DeskCard } from './components/DeskCard.tsx'
import { Header } from './components/Header.tsx'
import { createLiveSource } from './data/liveSource.ts'
import { createMockSource } from './data/mockSource.ts'
import { previewIsMock, readLiveConfig } from './data/mode.ts'
import { isExecutive } from './data/shift.ts'
import { createOfficeStore, type OfficeStore } from './data/store.ts'
import { OfficeFloor } from './floor/OfficeFloor.tsx'
import { toFloorAgents } from './floor/motion.ts'

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function createSource() {
  if (previewIsMock(window.location.search)) return createMockSource()
  const config = readLiveConfig({
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })
  return createLiveSource(config!)
}

export function App() {
  const [store] = useState<OfficeStore>(() => createOfficeStore(createSource()))
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [boardOpen, setBoardOpen] = useState(() => window.matchMedia('(min-width: 961px)').matches)
  useEffect(() => {
    store.start()
    return () => store.destroy()
  }, [store])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedSlug(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const snapshot = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const now = useNow()
  const floorAgents = toFloorAgents(snapshot, new Date(now))
  const selected = snapshot.agents.find((agent) => agent.slug === selectedSlug) ?? null
  const pending = snapshot.approvals.filter((item) => item.status === 'pending').length

  return (
    <>
      <Background />
      <div className="app">
        <Header snapshot={snapshot} now={now} />
        {snapshot.connection === 'offline' ? (
          <p className="banner" role="status">
            The live floor did not respond. Check the Supabase URL and anon key, then rebuild the site.
          </p>
        ) : null}
        <main className={`layout${boardOpen ? ' board-open' : ''}`}>
          <section className="office-hero" aria-labelledby="floor-heading">
            <div className="hero-bar">
              <div className="section-head">
                <p className="kicker">{brand.floor}</p>
                <h2 id="floor-heading">The floor</h2>
              </div>
              <button
                type="button"
                className="board-toggle"
                aria-expanded={boardOpen}
                onClick={() => setBoardOpen((open) => !open)}
              >
                {boardOpen ? 'Hide board' : 'Activity & approvals'}
                {pending > 0 ? <span className="board-count">{pending}</span> : null}
              </button>
            </div>
            {snapshot.connection === 'connecting' && floorAgents.length === 0 ? (
              <p className="empty panel">Opening the floor…</p>
            ) : floorAgents.length === 0 ? (
              <p className="empty panel">The floor is empty.</p>
            ) : (
              <OfficeFloor
                agents={floorAgents}
                selectedSlug={selectedSlug}
                onSelect={(slug) => {
                  setSelectedSlug((current) => (current === slug ? null : slug))
                  setBoardOpen(true)
                }}
              />
            )}
          </section>
          <aside className="rail" aria-label="Floor board">
            {selected ? (
              <div className="detail-wrap" data-testid="agent-detail">
                <div className="detail-bar">
                  <p className="kicker">Selected</p>
                  <button type="button" className="detail-close" onClick={() => setSelectedSlug(null)}>
                    Close
                  </button>
                </div>
                {isExecutive(selected) ? (
                  <BossOffice agent={selected} now={now} />
                ) : (
                  <DeskCard agent={selected} now={now} />
                )}
              </div>
            ) : (
              <p className="empty panel detail-hint">Select a person or a desk on the floor.</p>
            )}
            <ApprovalsDesk approvals={snapshot.approvals} now={now} />
            <ActivityFeed activities={snapshot.activities} now={now} />
          </aside>
        </main>
        <footer className="site-footer">
          <p>{brand.company}</p>
          <p>Read-only floor</p>
        </footer>
      </div>
    </>
  )
}
