import { useEffect, useState, useSyncExternalStore } from 'react'
import { brand } from './brand.tsx'
import { ActivityFeed } from './components/ActivityFeed.tsx'
import { ApprovalsDesk } from './components/ApprovalsDesk.tsx'
import { Background } from './components/Background.tsx'
import { BossOffice } from './components/BossOffice.tsx'
import { DeskCard } from './components/DeskCard.tsx'
import { Header } from './components/Header.tsx'
import { createLiveSource } from './data/liveSource.ts'
import { createMockSource, staffAgents } from './data/mockSource.ts'
import { previewIsMock, readLiveConfig } from './data/mode.ts'
import { createOfficeStore, type OfficeStore } from './data/store.ts'

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
  useEffect(() => {
    store.start()
    return () => store.destroy()
  }, [store])
  const snapshot = useSyncExternalStore(store.subscribe, store.getState, store.getState)
  const now = useNow()
  const boss = snapshot.agents.find((agent) => agent.isBoss) ?? null
  const staff = staffAgents(snapshot.agents)

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
        <main className="layout">
          <div className="stage">
            {boss ? (
              <BossOffice agent={boss} snapshot={snapshot} now={now} />
            ) : (
              <section className="panel boss-empty">
                {snapshot.connection === 'connecting' ? 'Opening the floor…' : 'The corner office is empty.'}
              </section>
            )}
            <section className="floor" aria-labelledby="floor-heading">
              <div className="section-head">
                <p className="kicker">{brand.floor}</p>
                <h2 id="floor-heading">The floor</h2>
              </div>
              {staff.length === 0 ? (
                <p className="empty">No desks are staffed yet.</p>
              ) : (
                <div className="desk-grid">
                  {staff.map((agent, index) => (
                    <DeskCard key={agent.id} agent={agent} now={now} index={index} />
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className="rail">
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
