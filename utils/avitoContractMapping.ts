import { HH_OFORMLENIE_MULTISELECT_OPTIONS } from '@/utils/hhVacancyPayloadConstants'
import { unwrapAvitoMappingsPayload } from '@/utils/avitoSpecializationMapping'

/** Кнопки «Вид договора» в попапе Avito (id = enum API registration_method). */
export const AVITO_POPUP_CONTRACT_OPTIONS = [
  { id: 'contract', name: 'Трудовой договор', billingId: 'single' },
  { id: 'gph_ip', name: 'ГПХ с ИП', billingId: 'package' },
  { id: 'gph_self_employed', name: 'ГПХ с самозанятым', billingId: 'packageOrSingle' },
  { id: 'gph_individual', name: 'ГПХ с физическим лицом', billingId: 'single' },
] as const

export type AvitoContractOptionId = (typeof AVITO_POPUP_CONTRACT_OPTIONS)[number]['id']
export type AvitoBillingTypeId = (typeof AVITO_POPUP_CONTRACT_OPTIONS)[number]['billingId']

/** Допустимые значения registration_method в API Avito Job. */
export const AVITO_REGISTRATION_METHOD_API_ENUM = [
  'contract',
  'gph_ip',
  'gph_self_employed',
  'gph_individual',
] as const

export type AvitoRegistrationMethodApi = (typeof AVITO_REGISTRATION_METHOD_API_ENUM)[number]

/** Старые id формы / админки → enum API. */
const LEGACY_CONTRACT_KEY_TO_API: Record<string, AvitoRegistrationMethodApi> = {
  labor: 'contract',
  gph_person: 'gph_individual',
}

/** Подпись (RU) или slug → enum API. */
const REGISTRATION_TEXT_TO_API: Record<string, AvitoRegistrationMethodApi> = {
  contract: 'contract',
  labor: 'contract',
  'трудовой договор': 'contract',
  gph_ip: 'gph_ip',
  'гпх с ип': 'gph_ip',
  gph_self_employed: 'gph_self_employed',
  'гпх с самозанятым': 'gph_self_employed',
  gph_individual: 'gph_individual',
  gph_person: 'gph_individual',
  'гпх с физическим лицом': 'gph_individual',
  'гпх с физлицом': 'gph_individual',
}

const AVITO_REGISTRATION_METHOD_API_SET = new Set<string>(AVITO_REGISTRATION_METHOD_API_ENUM)

export function normalizeAvitoContractKeyToApi(key: string): AvitoRegistrationMethodApi | '' {
  const raw = String(key ?? '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (REGISTRATION_TEXT_TO_API[lower]) return REGISTRATION_TEXT_TO_API[lower]
  if (LEGACY_CONTRACT_KEY_TO_API[raw]) return LEGACY_CONTRACT_KEY_TO_API[raw]
  if (AVITO_REGISTRATION_METHOD_API_SET.has(raw)) return raw as AvitoRegistrationMethodApi
  return ''
}

const AVITO_BILLING_PRIORITY: Record<AvitoBillingTypeId, number> = {
  packageOrSingle: 3,
  package: 2,
  single: 1,
}

/** jobly id оформления → id кнопки в попапе Avito (enum API). */
export const DEFAULT_JOBLY_TO_AVITO_CONTRACT: Record<string, string> = {
  labor: 'contract',
  internship: 'contract',
  gph: 'gph_ip',
  SELF_EMPLOYED: 'gph_self_employed',
  INDIVIDUAL_ENTREPRENEUR: 'gph_ip',
  INDIVIDUAL_PERSON: 'gph_individual',
}

const JOBLY_OFORMLENIE_IDS = new Set(
  HH_OFORMLENIE_MULTISELECT_OPTIONS.map((o) => String(o.id).trim()).filter(Boolean),
)

const JOBLY_OFORMLENIE_VALUES = new Set(
  HH_OFORMLENIE_MULTISELECT_OPTIONS.map((o) => String(o.value).trim()).filter(Boolean),
)

export function resolveJoblyOformlenieId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; value?: unknown; name?: unknown }
    const byId = resolveJoblyOformlenieId(obj.id)
    if (byId) return byId
    const byValue = resolveJoblyOformlenieId(obj.value)
    if (byValue) return byValue
    return resolveJoblyOformlenieId(obj.name)
  }
  const s = String(raw).trim()
  if (!s) return ''
  if (JOBLY_OFORMLENIE_IDS.has(s)) return s
  const lower = s.toLowerCase()
  for (const opt of HH_OFORMLENIE_MULTISELECT_OPTIONS) {
    if (String(opt.id).toLowerCase() === lower) return opt.id
    if (String(opt.value).toLowerCase() === lower) return opt.id
    if (String(opt.name).toLowerCase() === lower) return opt.id
  }
  if (JOBLY_OFORMLENIE_VALUES.has(s)) {
    const hit = HH_OFORMLENIE_MULTISELECT_OPTIONS.find((o) => o.value === s)
    return hit?.id ?? s
  }
  return ''
}

