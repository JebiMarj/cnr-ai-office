import type { DemoStore } from '../storage.ts'

export const VOICE_PROTOTYPE_LABEL = 'Voice-interface prototype — not connected to the Jarvis bot or the team'

export const PRIVACY_NOTICE =
  'Starting a voice session uses this browser’s speech recognition. In Chrome, and in some other browsers, that sends microphone audio to the browser vendor to produce a transcript. It is not an offline engine unless the browser itself says the recognizer is on-device. This page does not record audio, does not upload a file, and does not send the transcript to the office, a bot, or a model. Spoken replies use speechSynthesis voices already available in the browser. None of them is a film performance or a cloned voice. “Hello Jarvis” is heard only after you click Start voice session, and only while this tab is open and in front. There is no computer-wide wake word.'

export const SCRIPTED_ACK = 'At your service, sir'
export const SCRIPTED_SAMPLE = 'Filed as a sample on this page. Nothing was sent.'
export const SCRIPT_MARK = 'Local scripted line'

const WAKE_LONG = 'hello jarvis are you up'
const WAKE_SHORT = 'hello jarvis'
const DEDUPE_MS = 1200

export type VoicePhase = 'stopped' | 'starting' | 'listening' | 'awake' | 'speaking' | 'muted' | 'denied' | 'unsupported' | 'error'

export type TranscriptKind = 'heard' | 'script' | 'status'

export type TranscriptLine = { id: number; kind: TranscriptKind; text: string }

export type VoiceState = {
  phase: VoicePhase
  session: boolean
  awake: boolean
  holdMic: boolean
  resumeCount: number
  returnTo: VoicePhase
  lastFinal: string | null
  lastFinalAt: number
  lines: TranscriptLine[]
  nextId: number
  error: string | null
}

export type VoiceEvent =
  | { type: 'start-clicked' }
  | { type: 'mic-live' }
  | { type: 'unsupported' }
  | { type: 'insecure' }
  | { type: 'denied' }
  | { type: 'mic-error'; message: string }
  | { type: 'recognizer-ended' }
  | { type: 'stop' }
  | { type: 'mute' }
  | { type: 'unmute' }
  | { type: 'heard'; text: string; source: 'mic' | 'typed'; now: number }
  | { type: 'speech-ended' }
  | { type: 'clear-transcript' }
  | { type: 'sample-result'; filed: boolean; message: string; confirm: boolean }

export type VoiceEffect =
  | { type: 'start-mic' }
  | { type: 'stop-mic' }
  | { type: 'speak'; text: string }
  | { type: 'cancel-speech' }
  | { type: 'file-sample'; goal: string; confirm: boolean }

export type VoiceStep = { state: VoiceState; effects: VoiceEffect[] }

export const initialVoiceState: VoiceState = {
  phase: 'stopped',
  session: false,
  awake: false,
  holdMic: true,
  resumeCount: 0,
  returnTo: 'stopped',
  lastFinal: null,
  lastFinalAt: 0,
  lines: [],
  nextId: 1,
  error: null,
}

