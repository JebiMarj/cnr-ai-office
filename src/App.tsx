import { useEffect, useMemo, useState } from 'react'
import type { Snapshot, Teammate, Tenant } from './types.ts'
import { emptySnapshot, startDemo, startLive } from './data.ts'
import { OfficeFloor } from './OfficeFloor.tsx'
import { Icon } from './icons.tsx'
import { ago, greeting, longDate } from './time.ts'
import { CommandCenter, stageShowcaseGoal } from './showcase/CommandCenter.tsx'
import { CoreMark } from './showcase/CoreMark.tsx'
import { SHOWCASE_BANNER } from './showcase/copy.ts'
import { isJarvisWorkspace } from './showcase/roster.ts'
import { describeOfficeFeed } from './showcase/feed.ts'

type Page = 'office' | 'jarvis' | 'chat' | 'needs' | 'team' | 'board' | 'reports' | 'usage' | 'settings'
const STATUS_LABEL: Record<string, string> = { working: 'Working', waiting_on_jv: 'Hand up · waiting on you', idle: 'Done · standing by', offline: 'Offline' }

type NeedItem = { key: string; slug: string; title: string; since: string; kind: 'approval' | 'waiting' }

function usePage(): [Page, (p: Page) => void] {
  const read = () => (window.location.hash.replace('#/', '') || 'office') as Page
  const [page, setPage] = useState<Page>(read())
  useEffect(() => {
    const f = () => setPage(read())
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return [page, (p) => { window.location.hash = `#/${p}` }]
}

export function App({ tenant }: { tenant: Tenant }) {
  const [snap, setSnap] = useState<Snapshot>(emptySnapshot)
  const [now, setNow] = useState(new Date())
  const [page, go] = usePage()
  const [toast, setToast] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [cmd, setCmd] = useState('')
  const [cardOpen, setCardOpen] = useState(true)

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
    const forceDemo = new URLSearchParams(window.location.search).has('mock')
    if (tenant.dataSource === 'live' && url && key && !forceDemo) return startLive(tenant, url, key, setSnap)
    return startDemo(tenant, setSnap)
  }, [tenant])
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      event.preventDefault()
      const goal = document.getElementById('showcase-goal')
      const command = document.getElementById('office-command')
      ;(goal ?? command)?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const tz = tenant.workspace.timezone
  const bySlug = useMemo(() => Object.fromEntries(tenant.teammates.map((t) => [t.slug, t])), [tenant]) as Record<string, Teammate>
  const needs: NeedItem[] = useMemo(() => {
    const items: NeedItem[] = snap.approvals.map((a) => ({ key: a.id, slug: a.slug, title: a.title, since: a.createdAt, kind: 'approval' }))
    for (const a of Object.values(snap.agents)) {
      if (a.status === 'waiting_on_jv' && !items.some((i) => i.slug === a.slug)) {
        items.push({ key: `w-${a.slug}`, slug: a.slug, title: a.currentTask ?? 'Waiting on your go-ahead', since: a.updatedAt, kind: 'waiting' })
      }
    }
    return items.sort((x, y) => x.since.localeCompare(y.since))
  }, [snap])
  const working = Object.values(snap.agents).filter((a) => a.status === 'working').length
  const readOnly = (what: string) => setToast(`Preview only: ${what} isn't wired up yet. Nothing was sent.`)
  const jarvis = isJarvisWorkspace(tenant.teammates)
  const feed = describeOfficeFeed(snap, now)
  const nav: { id: Page; label: string; icon: string; aria?: string }[] = [
    { id: 'office', label: 'Office', icon: 'office' },
    { id: 'jarvis', label: jarvis ? 'Jarvis' : 'Command', icon: 'core', aria: jarvis ? 'Jarvis command center' : 'Command center' },
    { id: 'chat', label: 'Chat', icon: 'chat' },
    { id: 'needs', label: 'Needs you', icon: 'inbox' },
    { id: 'team', label: 'Team', icon: 'team' },
    { id: 'board', label: 'Board', icon: 'board' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
    { id: 'usage', label: 'Usage', icon: 'usage' },
    { id: 'settings', label: 'Settings & help', icon: 'settings' },
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={tenant.brand.logo} alt="" width={36} height={36} />
          <div>
            <div className="brand-name">{tenant.platform.shortName}</div>
            <div className="brand-sub">AI Office</div>
          </div>
        </div>
        <nav>
          {nav.map((n) => (
            <button key={n.id} className={`nav-item${n.id === 'jarvis' ? ' nav-jarvis' : ''}${page === n.id ? ' active' : ''}`} aria-label={n.aria} onClick={() => go(n.id)}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.id === 'needs' && needs.length > 0 && <span className="badge">{needs.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-card">
            <div className="avatar">{tenant.owner.initials}</div>
            <div>
              <div className="user-name">{tenant.owner.name}</div>
              <div className="user-sub">{tenant.owner.title} · {feed.label}</div>
            </div>
          </div>
          <div className="powered">{tenant.platform.poweredBy}</div>
        </div>
      </aside>

      <main className={page === 'jarvis' ? 'main jarvis-main' : 'main'}>
        <header className="topbar">
          <div className="ws">
            <div className="ws-name">{tenant.workspace.name}</div>
            <div className="ws-date">{longDate(now, tz)} {tenant.workspace.timezoneLabel}</div>
          </div>
          <form className="command" aria-describedby="command-hint" onSubmit={(e) => {
            e.preventDefault()
            const goal = cmd.trim()
            if (!goal) return
            stageShowcaseGoal(tenant.workspace.name, goal)
            setCmd('')
            go('jarvis')
            setToast(`${SHOWCASE_BANNER} Opened in this tab. Nothing was sent.`)
          }}>
            <Icon name="send" size={16} />
            <input id="office-command" value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="Start a local showcase sample..." aria-label="Goal for a local showcase sample" />
            <kbd>Ctrl K</kbd>
            <button type="button" className="ghost-icon" onClick={() => readOnly('attachments')} aria-label="Attach"><Icon name="attach" size={16} /></button>
            <button type="submit" className="send">Sample</button>
            <p id="command-hint" className="sr-only">{SHOWCASE_BANNER} The goal stays in this browser tab.</p>
          </form>
          <div className="teamtoggle">
            <span className={`dot ${paused ? 'paused' : ''}`} />
            <span>{paused ? 'Team paused' : 'Team at work'}</span>
            <button onClick={() => { setPaused(!paused); readOnly('pausing the team') }}>
              <Icon name={paused ? 'play' : 'pause'} size={14} /> {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </header>

        <section className="content">
          {snap.connection === 'demo' && page !== 'jarvis' && (
            <div className="sample-banner" role="note">
              <strong>{SHOWCASE_BANNER}</strong>
              <span>Template sample data is on screen. It is not the live office feed.</span>
            </div>
          )}
          {page === 'office' && (
            <>
              <div className="hero">
                <div>
                  <h1>{greeting(now, tz)}, {tenant.owner.name}</h1>
                  <button className="jarvis-entry" onClick={() => go('jarvis')}>
                    <CoreMark slug={jarvis ? 'alex' : (tenant.teammates[0]?.slug ?? 'alex')} color={tenant.teammates.find((t) => t.slug === 'alex')?.color ?? tenant.teammates[0]?.color ?? '#5CE1FF'} size={28} />
                    {jarvis ? 'Open Jarvis command center' : 'Open command center'}
                  </button>
                </div>
                <div className="counters">
                  <div className="counter"><span className="c-dot green" /><b>{working}</b> teammate{working === 1 ? '' : 's'} working</div>
                  <button className={`counter ${needs.length ? 'warn' : ''}`} onClick={() => go('needs')}><span className="c-ico">✋</span><b>{needs.length}</b> waiting on you</button>
                  <div className="counter"><span className="c-ico check">✓</span><b>{snap.doneToday}</b> done today</div>
                </div>
              </div>
              <p className="office-source" data-testid="floor-feed"><b>Office status · {feed.label}</b> · {feed.freshness}. {feed.detail}</p>
              <div className="floor-wrap">
                {snap.connection === 'connecting' ? <div className="loading">Opening the office…</div> : (
                  <OfficeFloor tenant={tenant} agents={snap.agents} now={now} selected={selected} onSelect={(s) => setSelected(s === selected ? null : s)} />
                )}
                {selected && bySlug[selected] && (
                  <div className="mate-pop">
                    <div className="mp-head"><span className="mp-dot" style={{ background: bySlug[selected].color }} /> <b>{bySlug[selected].name}</b><button onClick={() => setSelected(null)}>×</button></div>
                    <div className="mp-role">{bySlug[selected].role}</div>
                    <div className={`pill s-${snap.agents[selected]?.status ?? 'offline'}`}>{STATUS_LABEL[snap.agents[selected]?.status ?? 'offline']}</div>
                    {snap.agents[selected]?.currentTask && <div className="mp-task">{snap.agents[selected]?.currentTask}</div>}
                    {snap.agents[selected] && <div className="mp-time">Updated {ago(snap.agents[selected].updatedAt, now)}</div>}
                  </div>
                )}
                {needs[0] && bySlug[needs[0].slug] && (cardOpen ? (
                  <ApprovalCard item={needs[0]} mate={bySlug[needs[0].slug]} now={now} onAct={readOnly} more={needs.length - 1} onMore={() => go('needs')} onClose={() => setCardOpen(false)} />
                ) : (
                  <button className="ap-collapsed" onClick={() => setCardOpen(true)}>✋ {needs.length} waiting on you</button>
                ))}
              </div>
              <div className="legend">
                <span className="lg green"><i />Working at their desk</span>
                <span className="lg orange"><i />Hand up: waiting on you</span>
                <span className="lg grey"><i />Done · standing by</span>
                <span className="lg muted"><i />Offline</span>
              </div>
              <Activity snap={snap} bySlug={bySlug} now={now} />
            </>
          )}
          {page === 'jarvis' && <CommandCenter tenant={tenant} snap={snap} now={now} onOpenFloor={() => go('office')} />}
          {page === 'needs' && (
            <Panel title="Needs you" sub="Items where a teammate has their hand up. Read-only in this preview.">
              {needs.length === 0 && <Empty text="Nothing is waiting on you right now." />}
              {needs.map((n) => bySlug[n.slug] && <ApprovalCard key={n.key} item={n} mate={bySlug[n.slug]} now={now} onAct={readOnly} inline />)}
            </Panel>
          )}
          {page === 'team' && (
            <Panel title="Team" sub={`${tenant.teammates.length} AI teammates on this floor.`}>
              <div className="team-grid">
                {tenant.teammates.map((t) => {
                  const a = snap.agents[t.slug]
                  return (
                    <div key={t.slug} className="team-card">
                      <CoreMark slug={t.slug} color={t.color} size={42} title={t.name} />
                      <div className="tc-name">{t.name}</div>
                      <div className="tc-role">{t.role}</div>
                      <div className={`pill s-${a?.status ?? 'offline'}`}>{STATUS_LABEL[a?.status ?? 'offline']}</div>
                      <div className="tc-task">{a?.currentTask ?? '—'}</div>
                      {a && <div className="tc-time">Updated {ago(a.updatedAt, now)}</div>}
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}
          {page === 'board' && <Board snap={snap} bySlug={bySlug} now={now} />}
          {page === 'reports' && <Reports snap={snap} tenant={tenant} />}
          {page === 'chat' && (
            <Panel title="Chat" sub="Talk to one teammate or the whole floor. Coming in the pilot phase.">
              <div className="chat-mock">
                <div className="chat-list">{tenant.teammates.map((t) => <div key={t.slug} className="chat-row"><span className="mp-dot" style={{ background: t.color }} />{t.name}<small>{t.role}</small></div>)}</div>
                <div className="chat-pane"><div className="placeholder-box">Chat threads with each teammate will show here.<br />This preview does not send messages.</div></div>
              </div>
            </Panel>
          )}
          {page === 'usage' && (
            <Panel title="Usage" sub="Plan, usage and limits for this workspace.">
              <div className="placeholder-grid">
                {['Tasks this month', 'Teammate hours', 'Plan & renewal'].map((x) => <div key={x} className="ph-card"><div className="ph-label">{x}</div><div className="ph-value">TBD</div><div className="ph-note">Connects to per-client usage in the pilot.</div></div>)}
              </div>
            </Panel>
          )}
          {page === 'settings' && <Settings tenant={tenant} />}
        </section>
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Panel({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return <div className="panel"><h1>{title}</h1><p className="panel-sub">{sub}</p>{children}</div>
}
function Empty({ text }: { text: string }) { return <div className="empty">{text}</div> }

function ApprovalCard({ item, mate, now, onAct, more = 0, onMore, inline, onClose }: { item: NeedItem; mate: Teammate; now: Date; onAct: (s: string) => void; more?: number; onMore?: () => void; inline?: boolean; onClose?: () => void }) {
  return (
    <div className={`approval ${inline ? 'inline' : ''}`}>
      <div className="ap-head">
        <CoreMark slug={mate.slug} color={mate.color} size={34} title={mate.name} />
        <div className="ap-who"><b>{mate.name}</b><small>{mate.role} · {ago(item.since, now)}</small></div>
        <span className="ap-tag">{item.kind === 'approval' ? 'Approval' : 'Hand up'}</span>
        {onClose && <button className="ap-close" onClick={onClose} aria-label="Minimize">×</button>}
      </div>
      <div className="ap-title">{item.title}</div>
      <p className="ap-note">Approve to let {mate.name} continue. Nothing goes out without your OK.</p>
      <div className="ap-actions">
        <button className="primary" onClick={() => onAct('approving')}><span>✓</span> Approve</button>
        <button onClick={() => onAct('hold')}>Hold</button>
        <button onClick={() => onAct('send back')}>Send back</button>
        <button onClick={() => onAct('instructions')}>Instruct</button>
      </div>
      {more > 0 && onMore && <button className="ap-more" onClick={onMore}>+{more} more waiting on you →</button>}
    </div>
  )
}

function Activity({ snap, bySlug, now }: { snap: Snapshot; bySlug: Record<string, Teammate>; now: Date }) {
  const rows = snap.activities.slice(0, 6)
  if (!rows.length) return null
  return (
    <div className="activity">
      <h3>Recent activity</h3>
      <ul>
        {rows.map((a) => bySlug[a.slug] && (
          <li key={a.id}><span className="mp-dot" style={{ background: bySlug[a.slug].color }} /><b>{bySlug[a.slug].name}</b><span className="act-title">{a.title}</span><span className={`pill s-${a.status === 'done' ? 'idle' : a.status}`}>{a.status === 'done' ? 'Done' : a.status === 'working' ? 'Working' : 'Waiting on you'}</span><small>{ago(a.finishedAt ?? a.createdAt, now)}</small></li>
        ))}
      </ul>
    </div>
  )
}

function Board({ snap, bySlug, now }: { snap: Snapshot; bySlug: Record<string, Teammate>; now: Date }) {
  const cols = [
    { id: 'working', label: 'In progress' },
    { id: 'waiting_on_jv', label: 'Waiting on you' },
    { id: 'done', label: 'Done' },
  ] as const
  return (
    <Panel title="Board" sub="Task cards from the team's activity log (latest records).">
      <div className="board">
        {cols.map((c) => {
          const items = snap.activities.filter((a) => a.status === c.id).slice(0, 12)
          return (
            <div key={c.id} className="board-col">
              <div className="bc-head">{c.label}<span>{items.length}</span></div>
              {items.length === 0 && <div className="empty small">No cards</div>}
              {items.map((a) => bySlug[a.slug] && (
                <div key={a.id} className="bcard"><div className="bc-title">{a.title}</div><div className="bc-meta"><span className="mp-dot" style={{ background: bySlug[a.slug].color }} />{bySlug[a.slug].name} · {ago(a.finishedAt ?? a.createdAt, now)}</div></div>
              ))}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function Reports({ snap, tenant }: { snap: Snapshot; tenant: Tenant }) {
  const counts = tenant.teammates.map((t) => ({ t, n: snap.activities.filter((a) => a.slug === t.slug && a.status === 'done').length }))
  const max = Math.max(1, ...counts.map((c) => c.n))
  return (
    <Panel title="Reports" sub="Completed tasks per teammate, from the latest activity records. Weekly and monthly reports come in the pilot.">
      <div className="bars">
        {counts.map(({ t, n }) => (
          <div key={t.slug} className="bar-row"><span className="bar-name">{t.name}</span><div className="bar"><i style={{ width: `${(n / max) * 100}%`, background: t.color }} /></div><b>{n}</b></div>
        ))}
      </div>
    </Panel>
  )
}

function Settings({ tenant }: { tenant: Tenant }) {
  return (
    <Panel title="Settings & help" sub="Every client workspace is the same template. These values come from one tenant config file.">
      <div className="settings-grid">
        <div className="ph-card"><div className="ph-label">Workspace</div><div className="kv"><span>Name</span><b>{tenant.workspace.name}</b></div><div className="kv"><span>Time zone</span><b>{tenant.workspace.timezone}</b></div><div className="kv"><span>Data</span><b>{tenant.dataSource === 'live' ? 'Live status feed' : 'Demo data'}</b></div></div>
        <div className="ph-card"><div className="ph-label">Branding</div>
          <div className="swatches">{(['primary', 'accent', 'gold', 'sidebar'] as const).map((k) => <div key={k}><i style={{ background: tenant.brand[k] }} /><small>{k}</small></div>)}</div>
          <div className="kv"><span>Platform</span><b>{tenant.platform.name}</b></div>
        </div>
        <div className="ph-card"><div className="ph-label">Teammates</div>{tenant.teammates.map((t) => <div key={t.slug} className="kv"><span><i className="mp-dot" style={{ background: t.color }} /> {t.name}</span><b>{t.role}</b></div>)}</div>
        <div className="ph-card"><div className="ph-label">Template preview</div><p className="ph-note">Open the same app with another tenant file to see a client version.</p><a className="link" href="?tenant=sample-client">Open sample client workspace →</a><br /><a className="link" href="?tenant=cnr">Back to C&amp;R AI Office →</a></div>
      </div>
    </Panel>
  )
}
