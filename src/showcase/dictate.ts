export type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

export type SpeechErrorEvent = { error: string }

export type SpeechSession = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechResultEvent) => void) | null
  onerror: ((event: SpeechErrorEvent) => void) | null
  onend: (() => void) | null
}

export type SpeechCtor = new () => SpeechSession

export type SpeechHost = {
  SpeechRecognition?: SpeechCtor
  webkitSpeechRecognition?: SpeechCtor
}

/** Returns the browser constructor only when the host actually exposes one. */
export function findSpeechRecognition(host: SpeechHost): SpeechCtor | null {
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null
}
