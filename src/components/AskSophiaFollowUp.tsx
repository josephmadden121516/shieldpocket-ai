import { useState, type FormEvent } from 'react'
import {
  MAX_FOLLOWUP_QUESTION_LENGTH,
  requestSophiaFollowUp,
  type SophiaFollowUpMessage,
} from '../lib/sophiaFollowUp'
import './AskSophiaFollowUp.css'

interface AskSophiaFollowUpProps {
  language: 'en' | 'es'
  /** The AI result the user can ask about. */
  context: string
  /**
   * Identity of the result. When it changes (a fresh result was generated),
   * the follow-up thread resets so questions never attach to a stale result.
   */
  contextKey: string
}

const SUGGESTIONS: Array<{ en: string; es: string }> = [
  {
    en: 'Explain this in simple terms.',
    es: 'Explícame esto en términos simples.',
  },
  {
    en: 'What should I do first?',
    es: '¿Qué debería hacer primero?',
  },
]

export function AskSophiaFollowUp({
  language,
  context,
  contextKey,
}: AskSophiaFollowUpProps) {
  const isEs = language === 'es'
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<SophiaFollowUpMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastContextKey, setLastContextKey] = useState(contextKey)

  // Fresh result: reset the thread during render so questions never attach
  // to a stale result.
  if (lastContextKey !== contextKey) {
    setLastContextKey(contextKey)
    setMessages([])
    setInput('')
    setErrorMessage('')
  }

  async function ask(question: string) {
    const trimmed = question.trim()
    if (!trimmed || busy) return
    const prior = messages
    setBusy(true)
    setErrorMessage('')
    setMessages((current) => [...current, { role: 'user', content: trimmed }])
    setInput('')
    try {
      const reply = await requestSophiaFollowUp(
        trimmed,
        context,
        language,
        prior
      )
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (error) {
      console.error('Sophia follow-up failed.', error)
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isEs
            ? 'Sophia no pudo responder. Inténtalo de nuevo.'
            : 'Sophia could not respond. Please try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await ask(input)
  }

  return (
    <div className="ask-sophia">
      <button
        type="button"
        className="secondary-button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen
          ? isEs
            ? 'Ocultar preguntas a Sophia'
            : 'Hide Ask Sophia'
          : isEs
            ? 'Preguntar a Sophia (~1¢ por pregunta)'
            : 'Ask Sophia about this (~1¢ per question)'}
      </button>

      {isOpen && (
        <div className="ask-sophia-panel">
          <p className="ask-sophia-note">
            {isEs
              ? 'Tus preguntas y un extracto de este resultado se envían a Sophia y usan créditos de API.'
              : 'Your questions and an excerpt of this result are sent to Sophia and use API credits.'}
          </p>

          {messages.length === 0 && (
            <div className="ask-sophia-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.en}
                  type="button"
                  className="ask-sophia-chip"
                  disabled={busy}
                  onClick={() => void ask(isEs ? suggestion.es : suggestion.en)}
                >
                  {isEs ? suggestion.es : suggestion.en}
                </button>
              ))}
            </div>
          )}

          {messages.length > 0 && (
            <div
              className="ask-sophia-transcript"
              role="status"
              aria-live="polite"
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`ask-sophia-message ask-sophia-message-${message.role}`}
                >
                  <strong>
                    {message.role === 'user'
                      ? isEs
                        ? 'Tú'
                        : 'You'
                      : 'Sophia'}
                  </strong>
                  <p>{message.content}</p>
                </div>
              ))}
              {busy && (
                <p className="ask-sophia-thinking" role="status">
                  {isEs ? 'Sophia está pensando…' : 'Sophia is thinking…'}
                </p>
              )}
            </div>
          )}

          {errorMessage && (
            <p className="ask-sophia-error" role="alert">
              {errorMessage}
            </p>
          )}

          <form onSubmit={(event) => void submitQuestion(event)}>
            <label htmlFor={`ask-sophia-input-${contextKey.length}-${messages.length}`}>
              {isEs ? 'Tu pregunta' : 'Your question'}
            </label>
            <div className="ask-sophia-input-row">
              <input
                id={`ask-sophia-input-${contextKey.length}-${messages.length}`}
                type="text"
                value={input}
                maxLength={MAX_FOLLOWUP_QUESTION_LENGTH}
                disabled={busy}
                autoComplete="off"
                onChange={(event) => {
                  setInput(event.target.value)
                  setErrorMessage('')
                }}
                placeholder={
                  isEs
                    ? 'Pregunta sobre este resultado…'
                    : 'Ask about this result…'
                }
              />
              <button
                type="submit"
                className="primary-button"
                disabled={busy || !input.trim()}
              >
                {busy
                  ? isEs
                    ? 'Enviando…'
                    : 'Sending…'
                  : isEs
                    ? 'Preguntar'
                    : 'Ask'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
