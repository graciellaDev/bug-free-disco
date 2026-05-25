import { resolveJoblyExperienceId } from '@/utils/avitoExperienceMapping'

export type RabotaExperienceLevel = {
  id?: number | string
  experience_id?: number | string
  name?: string
  title?: string
  value?: number | string
}

export type RabotaExperienceFormValue = {
  id: number | string
  name: string
  value: number | string
}

function normText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

function findByNameLoose(arr: RabotaExperienceLevel[], value: unknown): RabotaExperienceLevel | null {
  if (!Array.isArray(arr) || value == null || value === '') return null
  const target = normText(value)
  if (!target) return null
  return (
    arr.find((x) => normText(x?.name) === target || normText(x?.title) === target) ||
    arr.find((x) => normText(x?.name).includes(target) || normText(x?.title).includes(target)) ||
    null
  )
}

function formatRabotaExperienceMatch(match: RabotaExperienceLevel): RabotaExperienceFormValue {
  const id = match.id ?? match.experience_id
  const name = match.name ?? match.title ?? ''
  return {
    id,
    name,
    value: match.value ?? id,
  }
}

/** Поисковые подстроки для сопоставления опыта Jobly со справочником rabota.ru */
export function mapJoblyExperienceIdToRabotaSearchTerms(joblyId: string): string[] {
  switch (joblyId) {
    case 'noExperience':
      return ['нет опыта', 'без опыта', 'не имеет значения', 'не требуется']
    case 'between1And3':
      return ['от 1 до 3', '1-3', '1 до 3', 'от 1 года']
    case 'between3And6':
      return ['от 3 до 6', '3-6', '3 до 6', 'от 3 лет']
    case 'moreThan6':
      return ['от 6', '6 лет', 'более 6', 'от 5 лет']
    default:
      return []
  }
}

/**
 * Сопоставляет сырое значение опыта (Jobly, rabota.ru, строка) с пунктом справочника rabota.ru.
 */
export function resolveRabotaExperienceOption(
  levels: RabotaExperienceLevel[],
  raw: unknown,
): RabotaExperienceFormValue | null {
  if (!Array.isArray(levels) || levels.length === 0 || raw == null || raw === '') {
    return null
  }

  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; experience_id?: unknown; name?: unknown; title?: unknown }
    const directId = obj.id ?? obj.experience_id
    if (directId != null && String(directId).trim() !== '') {
      const byId = levels.find(
        (x) => String(x.id ?? x.experience_id) === String(directId),
      )
      if (byId) return formatRabotaExperienceMatch(byId)
    }
  } else if (!Number.isNaN(Number(raw)) && String(raw).trim() !== '') {
    const byId = levels.find((x) => String(x.id ?? x.experience_id) === String(raw))
    if (byId) return formatRabotaExperienceMatch(byId)
  }

  const joblyId = resolveJoblyExperienceId(raw)
  if (joblyId) {
    for (const term of mapJoblyExperienceIdToRabotaSearchTerms(joblyId)) {
      const match = findByNameLoose(levels, term)
      if (match) return formatRabotaExperienceMatch(match)
    }
  }

  const label =
    typeof raw === 'string'
      ? raw
      : String((raw as { name?: unknown; title?: unknown })?.name ?? (raw as { title?: unknown })?.title ?? '').trim()
  if (label) {
    const match = findByNameLoose(levels, label)
    if (match) return formatRabotaExperienceMatch(match)
  }

  return null
}

/** Поля опыта из ответа API / снимка публикации rabota.ru */
export function extractRabotaPublicationExperienceRaw(publication: Record<string, unknown> | null | undefined): unknown {
  if (!publication || typeof publication !== 'object') return null
  const params =
    typeof publication.params === 'object' && publication.params != null
      ? (publication.params as Record<string, unknown>)
      : null
  return (
    (publication.experience as { id?: unknown })?.id ??
    publication.experience_id ??
    publication.experience ??
    (publication.experience_level as { id?: unknown })?.id ??
    publication.experience_level ??
    params?.experience_id ??
    params?.experience
  )
}
