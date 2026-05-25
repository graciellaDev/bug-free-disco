import { normalizeMatchText, unwrapAvitoMappingsPayload } from '@/utils/avitoSpecializationMapping'

/** Период зарплаты в основной форме (InfoTab: salaryPeriodOptions / salary_frequency). */
export const JOBLY_SALARY_PERIOD_OPTIONS = [
  { id: 'per_month', name: 'За месяц' },
  { id: 'per_shift', name: 'За смену' },
  { id: 'per_hour', name: 'За час' },
  { id: 'per_fly_in', name: 'За вахту' },
  { id: 'per_service', name: 'За услугу' },
] as const

/** Период, за который указывается сумма в попапе Avito (salary_range.mode). */
export const AVITO_POPUP_SALARY_MODE_OPTIONS = [
  { id: 'monthly', name: 'в месяц' },
  { id: 'weekly', name: 'в неделю' },
  { id: 'shift', name: 'за смену' },
  { id: 'hourly', name: 'за час' },
  { id: 'piecework', name: 'сдельная оплата' },
] as const

export type JoblySalaryPeriodId = (typeof JOBLY_SALARY_PERIOD_OPTIONS)[number]['id']
export type AvitoSalaryModeId = (typeof AVITO_POPUP_SALARY_MODE_OPTIONS)[number]['id']

/** jobly id периода → id режима зарплаты в попапе Avito */
export const DEFAULT_JOBLY_TO_AVITO_SALARY_PERIOD: Record<string, AvitoSalaryModeId> = {
  per_month: 'monthly',
  per_shift: 'shift',
  per_hour: 'hourly',
  per_fly_in: 'shift',
  per_service: 'piecework',
}

const JOBLY_PERIOD_IDS = new Set(
  JOBLY_SALARY_PERIOD_OPTIONS.map((o) => String(o.id).trim()).filter(Boolean),
)

const JOBLY_PERIOD_NAMES = new Map(
  JOBLY_SALARY_PERIOD_OPTIONS.map((o) => [normalizeMatchText(o.name), o.id]),
)

export function resolveJoblySalaryPeriodId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; value?: unknown; name?: unknown }
    const byId = resolveJoblySalaryPeriodId(obj.id)
    if (byId) return byId
    return resolveJoblySalaryPeriodId(obj.name ?? obj.value)
  }
  const s = String(raw).trim()
  if (!s) return ''
  if (JOBLY_PERIOD_IDS.has(s)) return s
  const byName = JOBLY_PERIOD_NAMES.get(normalizeMatchText(s))
  if (byName) return byName
  const lower = s.toLowerCase()
  for (const opt of JOBLY_SALARY_PERIOD_OPTIONS) {
    if (String(opt.id).toLowerCase() === lower) return opt.id
    if (normalizeMatchText(opt.name) === normalizeMatchText(s)) return opt.id
  }
  return ''
}

export function resolveJoblySalaryPeriodIdFromSources(
  sources: Array<unknown>,
): string {
  for (const raw of sources) {
    const id = resolveJoblySalaryPeriodId(raw)
    if (id) return id
  }
  return ''
}

/** Читает период выплат из объекта вакансии Jobly (разные имена полей с бэкенда / формы). */
export function resolveJoblySalaryPeriodIdFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): string {
  if (!vacancy || typeof vacancy !== 'object') return ''
  return resolveJoblySalaryPeriodIdFromSources([
    vacancy.salary_frequency,
    vacancy.salaryFrequency,
    vacancy.salary_period,
    vacancy.salaryPeriod,
  ])
}

/**
 * Один jobly id периода с приоритетом источников.
 * При публикации с карточки — только injected (актуальная форма), без устаревшего glob/API.
 */
export function resolveJoblySalaryPeriodIdWithPriority(input: {
  injected?: Record<string, unknown> | null
  glob?: Record<string, unknown> | null
  /** Поля формы публикации после fillForm (копия salary_frequency с вакансии). */
  form?: Record<string, unknown> | null
  preferInjectedOnly?: boolean
}): string {
  const fromInjected = resolveJoblySalaryPeriodIdFromVacancy(input.injected)
  if (fromInjected) return fromInjected
  const fromForm = resolveJoblySalaryPeriodIdFromVacancy(input.form)
  if (fromForm) return fromForm
  if (input.preferInjectedOnly) return ''
  return resolveJoblySalaryPeriodIdFromVacancy(input.glob)
}

export function resolveAvitoSalaryPeriodFromJobly(input: {
  sourceIds: string[]
  mappingsRaw: unknown
}): string {
  const mappings = unwrapAvitoMappingsPayload(input.mappingsRaw)
  const joblyId = input.sourceIds.length === 1
    ? String(input.sourceIds[0] ?? '').trim()
    : resolveJoblySalaryPeriodIdFromSources(input.sourceIds)
  if (!joblyId) return ''
  return String(mappings[joblyId] ?? DEFAULT_JOBLY_TO_AVITO_SALARY_PERIOD[joblyId] ?? '').trim()
}

export function findAvitoSalaryModeOption(modeId: string) {
  const id = String(modeId ?? '').trim()
  if (!id) return null
  return AVITO_POPUP_SALARY_MODE_OPTIONS.find((o) => String(o.id) === id) ?? null
}
