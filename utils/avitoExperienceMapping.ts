import { normalizeText, unwrapAvitoMappingsPayload } from '@/utils/avitoSpecializationMapping'

export type JoblyExperienceOption = { id: string; name: string; value?: number }
export type AvitoExperienceOption = { id: string; name: string }

export const JOBLY_EXPERIENCE_OPTIONS: JoblyExperienceOption[] = [
  { id: 'noExperience', name: 'Нет опыта', value: 0 },
  { id: 'between1And3', name: 'От 1 до 3 лет', value: 1 },
  { id: 'between3And6', name: 'От 3 до 6 лет', value: 2 },
  { id: 'moreThan6', name: 'От 6 лет', value: 3 },
]

export const DEFAULT_JOBLY_TO_AVITO_EXPERIENCE: Record<string, string> = {
  noExperience: 'noMatter',
  between1And3: 'moreThan1',
  between3And6: 'moreThan3',
  moreThan6: 'moreThan5',
}

/** Как в админке и на Avito: 4 уровня опыта. */
export const AVITO_EXPERIENCE_OPTIONS: AvitoExperienceOption[] = [
  { id: 'noMatter', name: 'Без опыта' },
  { id: 'moreThan1', name: 'От 1 года' },
  { id: 'moreThan3', name: 'От 3 лет' },
  { id: 'moreThan5', name: 'От 5 лет' },
]

const AVITO_EXPERIENCE_IDS = new Set(AVITO_EXPERIENCE_OPTIONS.map((o) => o.id))

const JOBLY_NAME_ALIASES: Record<string, string> = {
  'нет опыта': 'noExperience',
  'без опыта': 'noExperience',
  'от 1 до 3 лет': 'between1And3',
  '1-3 года': 'between1And3',
  'от 3 до 6 лет': 'between3And6',
  '3-6 лет': 'between3And6',
  'от 6 лет': 'moreThan6',
  'более 6 лет': 'moreThan6',
  'от 6': 'moreThan6',
}

function normalizeExperienceLabel(v: unknown): string {
  return normalizeText(v)
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isAvitoExperienceId(id: unknown): boolean {
  const s = String(id ?? '').trim()
  return s !== '' && AVITO_EXPERIENCE_IDS.has(s)
}

export function resolveJoblyExperienceId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; name?: unknown; value?: unknown }
    const byId = resolveJoblyExperienceId(obj.id)
    if (byId) return byId
    const byName = resolveJoblyExperienceId(obj.name)
    if (byName) return byName
    return resolveJoblyExperienceId(obj.value)
  }

  const s = String(raw).trim()
  if (!s) return ''

  for (const opt of JOBLY_EXPERIENCE_OPTIONS) {
    if (opt.id === s) return opt.id
    if (String(opt.value) === s) return opt.id
  }

  const normalized = normalizeExperienceLabel(s)
  if (JOBLY_NAME_ALIASES[normalized]) {
    return JOBLY_NAME_ALIASES[normalized]
  }

  for (const opt of JOBLY_EXPERIENCE_OPTIONS) {
    const optNorm = normalizeExperienceLabel(opt.name)
    if (optNorm === normalized) return opt.id
    if (normalized.includes(optNorm) || optNorm.includes(normalized)) return opt.id
  }

  return ''
}

export function resolveAvitoExperienceFromJobly(input: {
  sourceIds: string[]
  sourceNames: string[]
  mappingsRaw: unknown
}): string {
  const mappings = unwrapAvitoMappingsPayload(input.mappingsRaw)

  const joblyIds = new Set<string>()
  for (const id of input.sourceIds) {
    const resolved = resolveJoblyExperienceId(id)
    if (resolved) joblyIds.add(resolved)
  }
  for (const name of input.sourceNames) {
    const resolved = resolveJoblyExperienceId(name)
    if (resolved) joblyIds.add(resolved)
  }

  for (const joblyId of joblyIds) {
    const mapped = mappings[joblyId] ?? DEFAULT_JOBLY_TO_AVITO_EXPERIENCE[joblyId]
    if (mapped && isAvitoExperienceId(mapped)) {
      return mapped
    }
  }

  return ''
}

export function findAvitoExperienceOption(avitoId: string): AvitoExperienceOption | null {
  const id = String(avitoId ?? '').trim()
  if (!id) return null
  return AVITO_EXPERIENCE_OPTIONS.find((o) => o.id === id) ?? null
}