export function normalizeHeard(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function parseUtterance(raw: string): { kind: 'wake' | 'wake-and-task' | 'task' | 'ignore'; task: string | null } {
  const text = normalizeHeard(raw)
  if (!text) return { kind: 'ignore', task: null }
  const matched = text === WAKE_LONG || text.startsWith(`${WAKE_LONG} `)
    ? text.slice(WAKE_LONG.length).trim()
    : text === WAKE_SHORT || text.startsWith(`${WAKE_SHORT} `)
      ? text.slice(WAKE_SHORT.length).trim()
      : null
  if (matched === null) return { kind: 'task', task: text }
  if (!matched) return { kind: 'wake', task: null }
  return { kind: 'wake-and-task', task: matched }
}

export function voiceStatus(state: VoiceState): { title: string; detail: string; listening: boolean } {
  switch (state.phase) {
    case 'starting':
      return { title: 'Starting', detail: 'Waiting for the microphone permission prompt. Not listening yet.', listening: false }
    case 'listening':
      return { title: 'Listening', detail: 'Say “Hello Jarvis” or “Hello Jarvis, are you up?” Only this tab, and only until you press Stop.', listening: true }
    case 'awake':
      return { title: 'Awake', detail: 'The next thing you say can be filed as a sample on this page. Nothing is sent to the team.', listening: true }
    case 'speaking':
      return { title: 'Speaking', detail: 'Microphone paused so the reply is not heard as a command.', listening: false }
    case 'muted':
      return { title: 'Muted', detail: 'Not listening.', listening: false }
    case 'denied':
      return { title: 'Microphone blocked', detail: 'Permission was denied. Not listening. You can still type a line.', listening: false }
    case 'unsupported':
      return { title: 'Speech recognition unavailable', detail: 'This browser has no SpeechRecognition API. Not listening. Use the typed self-test.', listening: false }
    case 'error':
      return { title: 'Stopped', detail: state.error ?? 'The voice session ended. Not listening.', listening: false }
    default:
      return { title: 'Stopped', detail: 'Not listening.', listening: false }
  }
}

export function reduceVoice(state: VoiceState, event: VoiceEvent): VoiceStep {
  switch (event.type) {
    case 'start-clicked': {
      if (state.session && (state.phase === 'starting' || state.phase === 'listening' || state.phase === 'awake' || state.phase === 'speaking' || state.phase === 'muted')) {
        return { state, effects: [] }
      }
      return {
        state: { ...state, session: true, phase: 'starting', awake: false, holdMic: true, error: null, resumeCount: 0 },
        effects: [{ type: 'start-mic' }],
      }
    }
    case 'mic-live': {
      if (state.phase === 'stopped' || state.phase === 'muted' || state.phase === 'denied' || state.phase === 'error' || state.phase === 'unsupported') {
        return { state, effects: [] }
      }
      if (state.phase === 'speaking') return { state: { ...state, resumeCount: 0 }, effects: [] }
      return {
        state: { ...state, phase: state.awake ? 'awake' : 'listening', holdMic: false, resumeCount: 0, error: null },
        effects: [],
      }
    }
    case 'unsupported':
      return stopLike(state, 'unsupported', 'This browser has no SpeechRecognition API. Not listening.')
    case 'insecure':
      return stopLike(state, 'error', 'The microphone needs a secure page. Open this prototype at http://127.0.0.1, not as a file. Not listening.')
    case 'denied':
      return stopLike(state, 'denied', 'Microphone permission was denied. Not listening.')
    case 'mic-error':
      return stopLike(state, 'error', event.message)
    case 'recognizer-ended': {
      if (state.holdMic || state.phase === 'speaking' || state.phase === 'muted' || state.phase === 'stopped') return { state, effects: [] }
      if ((state.phase === 'listening' || state.phase === 'awake') && state.resumeCount < 1) {
        return { state: { ...state, resumeCount: state.resumeCount + 1 }, effects: [{ type: 'start-mic' }] }
      }
      return stopLike(state, 'error', 'The microphone session ended. Not listening.')
    }
    case 'stop':
      return halt(state)
    case 'mute': {
      if (state.phase !== 'listening' && state.phase !== 'awake') return { state, effects: [] }
      return { state: { ...state, phase: 'muted', holdMic: true }, effects: [{ type: 'stop-mic' }] }
    }
    case 'unmute': {
      if (state.phase !== 'muted' || !state.session) return { state, effects: [] }
      return { state: { ...state, phase: state.awake ? 'awake' : 'listening', holdMic: false, resumeCount: 0 }, effects: [{ type: 'start-mic' }] }
    }
    case 'heard':
      return hear(state, event)
    case 'speech-ended':
      return finishSpeech(state)
    case 'clear-transcript':
      return { state: { ...state, lines: [] }, effects: [] }
    case 'sample-result':
      return applySampleResult(state, event)
    default:
      return { state, effects: [] }
  }
}

export function releaseVoiceSession(ports: { stopMic: () => void; cancelSpeech: () => void }) {
  ports.stopMic()
  ports.cancelSpeech()
}

function hear(state: VoiceState, event: { text: string; source: 'mic' | 'typed'; now: number }): VoiceStep {
  if (state.phase === 'speaking') return { state, effects: [] }
  if (event.source === 'mic' && state.phase !== 'listening' && state.phase !== 'awake') return { state, effects: [] }
  const text = normalizeHeard(event.text)
  if (!text) return { state, effects: [] }
  if (text === state.lastFinal && event.now - state.lastFinalAt < DEDUPE_MS) return { state, effects: [] }
  const stamped: VoiceState = { ...state, lastFinal: text, lastFinalAt: event.now }
  const parsed = parseUtterance(event.text)
  const withHeard = pushLine(stamped, 'heard', event.text.trim())
  if (parsed.kind === 'ignore') return { state: withHeard, effects: [] }
  if (parsed.kind === 'wake' || parsed.kind === 'wake-and-task') {
    const speaking = beginSpeech(withHeard, SCRIPTED_ACK)
    if (parsed.task) speaking.effects.push({ type: 'file-sample', goal: parsed.task, confirm: false })
    return speaking
  }
  const explicit = event.source === 'typed' || state.awake
  if (!explicit) {
    return { state: pushLine(withHeard, 'status', 'Wake phrase not heard. Nothing was filed.'), effects: [] }
  }
  return {
    state: { ...withHeard, phase: 'speaking', holdMic: true, returnTo: state.phase },
    effects: [{ type: 'stop-mic' }, { type: 'file-sample', goal: parsed.task ?? text, confirm: true }],
  }
}

function applySampleResult(state: VoiceState, event: { filed: boolean; message: string; confirm: boolean }): VoiceStep {
  const noted = pushLine(state, 'status', event.message)
  if (!event.filed) return finishSpeech(noted)
  if (!event.confirm) return { state: noted, effects: [] }
  return {
    state: pushLine(noted, 'script', `${SCRIPT_MARK}: ${SCRIPTED_SAMPLE}`),
    effects: [{ type: 'speak', text: SCRIPTED_SAMPLE }],
  }
}

function beginSpeech(state: VoiceState, text: string): VoiceStep {
  return {
    state: {
      ...pushLine(state, 'script', `${SCRIPT_MARK}: ${text}`),
      phase: 'speaking',
      holdMic: true,
      awake: true,
      returnTo: state.phase,
    },
    effects: [{ type: 'stop-mic' }, { type: 'speak', text }],
  }
}

function finishSpeech(state: VoiceState): VoiceStep {
  if (state.phase !== 'speaking') return { state, effects: [] }
  if (state.session && state.returnTo !== 'muted' && state.returnTo !== 'stopped' && state.returnTo !== 'denied' && state.returnTo !== 'error' && state.returnTo !== 'unsupported') {
    return {
      state: { ...state, phase: 'awake', holdMic: false, resumeCount: 0 },
      effects: [{ type: 'start-mic' }],
    }
  }
  if (state.session && state.returnTo === 'muted') {
    return { state: { ...state, phase: 'muted', holdMic: true }, effects: [] }
  }
  return { state: { ...state, phase: 'stopped', session: false, holdMic: true, awake: state.awake }, effects: [] }
}

function halt(state: VoiceState): VoiceStep {
  if (state.phase === 'stopped' && !state.session) return { state, effects: [] }
  return {
    state: { ...state, phase: 'stopped', session: false, awake: false, holdMic: true, error: null },
    effects: [{ type: 'stop-mic' }, { type: 'cancel-speech' }],
  }
}

function stopLike(state: VoiceState, phase: VoicePhase, message: string): VoiceStep {
  return {
    state: { ...pushLine(state, 'status', message), phase, session: false, awake: false, holdMic: true, error: message },
    effects: [{ type: 'stop-mic' }, { type: 'cancel-speech' }],
  }
}

function pushLine(state: VoiceState, kind: TranscriptKind, text: string): VoiceState {
  return { ...state, lines: [...state.lines, { id: state.nextId, kind, text }], nextId: state.nextId + 1 }
}

export type VoiceOption = { voiceURI: string; name: string; lang: string; localService?: boolean }

export type VoicePrefs = { voiceURI: string | null; rate: number; pitch: number }

export const RATE_MIN = 0.85
export const RATE_MAX = 1.15
export const PITCH_MIN = 0.85
export const PITCH_MAX = 1.15

const PREFS_KEY = 'cnri-voice-prefs-v1'

export const defaultVoicePrefs: VoicePrefs = { voiceURI: null, rate: 1, pitch: 1 }

export function clampVoicePrefs(input: Partial<VoicePrefs> | null | undefined): VoicePrefs {
  const rate = typeof input?.rate === 'number' && Number.isFinite(input.rate) ? input.rate : 1
  const pitch = typeof input?.pitch === 'number' && Number.isFinite(input.pitch) ? input.pitch : 1
  const voiceURI = typeof input?.voiceURI === 'string' && input.voiceURI ? input.voiceURI : null
  return {
    voiceURI,
    rate: Math.min(RATE_MAX, Math.max(RATE_MIN, rate)),
    pitch: Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch)),
  }
}

