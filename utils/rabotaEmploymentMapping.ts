import { resolveJoblyEmploymentId } from '@/utils/avitoEmploymentMapping'

export type RabotaEmploymentFormValue = {
  id: number | string
  name: string
}

/** id из таблицы Jobly `employments`: 1 Полная, 2 Частичная, 3 Временная, 4 Стажировка */
const JOBLY_EMPLOYMENT_DB_ID_TO_NAME: Record<string, string> = {
  '1': 'Полная',
  '2': 'Частичная',
  '3': 'Временная',
  '4': 'Стажировка',
}

/** HH / UI id типа занятости → id в таблице Jobly `employments` */
const HH_EMPLOYMENT_ID_TO_JOBLY_DB_ID: Record<string, string> = {
  FULL: '1',
  FLY_IN_FLY_OUT: '1',
  PART: '2',
  SIDE_JOB: '2',
  PROJECT: '3',
}

function normText(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapEmploymentLabelToJoblyDbId(label: unknown): string | null {
  const raw = String(label ?? '').trim()
  if (!raw) return null
  if (/^[1-4]$/.test(raw)) return raw

  const norm = normText(raw)
  for (const [id, name] of Object.entries(JOBLY_EMPLOYMENT_DB_ID_TO_NAME)) {
    if (normText(name) === norm) return id
  }

  const hhId = resolveJoblyEmploymentId(raw)
  if (hhId && HH_EMPLOYMENT_ID_TO_JOBLY_DB_ID[hhId]) {
    return HH_EMPLOYMENT_ID_TO_JOBLY_DB_ID[hhId]
  }

  if (norm.includes('вахт') || norm.includes('полн')) return '1'
  if (norm.includes('частич') || norm.includes('подработ')) return '2'
  if (norm.includes('времен') || norm.includes('проект') || norm.includes('разов')) return '3'
  if (norm.includes('стаж')) return '4'

  return null
}

/** id типа занятости Jobly (`employments.id`) из полей вакансии. */
export function resolveJoblyEmploymentDbIdFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): number | string | null {
  if (!vacancy || typeof vacancy !== 'object') return null

  const direct = vacancy.employment_id ?? vacancy.employmentId
  if (direct != null && String(direct).trim() !== '') {
    return direct as number | string
  }

  const nested =
    (vacancy.employments as { id?: unknown } | null | undefined)?.id ??
    (typeof vacancy.employment === 'object' && vacancy.employment != null
      ? ((vacancy.employment as { employment_id?: unknown; id?: unknown }).employment_id ??
        (vacancy.employment as { id?: unknown }).id)
      : null)
  if (nested != null && String(nested).trim() !== '') {
    const nestedStr = String(nested).trim()
    if (/^[1-4]$/.test(nestedStr)) return nestedStr
    const fromHh = HH_EMPLOYMENT_ID_TO_JOBLY_DB_ID[nestedStr]
    if (fromHh) return fromHh
  }

  const raw = vacancy.employment
  if (raw == null || raw === '') return null

  if (typeof raw === 'object') {
    const obj = raw as { employment_id?: unknown; id?: unknown; siteName?: unknown; name?: unknown }
    if (obj.employment_id != null && String(obj.employment_id).trim() !== '') {
      return obj.employment_id as number | string
    }
    const fromId = mapEmploymentLabelToJoblyDbId(obj.id)
    if (fromId) return fromId
    const fromSite = mapEmploymentLabelToJoblyDbId(obj.siteName)
    if (fromSite) return fromSite
    const fromName = mapEmploymentLabelToJoblyDbId(obj.name)
    if (fromName) return fromName
    return null
  }

  return mapEmploymentLabelToJoblyDbId(raw)
}

/** Пункт справочника rabota.ru из ответа GET /rabota/dictionaries/employment/by-employment/{id}. */
export function mapRabotaEmploymentByEmploymentItem(
  item: Record<string, unknown> | null | undefined,
): RabotaEmploymentFormValue | null {
  if (!item || typeof item !== 'object') return null
  const id =
    item.rabota_employment_id ??
    item.employment_type_id ??
    item.employment_id ??
    item.id
  if (id == null || String(id).trim() === '') return null
  const name = String(item.name ?? item.title ?? '').trim()
  return { id, name: name || String(id) }
}
