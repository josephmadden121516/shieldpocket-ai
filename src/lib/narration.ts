/**
 * Spoken narration for the guided war-room demo. Uses the on-device Web
 * Speech API: no audio leaves the device and no API credits are used.
 * Voices are picked to match the demo language (en-US / es-MX).
 */

export function isNarrationSupported(): boolean {
  return (
    typeof window !== 'undefined' && 'speechSynthesis' in window
  )
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis
  const cached = synth.getVoices()
  if (cached.length > 0) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      synth.removeEventListener('voiceschanged', handleVoicesChanged)
      resolve(synth.getVoices())
    }, 1200)

    function handleVoicesChanged() {
      window.clearTimeout(timeout)
      synth.removeEventListener('voiceschanged', handleVoicesChanged)
      resolve(synth.getVoices())
    }

    synth.addEventListener('voiceschanged', handleVoicesChanged)
  })
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  language: 'en' | 'es'
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null
  const exact =
    language === 'es' ? /^es[-_]MX$/i : /^en[-_]US$/i
  const loose = language === 'es' ? /^es[-_]/i : /^en[-_]/i
  return (
    voices.find((voice) => exact.test(voice.lang)) ??
    voices.find((voice) => loose.test(voice.lang)) ??
    voices.find((voice) => voice.default) ??
    voices[0] ??
    null
  )
}

/** Speak one narration line, cancelling any line still playing. */
export async function speakNarration(
  text: string,
  language: 'en' | 'es'
): Promise<void> {
  if (!isNarrationSupported()) return
  const trimmed = text.trim()
  if (!trimmed) return
  const synth = window.speechSynthesis
  synth.cancel()
  const voices = await loadVoices()
  // The demo may have been stopped or paused while voices loaded.
  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.lang = language === 'es' ? 'es-MX' : 'en-US'
  utterance.rate = language === 'es' ? 1.02 : 0.96
  const voice = pickVoice(voices, language)
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

/** Stop any narration currently playing. Safe to call anytime. */
export function stopNarration(): void {
  if (!isNarrationSupported()) return
  window.speechSynthesis.cancel()
}
