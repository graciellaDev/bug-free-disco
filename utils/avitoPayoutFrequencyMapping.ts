import { normalizeMatchText, unwrapAvitoMappingsPayload } from '@/utils/avitoSpecializationMapping'
import { HH_SALARY_FREQUENCY } from '@/src/constants'

/** Частота выплат в основной форме (InfoTab / salary_payment_frequency) — 5 значений. */
export const JOBLY_PAYOUT_FREQUENCY_OPTIONS = HH_SALARY_FREQUENCY.map((o) => ({
  id: String(o.id),
  name: String(o.name),
}))

/** Частота выплат в попапе Avito — 4 варианта, как на avito.ru. */
export const AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS = [
  { id: 'weeklyPay', name: 'Раз в неделю' },
  { id: 'monthlyPay', name: 'Раз в месяц' },
  { id: 'biweeklyPay', name: 'Дважды в месяц' },
  { id: 'thriceMonthlyPay', name: 'Трижды в месяц' },
] as const

export type JoblyPayoutFrequencyId = (typeof JOBLY_PAYOUT_FREQUENCY_OPTIONS)[number]['id']
export type AvitoPayoutFrequencyId = (typeof AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS)[number]['id']

const AVITO_POPUP_PAYOUT_FREQUENCY_IDS = new Set(
  AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS.map((o) => o.id),
)

/** Старые id API / черновики → один из четырёх вариантов попапа. */
const LEGACY_AVITO_PAYOUT_TO_POPUP: Record<string, AvitoPayoutFrequencyId> = {
  hourlyPay: 'monthlyPay',
  dailyPay: 'monthlyPay',
  projectPay: 'monthlyPay',
}

/** id Наймикс (5 значений формы) → payout_frequency.id Avito (4 варианта попапа). */
export const DEFAULT_JOBLY_TO_AVITO_PAYOUT_FREQUENCY: Record<JoblyPayoutFrequencyId, AvitoPayoutFrequencyId> = {
  DAILY: 'monthlyPay',
  WEEKLY: 'weeklyPay',
  TWICE_PER_MONTH: 'biweeklyPay',
  MONTHLY: 'monthlyPay',
  PER_PROJECT: 'monthlyPay',
}

const JOBLY_IDS = new Set(JOBLY_PAYOUT_FREQUENCY_OPTIONS.map((o) => o.id))

const JOBLY_NAMES = new Map<string, string>()
for (const o of JOBLY_PAYOUT_FREQUENCY_OPTIONS) {
  JOBLY_NAMES.set(normalizeMatchText(o.name), o.id)
}

const JOBLY_ALIASES: Record<string, JoblyPayoutFrequencyId> = {
  ежедневно: 'DAILY',
  'раз в неделю': 'WEEKLY',
  'два раза в месяц': 'TWICE_PER_MONTH',
  'дважды в месяц': 'TWICE_PER_MONTH',
  'раз в месяц': 'MONTHLY',
  'за проект': 'PER_PROJECT',
  dailypay: 'DAILY',
  weeklypay: 'WEEKLY',
  biweeklypay: 'TWICE_PER_MONTH',
  monthlypay: 'MONTHLY',
  projectpay: 'PER_PROJECT',
}

export function normalizeAvitoPayoutFrequencyIdForPopup(raw: unknown): AvitoPayoutFrequencyId | '' {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; name?: unknown }
    const byId = normalizeAvitoPayoutFrequencyIdForPopup(obj.id)
    if (byId) return byId
    const name = String(obj.name ?? '').trim()
    if (name) {
      const hit = AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS.find(
        (o) => normalizeMatchText(o.name) === normalizeMatchText(name),
      )
      if (hit) return hit.id
    }
    return ''
  }
  const id = String(raw).trim()
  if (!id) return ''
  if (AVITO_POPUP_PAYOUT_FREQUENCY_IDS.has(id as AvitoPayoutFrequencyId)) {
    return id as AvitoPayoutFrequencyId
  }
  const legacy = LEGACY_AVITO_PAYOUT_TO_POPUP[id]
  if (legacy) return legacy
  const norm = normalizeMatchText(id)
  const byName = AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS.find(
    (o) => normalizeMatchText(o.name) === norm || normalizeMatchText(o.id) === norm,
  )
  return byName?.id ?? ''
}

