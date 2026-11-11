import { useEffect, useRef, useState } from 'react'
import type { Snapshot, Teammate, Tenant } from '../types.ts'
import { ago } from '../time.ts'
import { SHOWCASE_BANNER, SHOWCASE_SESSION_NOTE, EXTERNAL_CONNECTIONS } from './copy.ts'
import { CoreMark } from './CoreMark.tsx'
import {
  SAMPLE_STEPS,
  advanceSample,
  applyIncomingGoal,
  decideSample,
  loadSession,
  outcomeCopy,
  saveSession,
  type DemoDecision,
  type DemoSession,
} from './demo.ts'
import { findSpeechRecognition, type SpeechHost, type SpeechSession } from './dictate.ts'
import { describeOfficeFeed, doneTodayCopy, OFFICE_STATUS_LABEL } from './feed.ts'
import { coreStyle, isJarvisWorkspace } from './roster.ts'
import { pendingKey, sessionKey, sessionStore, takePendingGoal, writePendingGoal } from './storage.ts'

const GOAL_EVENT = 'cnri-showcase-goal'

export function stageShowcaseGoal(workspace: string, goal: string) {
  writePendingGoal(goal, sessionStore(pendingKey(workspace)))
  window.dispatchEvent(new CustomEvent(GOAL_EVENT))
}

