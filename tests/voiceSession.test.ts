import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { memoryStore } from '../src/showcase/storage.ts'
import {
  PRIVACY_NOTICE,
  SCRIPTED_ACK,
  SCRIPTED_SAMPLE,
  VOICE_PROTOTYPE_LABEL,
  chooseVoice,
  clampVoicePrefs,
  initialVoiceState,
  loadVoicePrefs,
  parseUtterance,
  reduceVoice,
  releaseVoiceSession,
  saveVoicePrefs,
  voiceStatus,
  type VoiceState,
} from '../src/showcase/voice/voiceSession.ts'

function hear(state: VoiceState, text: string, source: 'mic' | 'typed', now: number) {
  return reduceVoice(state, { type: 'heard', text, source, now })
}

function boot(): VoiceState {
  const started = reduceVoice(initialVoiceState, { type: 'start-clicked' })
  expect(started.effects.map((effect) => effect.type)).toEqual(['start-mic'])
  expect(voiceStatus(started.state).listening).toBe(false)
  const live = reduceVoice(started.state, { type: 'mic-live' })
  expect(live.state.phase).toBe('listening')
  expect(voiceStatus(live.state)).toMatchObject({ title: 'Listening', listening: true })
  return live.state
}

describe('wake parsing', () => {
  it('accepts only the two foreground phrases, including punctuation', () => {
    expect(parseUtterance('Hello Jarvis')).toEqual({ kind: 'wake', task: null })
    expect(parseUtterance('Hello Jarvis, are you up?')).toEqual({ kind: 'wake', task: null })
    expect(parseUtterance('  hello   jarvis are you up  ')).toEqual({ kind: 'wake', task: null })
    expect(parseUtterance('Hello Jarvis, prepare a sample checklist')).toEqual({ kind: 'wake-and-task', task: 'prepare a sample checklist' })
    expect(parseUtterance('hey jarvis')).toMatchObject({ kind: 'task' })
    expect(parseUtterance('jarvis')).toMatchObject({ kind: 'task' })
    expect(parseUtterance('   ')).toEqual({ kind: 'ignore', task: null })
  })
})