function normalizeJoblyPayoutLabel(v: unknown): string {
  return normalizeMatchText(String(v ?? '').replace(/\u00a0/g, ' '))
}

export function resolveJoblyPayoutFrequencyId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; value?: unknown; name?: unknown }
    const byId = resolveJoblyPayoutFrequencyId(obj.id)
    if (byId) return byId
    return resolveJoblyPayoutFrequencyId(obj.name ?? obj.value)
  }
  const s = String(raw).trim().replace(/\u00a0/g, ' ')
  if (!s) return ''
  if (JOBLY_IDS.has(s)) return s
  const upper = s.toUpperCase()
  if (JOBLY_IDS.has(upper)) return upper
  const norm = normalizeJoblyPayoutLabel(s)
  if (JOBLY_ALIASES[norm]) return JOBLY_ALIASES[norm]
  const byName = JOBLY_NAMES.get(norm)
  if (byName) return byName
  return ''
}

/** Подставить частоту выплат Avito в salary_range из полей вакансии Наймикс. */
export function resolveAvitoPayoutFrequencyForJoblyVacancy(
  vacancy: Record<string, unknown> | null | undefined,
  mappingsRaw: unknown,
): AvitoPayoutFrequencyId | '' {
  const joblyId = resolveJoblyPayoutFrequencyIdFromVacancy(vacancy)
  if (!joblyId) return ''
  return resolveAvitoPayoutFrequencyFromJobly({
    sourceIds: [joblyId],
    mappingsRaw,
  }) as AvitoPayoutFrequencyId | ''
}

export function resolveJoblyPayoutFrequencyIdFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): string {
  if (!vacancy || typeof vacancy !== 'object') return ''
  return resolveJoblyPayoutFrequencyId(
    vacancy.salary_payment_frequency ?? vacancy.salaryPaymentFrequency,
  )
}

export function resolveJoblyPayoutFrequencyIdWithPriority(input: {
  injected?: Record<string, unknown> | null
  glob?: Record<string, unknown> | null
  form?: Record<string, unknown> | null
  preferInjectedOnly?: boolean
}): string {
  const fromInjected = resolveJoblyPayoutFrequencyIdFromVacancy(input.injected)
  if (fromInjected) return fromInjected
  const fromForm = resolveJoblyPayoutFrequencyId(input.form?.salary_payment_frequency)
  if (fromForm) return fromForm
  if (input.preferInjectedOnly) return ''
  return resolveJoblyPayoutFrequencyIdFromVacancy(input.glob)
}

export function resolveAvitoPayoutFrequencyFromJobly(input: {
  sourceIds: string[]
  mappingsRaw: unknown
}): string {
  const mappings = unwrapAvitoMappingsPayload(input.mappingsRaw)
  const joblyId = input.sourceIds.length === 1
    ? resolveJoblyPayoutFrequencyId(input.sourceIds[0])
    : input.sourceIds.map((id) => resolveJoblyPayoutFrequencyId(id)).find(Boolean) ?? ''
  if (!joblyId) return ''
  const mapped = String(mappings[joblyId] ?? DEFAULT_JOBLY_TO_AVITO_PAYOUT_FREQUENCY[joblyId as JoblyPayoutFrequencyId] ?? '').trim()
  return normalizeAvitoPayoutFrequencyIdForPopup(mapped)
}

export function findAvitoPayoutFrequencyOption(freqId: string) {
  const id = normalizeAvitoPayoutFrequencyIdForPopup(freqId)
  if (!id) return null
  return AVITO_POPUP_PAYOUT_FREQUENCY_OPTIONS.find((o) => String(o.id) === id) ?? null
}