export function loadVoicePrefs(store: DemoStore): VoicePrefs {
  const raw = store.read()
  if (!raw) return defaultVoicePrefs
  try {
    return clampVoicePrefs(JSON.parse(raw) as Partial<VoicePrefs>)
  } catch {
    return defaultVoicePrefs
  }
}

export function saveVoicePrefs(prefs: VoicePrefs, store: DemoStore) {
  store.write(JSON.stringify(clampVoicePrefs(prefs)))
}

export function voicePrefsKey(): string {
  return PREFS_KEY
}

export function chooseVoice(voices: readonly VoiceOption[], prefs: VoicePrefs): { voice: VoiceOption | null; note: string } {
  const saved = prefs.voiceURI ? voices.find((voice) => voice.voiceURI === prefs.voiceURI) ?? null : null
  const voice = saved ?? preferEnglish(voices)
  if (!voice) return { voice: null, note: 'No speech voices are available in this browser. Replies may be silent.' }
  const british = voice.lang.toLowerCase().startsWith('en-gb')
  const local = voice.localService === false ? ' This browser voice may be downloaded rather than stored on the device.' : ''
  if (british) return { voice, note: `Using ${voice.name} (${voice.lang}). This is a browser voice, not a filmed performance.${local}` }
  return { voice, note: `No en-GB voice is available, so this uses ${voice.name} (${voice.lang}). This is a browser voice, not a filmed performance.${local}` }
}

function preferEnglish(voices: readonly VoiceOption[]): VoiceOption | null {
  const gb = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en-gb'))
  const localGb = gb.find((voice) => voice.localService === true)
  if (localGb) return localGb
  if (gb[0]) return gb[0]
  const en = voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))
  return en ?? voices[0] ?? null
}