describe('voice session state', () => {
  it('speaks the scripted acknowledgement and pauses the microphone', () => {
    const state = boot()
    const step = hear(state, 'Hello Jarvis, are you up?', 'mic', 1_000)
    expect(step.state.phase).toBe('speaking')
    expect(step.state.awake).toBe(true)
    expect(voiceStatus(step.state).listening).toBe(false)
    expect(step.effects.map((effect) => effect.type)).toEqual(['stop-mic', 'speak'])
    expect(step.effects[1]).toMatchObject({ type: 'speak', text: SCRIPTED_ACK })
    expect(step.state.lines.some((line) => line.text.includes(SCRIPTED_ACK))).toBe(true)
    const echo = hear(step.state, 'Hello Jarvis', 'mic', 1_100)
    expect(echo.effects).toEqual([])
    expect(echo.state.lines).toHaveLength(step.state.lines.length)
  })

  it('resumes after speech and files a later line only as a sample', () => {
    const awake = reduceVoice(hear(boot(), 'Hello Jarvis', 'mic', 1_000).state, { type: 'speech-ended' })
    expect(awake.effects.map((effect) => effect.type)).toEqual(['start-mic'])
    expect(awake.state.phase).toBe('awake')
    expect(voiceStatus(awake.state).listening).toBe(true)
    const task = hear(awake.state, 'Prepare a sample onboarding checklist', 'mic', 3_000)
    expect(task.effects).toContainEqual({ type: 'file-sample', goal: 'prepare a sample onboarding checklist', confirm: true })
    expect(task.effects.some((effect) => effect.type === 'speak' && effect.text.includes('team'))).toBe(false)
    const filed = reduceVoice(task.state, { type: 'sample-result', filed: true, confirm: true, message: 'Showcase demo — sample tasks; no external actions Sample coordination brief. Nothing was sent.' })
    expect(filed.effects).toEqual([{ type: 'speak', text: SCRIPTED_SAMPLE }])
    expect(filed.state.lines.at(-1)?.text).toContain(SCRIPTED_SAMPLE)
  })

  it('does not file ambient speech before the wake phrase', () => {
    const step = hear(boot(), 'Prepare a sample checklist', 'mic', 1_000)
    expect(step.effects).toEqual([])
    expect(step.state.phase).toBe('listening')
    expect(step.state.lines.at(-1)?.text).toContain('Nothing was filed')
  })

  it('ignores a repeated final and accepts the same phrase after the dedupe window', () => {
    const first = hear(boot(), 'Hello Jarvis', 'mic', 5_000)
    const awake = reduceVoice(first.state, { type: 'speech-ended' }).state
    const repeat = hear(awake, 'Hello Jarvis', 'mic', 5_400)
    expect(repeat.state).toBe(awake)
    const later = hear(awake, 'Hello Jarvis', 'mic', 7_000)
    expect(later.state.phase).toBe('speaking')
  })

  it('does not restart while speaking, then restarts once and stops on a second unexpected end', () => {
    const speaking = hear(boot(), 'Hello Jarvis', 'mic', 1_000).state
    expect(reduceVoice(speaking, { type: 'recognizer-ended' }).effects).toEqual([])
    const listening = boot()
    const once = reduceVoice(listening, { type: 'recognizer-ended' })
    expect(once.effects).toEqual([{ type: 'start-mic' }])
    expect(once.state.phase).toBe('listening')
    const twice = reduceVoice(once.state, { type: 'recognizer-ended' })
    expect(twice.effects.map((effect) => effect.type)).toEqual(['stop-mic', 'cancel-speech'])
    expect(voiceStatus(twice.state)).toMatchObject({ title: 'Stopped', listening: false })
    expect(twice.state.error).toContain('Not listening')
  })

  it('stop, deny, unsupported, mute, and a late speech end stay not listening', () => {
    const live = boot()
    const stopped = reduceVoice(live, { type: 'stop' })
    expect(stopped.state.phase).toBe('stopped')
    expect(stopped.effects.map((effect) => effect.type)).toEqual(['stop-mic', 'cancel-speech'])
    expect(reduceVoice(stopped.state, { type: 'speech-ended' }).effects).toEqual([])
    expect(voiceStatus(reduceVoice(live, { type: 'denied' }).state).listening).toBe(false)
    expect(voiceStatus(reduceVoice(live, { type: 'unsupported' }).state).title).toBe('Speech recognition unavailable')
    const muted = reduceVoice(live, { type: 'mute' })
    expect(voiceStatus(muted.state)).toMatchObject({ title: 'Muted', listening: false })
    const unmuted = reduceVoice(muted.state, { type: 'unmute' })
    expect(unmuted.effects).toEqual([{ type: 'start-mic' }])
    expect(reduceVoice(stopped.state, { type: 'start-clicked' }).state.phase).toBe('starting')
  })

  it('lets a typed line run without a microphone session and does not resume the mic', () => {
    const typed = hear(initialVoiceState, 'Hello Jarvis, are you up?', 'typed', 1_000)
    expect(typed.effects.map((effect) => effect.type)).toEqual(['stop-mic', 'speak'])
    expect(typed.state.session).toBe(false)
    const ended = reduceVoice(typed.state, { type: 'speech-ended' })
    expect(ended.effects).toEqual([])
    expect(voiceStatus(ended.state)).toMatchObject({ title: 'Stopped', listening: false })
    const task = hear(initialVoiceState, 'Prepare a sample onboarding checklist', 'typed', 2_000)
    expect(task.effects).toContainEqual({ type: 'file-sample', goal: 'prepare a sample onboarding checklist', confirm: true })
    const blocked = reduceVoice(task.state, { type: 'sample-result', filed: false, confirm: true, message: 'A sample is already open in this tab. Reset it before starting another. Nothing was sent.' })
    expect(blocked.effects.some((effect) => effect.type === 'speak')).toBe(false)
    expect(voiceStatus(blocked.state).listening).toBe(false)
  })

  it('clears the transcript without ending a live session', () => {
    const heard = hear(boot(), 'hello there', 'mic', 1_000)
    const cleared = reduceVoice(heard.state, { type: 'clear-transcript' })
    expect(cleared.state.lines).toEqual([])
    expect(cleared.state.phase).toBe('listening')
  })

  it('releases the microphone and speech on unmount', () => {
    const stopMic = vi.fn()
    const cancelSpeech = vi.fn()
    releaseVoiceSession({ stopMic, cancelSpeech })
    expect(stopMic).toHaveBeenCalledOnce()
    expect(cancelSpeech).toHaveBeenCalledOnce()
  })
})