export function collectJoblyOformlenieIdsFromList(raw: unknown): string[] {
  const ids: string[] = []
  const push = (item: unknown) => {
    const id = resolveJoblyOformlenieId(item)
    if (id && !ids.includes(id)) ids.push(id)
  }
  if (raw == null) return ids
  if (Array.isArray(raw)) {
    raw.forEach(push)
    return ids
  }
  push(raw)
  return ids
}

export function resolveAvitoContractsFromJobly(input: {
  sourceIds: string[]
  mappingsRaw: unknown
}): string[] {
  const mappings = unwrapAvitoMappingsPayload(input.mappingsRaw)
  const result: string[] = []
  for (const joblyId of input.sourceIds) {
    const key = String(joblyId ?? '').trim()
    if (!key) continue
    const mappedRaw = String(mappings[key] ?? DEFAULT_JOBLY_TO_AVITO_CONTRACT[key] ?? '').trim()
    const mapped = normalizeAvitoContractKeyToApi(mappedRaw)
    if (mapped && !result.includes(mapped)) result.push(mapped)
  }
  return result
}

/** Первое сопоставление (для обратной совместимости). */
export function resolveAvitoContractFromJobly(input: {
  sourceIds: string[]
  mappingsRaw: unknown
}): string {
  return resolveAvitoContractsFromJobly(input)[0] ?? ''
}

export function collectAvitoContractKeysFromForm(vacancyData: {
  avito_contract_keys?: unknown
  avito_contract_key?: unknown
} | null | undefined): string[] {
  const raw = vacancyData?.avito_contract_keys
  if (Array.isArray(raw)) {
    const keys = raw.map((v) => String(v ?? '').trim()).filter(Boolean)
    if (keys.length > 0) return [...new Set(keys)]
  }
  const legacy = vacancyData?.avito_contract_key != null ? String(vacancyData.avito_contract_key).trim() : ''
  return legacy ? [legacy] : []
}

/** Ключи формы → registration_method для API Avito (enum slug, не RU-подписи). */
export function mapAvitoContractKeysToRegistrationApi(keys: string[]): AvitoRegistrationMethodApi[] {
  const apiValues: AvitoRegistrationMethodApi[] = []
  for (const key of keys) {
    const api = normalizeAvitoContractKeyToApi(key)
    if (api && !apiValues.includes(api)) apiValues.push(api)
  }
  return apiValues
}

/** @deprecated Используйте mapAvitoContractKeysToRegistrationApi */
export function mapAvitoContractKeysToRegistrationLabels(keys: string[]): string[] {
  return mapAvitoContractKeysToRegistrationApi(keys)
}

export function resolveBillingTypeFromContractKeys(keys: string[]): AvitoBillingTypeId | '' {
  let best: AvitoBillingTypeId | '' = ''
  let bestRank = 0
  for (const key of keys) {
    const apiKey = normalizeAvitoContractKeyToApi(key) || key
    const opt = AVITO_POPUP_CONTRACT_OPTIONS.find((o) => o.id === apiKey)
    if (!opt) continue
    const rank = AVITO_BILLING_PRIORITY[opt.billingId] ?? 0
    if (rank > bestRank) {
      bestRank = rank
      best = opt.billingId
    }
  }
  return best
}
