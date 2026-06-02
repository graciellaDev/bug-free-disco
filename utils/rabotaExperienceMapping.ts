import { resolveJoblyExperienceId, JOBLY_EXPERIENCE_OPTIONS } from '@/utils/avitoExperienceMapping'

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

/** id из таблицы Jobly `experiences`: 1 Не имеет значения, 2 От 1 до 3 лет, 3 От 3 до 6 лет, 4 От 6 лет */
const JOBLY_EXPERIENCE_DB_ID_TO_NAME: Record<string, string> = {
  '1': 'Не имеет значения',
  '2': 'От 1 до 3 лет',
  '3': 'От 3 до 6 лет',
  '4': 'От 6 лет',
}

/** UI / HH id опыта → id в таблице Jobly `experiences` */
const JOBLY_EXPERIENCE_UI_ID_TO_DB_ID: Record<string, string> = {
  noExperience: '1',
  between1And3: '2',
  between3And6: '3',
  moreThan6: '4',
}

function mapExperienceLabelToJoblyDbId(label: unknown): string | null {
  const raw = String(label ?? '').trim()
  if (!raw) return null
  if (/^[1-4]$/.test(raw)) return raw

  const joblyUiId = resolveJoblyExperienceId(raw)
  if (joblyUiId && JOBLY_EXPERIENCE_UI_ID_TO_DB_ID[joblyUiId]) {
    return JOBLY_EXPERIENCE_UI_ID_TO_DB_ID[joblyUiId]
  }

  if (/^[0-3]$/.test(raw)) {
    const opt = JOBLY_EXPERIENCE_OPTIONS.find((o) => String(o.value) === raw)
    if (opt && JOBLY_EXPERIENCE_UI_ID_TO_DB_ID[opt.id]) {
      return JOBLY_EXPERIENCE_UI_ID_TO_DB_ID[opt.id]
    }
  }

  const norm = normText(raw)
  for (const [id, name] of Object.entries(JOBLY_EXPERIENCE_DB_ID_TO_NAME)) {
    if (normText(name) === norm) return id
  }

  if (norm.includes('нет опыт') || norm.includes('без опыт') || norm.includes('не имеет')) return '1'
  if (norm.includes('1 до 3') || norm.includes('1-3')) return '2'
  if (norm.includes('3 до 6') || norm.includes('3-6')) return '3'
  if (norm.includes('6 лет') || norm.includes('более 6') || norm.includes('от 6')) return '4'

  return null
}

/** id опыта Jobly (`experiences.id`) из полей вакансии. */
export function resolveJoblyExperienceDbIdFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): number | string | null {
  if (!vacancy || typeof vacancy !== 'object') return null

  const direct = vacancy.experience_id ?? vacancy.experienceId
  if (direct != null && String(direct).trim() !== '') {
    return direct as number | string
  }

  const nested =
    (vacancy.experiences as { id?: unknown } | null | undefined)?.id ??
    (typeof vacancy.experience === 'object' && vacancy.experience != null
      ? ((vacancy.experience as { experience_id?: unknown; id?: unknown }).experience_id ??
        (vacancy.experience as { id?: unknown }).id)
      : null)
  if (nested != null && String(nested).trim() !== '') {
    const nestedStr = String(nested).trim()
    if (/^[1-4]$/.test(nestedStr)) return nestedStr
    const fromUi = JOBLY_EXPERIENCE_UI_ID_TO_DB_ID[nestedStr]
    if (fromUi) return fromUi
  }

  const raw = vacancy.experience
  if (raw == null || raw === '') return null

  if (typeof raw === 'object') {
    const obj = raw as { experience_id?: unknown; id?: unknown; name?: unknown; value?: unknown }
    if (obj.experience_id != null && String(obj.experience_id).trim() !== '') {
      return obj.experience_id as number | string
    }
    const fromId = mapExperienceLabelToJoblyDbId(obj.id)
    if (fromId) return fromId
    const fromValue = mapExperienceLabelToJoblyDbId(obj.value)
    if (fromValue) return fromValue
    const fromName = mapExperienceLabelToJoblyDbId(obj.name)
    if (fromName) return fromName
    return null
  }

  return mapExperienceLabelToJoblyDbId(raw)
}

/** Пункт справочника rabota.ru из ответа GET /rabota/dictionaries/experiences/by-experience/{id}. */
export function mapRabotaExperienceByExperienceItem(
  item: Record<string, unknown> | null | undefined,
): RabotaExperienceFormValue | null {
  if (!item || typeof item !== 'object') return null
  const id =
    item.rabota_experience_id ??
    item.experience_level_id ??
    item.experience_id ??
    item.id
  if (id == null || String(id).trim() === '') return null
  const name = String(item.name ?? item.title ?? '').trim()
  const value = item.value ?? id
  return {
    id,
    name: name || String(id),
    value,
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
