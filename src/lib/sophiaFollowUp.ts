import { isSupabaseConfigured, supabase } from './supabase'
import { assertWithinDailyBudget, trackUsage } from './usageMeter'

export interface SophiaFollowUpMessage {
  role: 'user' | 'assistant'
  content: string
}

/** Context is truncated so the bundled first message stays under the 4000-char server limit. */
export const MAX_FOLLOWUP_CONTEXT_LENGTH = 2500
export const MAX_FOLLOWUP_QUESTION_LENGTH = 1000
export const MAX_FOLLOWUP_HISTORY = 8

/**
 * Ask Sophia about an AI result shown elsewhere in the app. The first turn
 * bundles the result as context; later turns reuse the conversation history
 * so the context is not re-sent (and re-billed) every time.
 */
export async function requestSophiaFollowUp(
  question: string,
  context: string,
  language: 'en' | 'es',
  history: SophiaFollowUpMessage[] = []
): Promise<string> {
  const trimmedQuestion = question.trim()
  if (!trimmedQuestion) {
    throw new Error('Type a question for Sophia first.')
  }
  if (trimmedQuestion.length > MAX_FOLLOWUP_QUESTION_LENGTH) {
    throw new Error(
      `Question must be ${MAX_FOLLOWUP_QUESTION_LENGTH} characters or fewer.`
    )
  }
  const trimmedContext = context.trim()
  if (!trimmedContext) {
    throw new Error('There is no result to discuss yet.')
  }
  assertWithinDailyBudget()
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Sophia is not configured. Check the Supabase environment settings.'
    )
  }

  const priorTurns = history
    .filter(
      (item) =>
        (item.role === 'user' || item.role === 'assistant') &&
        item.content.trim().length > 0
    )
    .slice(-MAX_FOLLOWUP_HISTORY)

  const isFirstTurn = priorTurns.length === 0
  const message = isFirstTurn
    ? language === 'es'
      ? `Estoy preguntando sobre este resultado de ShieldPocket:\n---\n${trimmedContext.slice(0, MAX_FOLLOWUP_CONTEXT_LENGTH)}\n---\nMi pregunta: ${trimmedQuestion}`
      : `I am asking about this ShieldPocket result:\n---\n${trimmedContext.slice(0, MAX_FOLLOWUP_CONTEXT_LENGTH)}\n---\nMy question: ${trimmedQuestion}`
    : trimmedQuestion

  const { data, error } = await supabase.functions.invoke('sophia-chat', {
    body: {
      message,
      history: isFirstTurn ? [] : priorTurns,
    },
  })

  if (error) throw error
  if (data?.error) {
    throw new Error(
      typeof data.error === 'string' ? data.error : 'Sophia could not respond.'
    )
  }
  const reply = typeof data?.reply === 'string' ? data.reply.trim() : ''
  if (!reply) {
    throw new Error('Sophia returned an empty response.')
  }
  trackUsage(data)
  return reply
}
