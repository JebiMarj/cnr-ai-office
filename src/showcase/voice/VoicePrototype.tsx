import { useEffect, useRef, useState } from 'react'
import type { Tenant } from '../../types.ts'
import { SHOWCASE_BANNER } from '../copy.ts'
import { applyIncomingGoal, loadSession, saveSession, type DemoSession } from '../demo.ts'
import { findSpeechRecognition, type SpeechHost } from '../dictate.ts'
import { sessionKey, sessionStore } from '../storage.ts'
import {
  PRIVACY_NOTICE,
  SCRIPTED_ACK,
  SCRIPT_MARK,
  VOICE_PROTOTYPE_LABEL,
  chooseVoice,
  clampVoicePrefs,
  initialVoiceState,
  loadVoicePrefs,
  reduceVoice,
  releaseVoiceSession,
  saveVoicePrefs,
  voicePrefsKey,
  voiceStatus,
  type VoiceEffect,
  type VoiceEvent,
  type VoiceOption,
  type VoicePrefs,
  type VoiceState,
} from './voiceSession.ts'
import './voice.css'

type MicHandle = { stop: () => void; abort?: () => void }

export function VoicePrototype({ tenant, onOpenCommand, onOpenFloor }: { tenant: Tenant; onOpenCommand: () => void; onOpenFloor: () => void }) {
  const workspace = tenant.workspace.name
  const slugs = tenant.teammates.map((teammate) => teammate.slug)
  const [state, setState] = useState<VoiceState>(initialVoiceState)
  const [sample, setSample] = useState<DemoSession | null>(() => loadSession(sessionStore(sessionKey(workspace))))
  const [prefs, setPrefs] = useState<VoicePrefs>(() => loadVoicePrefs(sessionStore(voicePrefsKey())))
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [draft, setDraft] = useState('')
  const [caption, setCaption] = useState('')
  const [silence, setSilence] = useState(false)
  const stateRef = useRef(state)
  const sampleRef = useRef(sample)
  const micRef = useRef<MicHandle | null>(null)
  const alive = useRef(true)
  const silenceRef = useRef(silence)
  const prefsRef = useRef(prefs)
  stateRef.current = state
  sampleRef.current = sample
  silenceRef.current = silence
  prefsRef.current = prefs
  const choice = chooseVoice(voices, prefs)
  const status = voiceStatus(state)

  const stopMic = () => {
    const mic = micRef.current
    micRef.current = null
    try { mic?.abort?.() } catch { /* already closed */ }
    try { mic?.stop() } catch { /* already closed */ }
  }
  const cancelSpeech = () => {
    try { window.speechSynthesis?.cancel() } catch { /* unavailable */ }
  }

  function dispatch(event: VoiceEvent) {
    const step = reduceVoice(stateRef.current, event)
    stateRef.current = step.state
    setState(step.state)
    run(step.effects)
  }

  function run(effects: VoiceEffect[]) {
    for (const effect of effects) {
      if (effect.type === 'stop-mic') stopMic()
      else if (effect.type === 'cancel-speech') cancelSpeech()
      else if (effect.type === 'start-mic') startMic()
      else if (effect.type === 'speak') speak(effect.text)
      else if (effect.type === 'file-sample') fileSample(effect.goal, effect.confirm)
    }
  }

  function fileSample(goal: string, confirm: boolean) {
    const applied = applyIncomingGoal(sampleRef.current, goal, slugs)
    if (applied.kind === 'started') {
      saveSession(applied.session, sessionStore(sessionKey(workspace)))
      sampleRef.current = applied.session
      setSample(applied.session)
      dispatch({ type: 'sample-result', filed: true, confirm, message: `${SHOWCASE_BANNER} ${applied.session.sampleTitle}. Nothing was sent.` })
      return
    }
    dispatch({ type: 'sample-result', filed: false, confirm, message: applied.message })
  }

  function startMic() {
    if (!alive.current) return
    const Ctor = findSpeechRecognition(window as unknown as SpeechHost)
    if (!Ctor) {
      dispatch({ type: 'unsupported' })
      return
    }
    stopMic()
    const rec = new Ctor()
    rec.lang = 'en-GB'
    rec.continuous = true
    rec.interimResults = true
    const handle: MicHandle = rec
    rec.onresult = (event) => {
      const list = event.results
      const last = list[list.length - 1]
      const text = last?.[0]?.transcript ?? ''
      const final = Boolean((last as { isFinal?: boolean } | undefined)?.isFinal)
      if (!text.trim()) return
      if (final) {
        setCaption('')
        dispatch({ type: 'heard', text, source: 'mic', now: Date.now() })
      } else setCaption(text)
    }
    rec.onerror = (event) => {
      const code = event.error || ''
      if (code === 'no-speech' || code === 'aborted') return
      if (micRef.current !== handle) return
      if (code === 'not-allowed' || code === 'service-not-allowed') dispatch({ type: 'denied' })
      else if (code === 'network') dispatch({ type: 'mic-error', message: 'The browser speech service could not be reached. Recognition is not offline. Not listening.' })
      else dispatch({ type: 'mic-error', message: 'The microphone stopped. Not listening.' })
    }
    rec.onend = () => {
      if (micRef.current !== handle) return
      micRef.current = null
      if (alive.current) dispatch({ type: 'recognizer-ended' })
    }
    rec.onstart = () => {
      if (alive.current && micRef.current === handle) dispatch({ type: 'mic-live' })
    }
    micRef.current = handle
    try {
      rec.start()
    } catch {
      micRef.current = null
      dispatch({ type: 'mic-error', message: 'The microphone could not start. Not listening.' })
    }
  }

  function speak(text: string) {
    const synth = window.speechSynthesis
    if (!synth || silenceRef.current) {
      if (alive.current) dispatch({ type: 'speech-ended' })
      return
    }
    try { synth.resume() } catch { /* some browsers omit resume */ }
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    const current = clampVoicePrefs(prefsRef.current)
    utter.rate = current.rate
    utter.pitch = current.pitch
    const match = synth.getVoices().find((voice) => voice.voiceURI === chooseVoice(voicesRef.current, current).voice?.voiceURI)
    if (match) utter.voice = match
    let settled = false
    const done = () => {
      if (settled || !alive.current) return
      settled = true
      window.clearTimeout(timer)
      dispatch({ type: 'speech-ended' })
    }
    const timer = window.setTimeout(() => {
      try { synth.cancel() } catch { /* already finished */ }
      done()
    }, 6000)
    utter.onend = done
    utter.onerror = done
    synth.speak(utter)
  }

  const voicesRef = useRef(voices)
  voicesRef.current = voices

  useEffect(() => {
    alive.current = true
    const synth = window.speechSynthesis
    if (!synth) return () => { alive.current = false }
    const pull = () => {
      setVoices(synth.getVoices().map((voice) => ({
        voiceURI: voice.voiceURI,
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
      })))
    }
    pull()
    synth.addEventListener?.('voiceschanged', pull)
    return () => {
      alive.current = false
      synth.removeEventListener?.('voiceschanged', pull)
      releaseVoiceSession({ stopMic, cancelSpeech })
    }
  }, [])

  const updatePrefs = (next: VoicePrefs) => {
    const clamped = clampVoicePrefs(next)
    setPrefs(clamped)
    saveVoicePrefs(clamped, sessionStore(voicePrefsKey()))
  }

  const secure = typeof window !== 'undefined' && window.isSecureContext
  const recognitionSupported = findSpeechRecognition(window as unknown as SpeechHost) !== null
  const orbClass = state.phase === 'listening' ? 'is-listening' : state.phase === 'speaking' ? 'is-speaking' : state.phase === 'awake' ? 'is-awake' : 'is-idle'

  return (
    <div className="voice-stage" data-testid="voice-stage" data-phase={state.phase} data-listening={status.listening ? 'yes' : 'no'}>
      <div className="voice-layout">
        <section className="voice-hero" aria-labelledby="voice-title">
          <p className="voice-kicker">Create &amp; Reach Intelligence</p>
          <div className={`voice-orb ${orbClass}`} data-testid="voice-orb">
            <span className="voice-ring" />
            <span className="voice-ring-b" />
            <img src="/jarvis-emblem.svg" alt="" width={220} height={220} />
          </div>
          <h1 id="voice-title">Jarvis</h1>
          <p className="voice-kicker" data-testid="voice-prototype-label">{VOICE_PROTOTYPE_LABEL}</p>
          <p className="voice-status" data-testid="voice-status" aria-live="polite">{status.title}. {status.detail}</p>
          {caption && <p className="voice-detail" data-testid="voice-caption">Hearing: {caption}</p>}
          <div className="voice-privacy" role="note" data-testid="voice-privacy">
            <strong>Before the microphone starts</strong>
            <p>{PRIVACY_NOTICE}</p>
            <p>{secure ? 'This page is a secure context, so the browser may allow a microphone.' : 'This page is not a secure context. The microphone stays off. Open the local server address instead of a file.'}</p>
            <p>{recognitionSupported ? 'This browser exposes SpeechRecognition. The vendor may still process the audio online.' : 'This browser does not expose SpeechRecognition. The typed self-test is the way through.'}</p>
            <p data-testid="voice-choice">{choice.note}</p>
          </div>
          <div className="voice-actions">
            <button type="button" className="voice-go" data-testid="voice-start" onClick={() => {
              if (!window.isSecureContext) dispatch({ type: 'insecure' })
              else if (!recognitionSupported) dispatch({ type: 'unsupported' })
              else dispatch({ type: 'start-clicked' })
            }}>Start voice session</button>
            <button type="button" className="voice-stop" data-testid="voice-stop" onClick={() => dispatch({ type: 'stop' })}>Stop</button>
            {state.phase === 'muted' ? (
              <button type="button" className="voice-ghost" data-testid="voice-unmute" onClick={() => dispatch({ type: 'unmute' })}>Unmute microphone</button>
            ) : (
              <button type="button" className="voice-ghost" data-testid="voice-mute" onClick={() => dispatch({ type: 'mute' })} disabled={state.phase !== 'listening' && state.phase !== 'awake'}>Mute microphone</button>
            )}
            <button type="button" className="voice-ghost" data-testid="voice-clear" onClick={() => dispatch({ type: 'clear-transcript' })}>Clear transcript</button>
          </div>
          <p className="voice-note">Stopped means not listening. The session never starts by itself, and it ends when you press Stop or leave this page.</p>
        </section>

        <div className="voice-side">
          <form className="voice-panel" data-testid="voice-typed" onSubmit={(event) => {
            event.preventDefault()
            const text = draft.trim()
            if (!text) return
            setDraft('')
            dispatch({ type: 'heard', text, source: 'typed', now: Date.now() })
          }}>
            <label htmlFor="voice-typed-line">Type a line instead</label>
            <input id="voice-typed-line" data-testid="voice-typed-line" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Hello Jarvis, are you up?" autoComplete="off" />
            <div className="voice-inline">
              <button type="submit" className="voice-go" data-testid="voice-typed-run">Run typed line</button>
              <button type="button" className="voice-ghost" data-testid="voice-hear-script" onClick={() => dispatch({ type: 'heard', text: 'Hello Jarvis, are you up?', source: 'typed', now: Date.now() })}>Hear scripted acknowledgement</button>
            </div>
            <p className="voice-script-note">Self-test controls do not open the microphone. “{SCRIPTED_ACK}” is a {SCRIPT_MARK.toLowerCase()}, not a live assistant.</p>
          </form>

          <form className="voice-panel" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="voice-voice">Browser voice</label>
            <select id="voice-voice" data-testid="voice-voice" value={prefs.voiceURI ?? ''} onChange={(event) => updatePrefs({ ...prefs, voiceURI: event.target.value || null })}>
              <option value="">Prefer en-GB when this browser has it</option>
              {voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>)}
            </select>
            <label htmlFor="voice-rate">Speaking rate {prefs.rate.toFixed(2)}</label>
            <input id="voice-rate" data-testid="voice-rate" type="range" min={0.85} max={1.15} step={0.05} value={prefs.rate} onChange={(event) => updatePrefs({ ...prefs, rate: Number(event.target.value) })} />
            <label htmlFor="voice-pitch">Pitch {prefs.pitch.toFixed(2)}</label>
            <input id="voice-pitch" data-testid="voice-pitch" type="range" min={0.85} max={1.15} step={0.05} value={prefs.pitch} onChange={(event) => updatePrefs({ ...prefs, pitch: Number(event.target.value) })} />
            <label className="voice-inline"><input type="checkbox" data-testid="voice-silence" checked={silence} onChange={(event) => setSilence(event.target.checked)} /> Silence spoken replies</label>
          </form>

          <section className="voice-panel" aria-labelledby="voice-log-title">
            <h2 id="voice-log-title">Transcript</h2>
            {state.lines.length === 0 && <p className="voice-note">Nothing has been heard in this tab.</p>}
            <ol className="voice-log" data-testid="voice-log">
              {state.lines.map((line) => (
                <li key={line.id}><span className="kind">{line.kind === 'script' ? SCRIPT_MARK : line.kind === 'heard' ? 'Heard in this tab' : 'Status'}</span>{line.text}</li>
              ))}
            </ol>
          </section>

          {sample && (
            <section className="voice-sample" data-testid="voice-sample">
              <p className="voice-banner">{SHOWCASE_BANNER}</p>
              <h2>{sample.sampleTitle}</h2>
              <p>Goal kept in this tab: {sample.goal}</p>
              <p>Sample routing label: {tenant.teammates.find((teammate) => teammate.slug === sample.specialistSlug)?.name ?? sample.specialistSlug}. This does not assign work and does not run anything.</p>
              <button type="button" className="voice-ghost" data-testid="voice-reset-sample" onClick={() => {
                saveSession(null, sessionStore(sessionKey(workspace)))
                sampleRef.current = null
                setSample(null)
              }}>Reset sample</button>
            </section>
          )}

          <div className="voice-inline">
            <button type="button" className="voice-ghost" onClick={onOpenCommand}>Back to command center</button>
            <button type="button" className="voice-ghost" onClick={onOpenFloor}>Back to office floor</button>
          </div>
        </div>
      </div>
    </div>
  )
}
