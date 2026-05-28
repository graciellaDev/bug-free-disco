import { inject, type InjectionKey } from 'vue'

export type CandidateCardContext = Record<string, unknown>

export const CANDIDATE_CARD_CONTEXT_KEY: InjectionKey<CandidateCardContext> = Symbol('candidate-card')

export function useCandidateCardContext(): CandidateCardContext {
  const ctx = inject(CANDIDATE_CARD_CONTEXT_KEY)
  if (!ctx) {
    throw new Error('useCandidateCardContext: ожидается provide из BlockCandidateTabsInfo.vue')
  }
  return ctx
}