export function CommandCenter({ tenant, snap, now, onOpenFloor }: { tenant: Tenant; snap: Snapshot; now: Date; onOpenFloor: () => void }) {
  const jarvis = isJarvisWorkspace(tenant.teammates)
  const workspace = tenant.workspace.name
  const [session, setSession] = useState<DemoSession | null>(() => loadSession(sessionStore(sessionKey(workspace))))
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [voiceNote, setVoiceNote] = useState<string | null>(null)
  const sessionRef = useRef(session)
  const slugsRef = useRef(tenant.teammates.map((teammate) => teammate.slug))
  const speechRef = useRef<SpeechSession | null>(null)
  const speechCtor = findSpeechRecognition(window as unknown as SpeechHost)
  const feed = describeOfficeFeed(snap, now)
  const bySlug = Object.fromEntries(tenant.teammates.map((teammate) => [teammate.slug, teammate])) as Record<string, Teammate>
  sessionRef.current = session
  slugsRef.current = tenant.teammates.map((teammate) => teammate.slug)

  useEffect(() => {
    const sessionBin = sessionStore(sessionKey(workspace))
    const pendingBin = sessionStore(pendingKey(workspace))
    const consume = () => {
      const goal = takePendingGoal(pendingBin)
      if (!goal) return
      const applied = applyIncomingGoal(sessionRef.current, goal, slugsRef.current)
      if (applied.kind === 'started') {
        saveSession(applied.session, sessionBin)
        setSession(applied.session)
        setDraft('')
        setMessage(null)
        return
      }
      setDraft(goal)
      setMessage(applied.message)
    }
    consume()
    window.addEventListener(GOAL_EVENT, consume)
    return () => window.removeEventListener(GOAL_EVENT, consume)
  }, [workspace])

  useEffect(() => () => speechRef.current?.stop(), [])

  const persist = (next: DemoSession | null) => {
    saveSession(next, sessionStore(sessionKey(workspace)))
    setSession(next)
  }

  const start = (goal: string) => {
    const applied = applyIncomingGoal(session, goal, slugsRef.current)
    if (applied.kind === 'started') {
      persist(applied.session)
      setDraft('')
      setMessage(null)
      return
    }
    setMessage(applied.message)
  }

  const dictate = () => {
    if (!speechCtor) return
    if (listening) {
      speechRef.current?.stop()
      setListening(false)
      return
    }
    const recognition = new speechCtor()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? ''
      if (transcript) setDraft((current) => (current ? `${current} ${transcript}` : transcript))
    }
    recognition.onerror = (event) => {
      setListening(false)
      setVoiceNote(event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'Microphone permission was blocked. Type the goal instead.'
        : 'Voice input stopped. Type the goal instead.')
    }
    recognition.onend = () => setListening(false)
    speechRef.current = recognition
    setVoiceNote(null)
    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
      setVoiceNote('Voice input could not start. Type the goal instead.')
    }
  }

  const specialist = session ? bySlug[session.specialistSlug] : undefined
  const specialistName = specialist?.name ?? session?.specialistSlug ?? 'the specialist'
  const stepState = (index: number) => {
    if (!session || session.phase !== 'in_progress') return 'done'
    if (index < session.stepIndex) return 'done'
    if (index === session.stepIndex) return 'current'
    return 'upcoming'
  }
  const liveLine = !session
    ? 'No sample is open.'
    : session.phase === 'recorded' && session.decision
      ? outcomeCopy(session.decision, specialistName)
      : session.phase === 'decision'
        ? `${session.sampleTitle} is ready for a sample decision.`
        : `${session.sampleTitle}, step ${session.stepIndex + 1} of ${SAMPLE_STEPS.length}.`

  return (
    <div className="command-center" data-testid="command-center">
      <header className="cc-hero">
        <div className="stage-emblem" aria-hidden={jarvis ? undefined : true}>
          <span className="orbit orbit-a" />
          <span className="orbit orbit-b" />
          {jarvis ? (
            <img src="/jarvis-emblem.svg" alt="Jarvis emblem" width={148} height={148} />
          ) : (
            <CoreMark slug={tenant.teammates[0]?.slug ?? 'alex'} color={tenant.teammates[0]?.color ?? '#5CE1FF'} size={120} />
          )}
        </div>
        <div className="cc-intro">
          <p className="cc-kicker">{tenant.platform.name}</p>
          <h1>{jarvis ? 'Jarvis' : 'Command center'}</h1>
          <p className="cc-lead">
            {jarvis
              ? 'Executive coordinator for the C&R floor. The office, the desks, and the live status feed stay where they are.'
              : `${tenant.workspace.name}. A local sample of how a goal moves across this floor.`}
          </p>
          <p className="cc-owner">{tenant.owner.name} · {tenant.owner.title}</p>
        </div>
      </header>

      <p className="cc-banner" data-testid="showcase-banner" role="note">{SHOWCASE_BANNER}</p>
      <p className="cc-session-note">{SHOWCASE_SESSION_NOTE}</p>
      <ul className="roster roster-strip" aria-label="Specialists">
        {tenant.teammates.map((teammate) => {
          const state = snap.agents[teammate.slug]
          const status = state?.status ?? 'offline'
          const style = coreStyle(teammate.slug, teammate.color)
          return (
            <li key={teammate.slug}>
              <CoreMark slug={teammate.slug} color={teammate.color} size={46} title={teammate.name} />
              <span>
                <strong>{teammate.name}</strong>
                <small>{style.epithet ? `${style.epithet} · ${teammate.role}` : teammate.role}</small>
                <em className={`pill s-${status}`}>{state ? OFFICE_STATUS_LABEL[status] : 'No status yet'}</em>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="roster-note">Statuses on these cores come from the office feed. Advancing a sample does not change them.</p>
      <p className="sr-only" aria-live="polite">{liveLine}</p>

      <div className="cc-grid">
        <section className="cc-card" aria-labelledby="sample-heading">
          <div className="cc-card-label">Sample task</div>
          <h2 id="sample-heading">Local intake</h2>
          {!session && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                start(draft)
              }}
            >
              <label htmlFor="showcase-goal">Goal</label>
              <textarea
                id="showcase-goal"
                data-testid="showcase-goal"
                value={draft}
                maxLength={160}
                rows={3}
                placeholder="Example: prepare a sample onboarding checklist"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
              />
              <div className="cc-actions">
                <button type="submit" className="cc-primary" data-testid="showcase-start">Start sample</button>
                {speechCtor ? (
                  <button type="button" className="cc-gold" aria-pressed={listening} data-testid="showcase-dictate" onClick={dictate}>
                    {listening ? 'Stop dictation' : 'Dictate goal'}
                  </button>
                ) : (
                  <p className="voice-fallback">Type the goal. This browser has no speech recognition, and nothing is listening.</p>
                )}
              </div>
              {speechCtor && <p className="voice-hint">Dictation starts only when you click, asks for the microphone, and stops on its own. There is no wake word and no spoken reply.</p>}
              <p className="voice-hint">Enter starts the sample. Shift+Enter adds a line. Tab reaches the buttons.</p>
              {voiceNote && <p className="cc-alert" role="alert">{voiceNote}</p>}
            </form>
          )}
          {message && <p className="cc-alert" role="status" data-testid="showcase-message">{message}</p>}

          {session && (
            <div className="sample-run" data-testid="showcase-run">
              <p className="sample-kicker">{SHOWCASE_BANNER}</p>
              <dl className="sample-facts">
                <div>
                  <dt>Goal entered in this tab</dt>
                  <dd>{session.goal}</dd>
                </div>
                <div>
                  <dt>Sample task</dt>
                  <dd>{session.sampleTitle}</dd>
                </div>
                <div>
                  <dt>Assigned specialist</dt>
                  <dd>
                    <CoreMark slug={session.specialistSlug} color={specialist?.color ?? '#5CE1FF'} size={36} title={specialistName} />
                    <span>
                      <strong>{specialistName}</strong>
                      <small>{specialist ? deskLine(specialist) : 'Desk slug from this workspace'}</small>
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="assign-note">Sample routing used the wording of the goal. It is a local rule on this page, not a live dispatch.</p>
              <ol className="steps">
                {SAMPLE_STEPS.map((step, index) => {
                  const state = stepState(index)
                  return (
                    <li key={step.id} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                      <span className="step-index">{index + 1}</span>
                      {step.label}
                    </li>
                  )
                })}
              </ol>
              {session.phase === 'in_progress' && (
                <div className="cc-actions">
                  <button
                    type="button"
                    className="cc-primary"
                    data-testid="showcase-advance"
                    onClick={() => persist(advanceSample(session, new Date()))}
                  >
                    {session.stepIndex === SAMPLE_STEPS.length - 1 ? 'Mark sample ready for a decision' : 'Advance sample step'}
                  </button>
                </div>
              )}
              {session.phase === 'decision' && (
                <div className="decision" data-testid="showcase-decision">
                  <h3>Sample decision</h3>
                  <p>This records your choice in the tab. It does not approve, send, or change anything on the office feed.</p>
                  <div className="cc-actions">
                    <button type="button" className="cc-primary" data-testid="showcase-approve" onClick={() => persist(decideSample(session, 'approved'))}>Approve sample</button>
                    <button type="button" className="cc-gold" data-testid="showcase-hold" onClick={() => persist(decideSample(session, 'held'))}>Hold sample</button>
                    <button type="button" className="cc-ghost" data-testid="showcase-send-back" onClick={() => persist(decideSample(session, 'sent_back'))}>Send sample back</button>
                  </div>
                </div>
              )}
              {session.phase === 'recorded' && session.decision && (
                <div className="outcome" data-testid="showcase-outcome">
                  <h3>Recorded demo outcome</h3>
                  <p>{outcomeCopy(session.decision, specialistName)}</p>
                  <p className="outcome-meta">Decision: {decisionLabel(session.decision)} · recorded {ago(session.updatedAt, now)} · this tab only</p>
                </div>
              )}
              <div className="cc-actions">
                <button
                  type="button"
                  className="cc-ghost"
                  data-testid="showcase-reset"
                  onClick={() => {
                    persist(null)
                    setDraft('')
                    setMessage(null)
                  }}
                >
                  Reset sample
                </button>
                <button type="button" className="cc-ghost" onClick={onOpenFloor}>View office floor</button>
              </div>
            </div>
          )}
          {!session && (
            <button type="button" className="cc-text" onClick={onOpenFloor}>View office floor</button>
          )}
        </section>

        <div className="cc-side">
          <section className="cc-card" aria-labelledby="feed-heading" data-testid="office-feed">
            <div className="cc-card-label">Office feed</div>
            <h2 id="feed-heading">Office status</h2>
            <p className={`feed-state tone-${feed.tone}`} data-testid="office-feed-state">
              <strong>{feed.label}</strong>
              <span>{feed.freshness}</span>
            </p>
            <p className="feed-detail">{feed.detail}</p>
            {snap.fetchedAt && <time dateTime={snap.fetchedAt}>Received {feedClock(snap.fetchedAt, tenant.workspace.timezone)}</time>}
            <p className="feed-count" data-testid="office-done">{doneTodayCopy(snap)}</p>
            <ul className="connections">
              <li>
                <span>Office status</span>
                <b className={`tone-${feed.tone}`}>{feed.label}</b>
                <small>{feed.freshness}</small>
              </li>
              {EXTERNAL_CONNECTIONS.map((row) => (
                <li key={row.id} data-testid={`connection-${row.id}`}>
                  <span>{row.name}</span>
                  <b className={row.state === 'NOT VERIFIED' ? 'tone-unverified' : 'tone-closed'}>{row.state}</b>
                  <small>{row.detail}</small>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <p className="cc-next">A private signed-in desk for real dispatch is a later phase. This public page does not hide a control panel inside the demo.</p>
    </div>
  )
}

function deskLine(teammate: Teammate): string {
  const style = coreStyle(teammate.slug, teammate.color)
  return style.epithet ? `${style.epithet} · ${teammate.role}` : teammate.role
}

function feedClock(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

function decisionLabel(decision: DemoDecision): string {
  if (decision === 'approved') return 'Approved'
  if (decision === 'held') return 'Held'
  return 'Sent back'
}