describe('browser voice choice', () => {
  const voices = [
    { voiceURI: 'us', name: 'Alex', lang: 'en-US', localService: true },
    { voiceURI: 'gb-remote', name: 'Daniel', lang: 'en-GB', localService: false },
    { voiceURI: 'gb', name: 'Kate', lang: 'en-GB', localService: true },
  ]

  it('prefers a local en-GB voice and says when none exists', () => {
    expect(chooseVoice(voices, clampVoicePrefs(null)).voice?.voiceURI).toBe('gb')
    expect(chooseVoice(voices, clampVoicePrefs(null)).note).toContain('not a filmed performance')
    const american = chooseVoice(voices.filter((voice) => voice.lang === 'en-US'), clampVoicePrefs({ rate: 9, pitch: 0 }))
    expect(american.voice?.lang).toBe('en-US')
    expect(american.note).toContain('No en-GB voice')
    expect(american.voice && clampVoicePrefs({ rate: 9, pitch: 0 })).toMatchObject({ rate: 1.15, pitch: 0.85 })
    const saved = chooseVoice(voices, clampVoicePrefs({ voiceURI: 'us', rate: 1, pitch: 1 }))
    expect(saved.voice?.voiceURI).toBe('us')
    expect(chooseVoice([], clampVoicePrefs(null)).note).toContain('No speech voices')
    const remote = chooseVoice(voices.filter((voice) => voice.voiceURI === 'gb-remote'), clampVoicePrefs(null))
    expect(remote.note).toContain('downloaded')
  })

  it('persists clamped preferences in the provided store', () => {
    const store = memoryStore()
    saveVoicePrefs({ voiceURI: 'gb', rate: 4, pitch: 0.2 }, store)
    expect(loadVoicePrefs(store)).toEqual({ voiceURI: 'gb', rate: 1.15, pitch: 0.85 })
    expect(loadVoicePrefs(memoryStore('{'))).toEqual({ voiceURI: null, rate: 1, pitch: 1 })
  })
})

describe('voice prototype boundaries', () => {
  it('keeps the engine local and the screen honest about the prototype', () => {
    const source = readFileSync('src/showcase/voice/voiceSession.ts', 'utf8')
    expect(source).not.toMatch(/fetch\s*\(|supabase|WebSocket|XMLHttpRequest|api[_-]?key/i)
    expect(PRIVACY_NOTICE).toContain('browser vendor')
    expect(PRIVACY_NOTICE).toContain('no computer-wide wake word')
    expect(VOICE_PROTOTYPE_LABEL).toContain('not connected')
    const ui = readFileSync('src/showcase/voice/VoicePrototype.tsx', 'utf8')
    expect(ui).toContain('releaseVoiceSession')
    expect(ui).toContain('Start voice session')
    expect(ui).toContain('SHOWCASE_BANNER')
    const css = readFileSync('src/showcase/voice/voice.css', 'utf8')
    expect(css).toContain('prefers-reduced-motion')
    expect(css).toContain('max-width: 720px')
  })
})
