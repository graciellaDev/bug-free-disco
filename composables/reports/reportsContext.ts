import { inject, type InjectionKey, type UnwrapRef } from 'vue'

/** Контекст страницы отчётов — provide из Reports.vue, inject во views. */
export type ReportsContext = Record<string, unknown>

export const REPORTS_CONTEXT_KEY: InjectionKey<ReportsContext> = Symbol('reports-page')

export function useReportsContext(): UnwrapRef<ReportsContext> {
  const ctx = inject(REPORTS_CONTEXT_KEY)
  if (!ctx) {
    throw new Error('useReportsContext: ожидается provide из pages/Reports.vue')
  }
  return ctx
}
