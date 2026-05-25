import { normalizeMatchText, unwrapAvitoMappingsPayload } from '@/utils/avitoSpecializationMapping'

/** «На руки» / «До вычета налогов» в основной форме (InfoTab: salaryType). */
export const JOBLY_SALARY_TAX_OPTIONS = [
  { id: 'past-cash', name: 'На руки' },
  { id: 'full-cash', name: 'До вычета налогов' },
] as const

/** Варианты в попапе Avito (salary_range.gross). */
export const AVITO_POPUP_SALARY_TAX_OPTIONS = [
  { id: 'net', name: 'На руки' },
  { id: 'gross', name: 'До вычета налогов' },
] as const

export type JoblySalaryTaxId = (typeof JOBLY_SALARY_TAX_OPTIONS)[number]['id']
export type AvitoSalaryTaxId = (typeof AVITO_POPUP_SALARY_TAX_OPTIONS)[number]['id']

/** jobly id → id варианта в Avito */
export const DEFAULT_JOBLY_TO_AVITO_SALARY_TAX: Record<string, AvitoSalaryTaxId> = {
  'past-cash': 'net',
  'full-cash': 'gross',
}

const JOBLY_TAX_IDS = new Set(JOBLY_SALARY_TAX_OPTIONS.map((o) => String(o.id)))
const JOBLY_TAX_NAMES = new Map(
  JOBLY_SALARY_TAX_OPTIONS.map((o) => [normalizeMatchText(o.name), o.id]),
)

export function resolveJoblySalaryTaxId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; name?: unknown }
    const byId = resolveJoblySalaryTaxId(obj.id)
    if (byId) return byId
    return resolveJoblySalaryTaxId(obj.name)
  }
  const s = String(raw).trim()
  if (!s) return ''
  if (JOBLY_TAX_IDS.has(s)) return s
  const byName = JOBLY_TAX_NAMES.get(normalizeMatchText(s))
  if (byName) return byName
  const lower = s.toLowerCase()
  if (lower.includes('до вычета') || lower === 'gross' || lower === 'full-cash') return 'full-cash'
  if (lower.includes('на руки') || lower.includes('после вычета') || lower === 'net' || lower === 'past-cash') {
    return 'past-cash'
  }
  return ''
}

export function resolveJoblySalaryTaxIdFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): string {
  if (!vacancy || typeof vacancy !== 'object') return ''
  return resolveJoblySalaryTaxId(
    vacancy.salary_tax_id ??
    vacancy.salaryTaxId ??
    vacancy.salary_type ??
    vacancy.salaryType,
  )
}

export function resolveJoblySalaryTaxIdWithPriority(input: {
  injected?: Record<string, unknown> | null
  glob?: Record<string, unknown> | null
  preferInjectedOnly?: boolean
}): string {
  const fromInjected = resolveJoblySalaryTaxIdFromVacancy(input.injected)
  if (fromInjected) return fromInjected
  if (input.preferInjectedOnly) return ''
  return resolveJoblySalaryTaxIdFromVacancy(input.glob)
}

export function avitoSalaryTaxIdToGross(avitoTaxId: string): boolean | undefined {
  const id = String(avitoTaxId ?? '').trim().toLowerCase()
  if (id === 'gross' || id === 'full-cash' || id === 'full_cash') return true
  if (id === 'net' || id === 'past-cash' || id === 'past_cash') return false
  return undefined
}

export function resolveAvitoSalaryTaxFromJobly(input: {
  sourceIds: string[]
  mappingsRaw: unknown
}): string {
  const mappings = unwrapAvitoMappingsPayload(input.mappingsRaw)
  const joblyId = input.sourceIds.length === 1
    ? String(input.sourceIds[0] ?? '').trim()
    : input.sourceIds.map((id) => resolveJoblySalaryTaxId(id)).find(Boolean) ?? ''
  if (!joblyId) return ''
  return String(mappings[joblyId] ?? DEFAULT_JOBLY_TO_AVITO_SALARY_TAX[joblyId] ?? '').trim()
}

export function resolveAvitoGrossFromJoblyMapping(input: {
  sourceIds: string[]
  mappingsRaw: unknown
}): boolean | undefined {
  const avitoTaxId = resolveAvitoSalaryTaxFromJobly(input)
  if (!avitoTaxId) return undefined
  return avitoSalaryTaxIdToGross(avitoTaxId)
}

export function mapJoblySalaryGrossToAvitoTaxes(gross: boolean): string {
  return gross ? 'До вычета налогов' : 'На руки'
}
