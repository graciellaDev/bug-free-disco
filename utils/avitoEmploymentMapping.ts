import { normalizeText, unwrapAvitoMappingsPayload } from '@/utils/avitoSpecializationMapping'

export type EmploymentRow = {
  id: string
  name: string
  employeeType: string
  employeeTypeName: string
  employmentId: string
  employmentName: string
  siteName?: string
}

export const JOBLY_EMPLOYEE_TYPE_OPTIONS = [
  { id: 'permanent', name: 'Постоянного' },
  { id: 'temporary', name: 'Временного' },
] as const

export const JOBLY_EMPLOYMENT_PERMANENT = [
  { id: 'FULL', name: 'Полная', siteName: 'Полная' },
  { id: 'PART', name: 'Частичная', siteName: 'Частичная' },
  { id: 'FLY_IN_FLY_OUT', name: 'Вахта', siteName: 'Вахта' },
] as const

export const JOBLY_EMPLOYMENT_TEMPORARY = [
  { id: 'PROJECT', name: 'Проект', siteName: 'Временная' },
  { id: 'SIDE_JOB', name: 'Подработка', siteName: 'Подработка' },
] as const

/** Строки основной формы (тип сотрудника + тип занятости) — левая колонка админ-маппинга. */
export const AVITO_EMPLOYMENT_UI_OPTIONS: EmploymentRow[] = buildJoblyEmploymentRows()

/** Кнопки «Занятость» в попапе Avito. */
export const AVITO_POPUP_EMPLOYMENT_OPTIONS = [
  { id: 'FULL', name: 'Постоянная' },
  { id: 'PART', name: 'Частичная' },
  { id: 'PROJECT', name: 'Разовая или временная' },
] as const

/** jobly composite key → id кнопки в попапе Avito */
export const DEFAULT_JOBLY_TO_AVITO_EMPLOYMENT: Record<string, string> = {
  'permanent:FULL': 'FULL',
  'permanent:PART': 'PART',
  'permanent:FLY_IN_FLY_OUT': 'FULL',
  'temporary:PROJECT': 'PROJECT',
  'temporary:SIDE_JOB': 'PART',
}

const LEGACY_COMPOSITE_TO_AVITO_FORM: Record<string, string> = {
  'permanent:FULL': 'FULL',
  'permanent:PART': 'PART',
  'permanent:FLY_IN_FLY_OUT': 'FULL',
  'temporary:PROJECT': 'PROJECT',
  'temporary:SIDE_JOB': 'PART',
}

const EMPLOYMENT_ID_TO_AVITO_FORM: Record<string, string> = {
  FULL: 'FULL',
  PART: 'PART',
  FLY_IN_FLY_OUT: 'FULL',
  PROJECT: 'PROJECT',
  SIDE_JOB: 'PART',
}

/** Нормализует значение из БД (FULL / PART / PROJECT или старый composite) к id попапа Avito. */
export function normalizeAvitoEmploymentMappedId(mapped: string): string {
  const key = String(mapped ?? '').trim()
  if (!key) return ''
  if (LEGACY_COMPOSITE_TO_AVITO_FORM[key]) return LEGACY_COMPOSITE_TO_AVITO_FORM[key]
  if (key === 'FULL' || key === 'PART' || key === 'PROJECT') return key
  const { employmentId } = parseEmploymentCompositeKey(key)
  if (employmentId && EMPLOYMENT_ID_TO_AVITO_FORM[employmentId]) {
    return EMPLOYMENT_ID_TO_AVITO_FORM[employmentId]
  }
  return key
}

const SITE_NAME_ALIASES: Record<string, string> = {
  полная: 'FULL',
  'частичная': 'PART',
  вахта: 'FLY_IN_FLY_OUT',
  временная: 'PROJECT',
  подработка: 'SIDE_JOB',
  проект: 'PROJECT',
}

export function buildEmploymentCompositeKey(employeeType: string, employmentId: string): string {
  const et = String(employeeType ?? '').trim()
  const emp = String(employmentId ?? '').trim()
  if (!et || !emp) return ''
  return `${et}:${emp}`
}

export function parseEmploymentCompositeKey(key: string): { employeeType: string; employmentId: string } {
  const s = String(key ?? '').trim()
  const idx = s.indexOf(':')
  if (idx <= 0) return { employeeType: '', employmentId: s }
  return {
    employeeType: s.slice(0, idx),
    employmentId: s.slice(idx + 1),
  }
}

export function buildJoblyEmploymentRows(): EmploymentRow[] {
  const rows: EmploymentRow[] = []
  for (const et of JOBLY_EMPLOYEE_TYPE_OPTIONS) {
    const employments = et.id === 'permanent' ? JOBLY_EMPLOYMENT_PERMANENT : JOBLY_EMPLOYMENT_TEMPORARY
    for (const emp of employments) {
      rows.push({
        id: buildEmploymentCompositeKey(et.id, emp.id),
        name: `${et.name} — ${emp.name}`,
        employeeType: et.id,
        employeeTypeName: et.name,
        employmentId: emp.id,
        employmentName: emp.name,
        siteName: emp.siteName,
      })
    }
  }
  return rows
}

export function inferJoblyEmployeeTypeFromEmploymentId(employmentId: string): string {
  const id = String(employmentId ?? '').trim()
  if (id === 'PROJECT' || id === 'SIDE_JOB') return 'temporary'
  if (id === 'FULL' || id === 'PART' || id === 'FLY_IN_FLY_OUT') return 'permanent'
  return 'permanent'
}

export function inferJoblyEmployeeTypeFromEmploymentText(text: string): string {
  const t = normalizeText(text)
  if (t.includes('временн') || t.includes('подработ') || t.includes('проект')) return 'temporary'
  return 'permanent'
}

export function resolveJoblyEmploymentId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'object') {
    const obj = raw as { id?: unknown; name?: unknown; siteName?: unknown; value?: unknown }
    const byId = resolveJoblyEmploymentId(obj.id)
    if (byId) return byId
    const bySite = resolveJoblyEmploymentId(obj.siteName)
    if (bySite) return bySite
    return resolveJoblyEmploymentId(obj.name)
  }
  const s = String(raw).trim()
  if (!s) return ''
  const all = [...JOBLY_EMPLOYMENT_PERMANENT, ...JOBLY_EMPLOYMENT_TEMPORARY]
  for (const opt of all) {
    if (opt.id === s) return opt.id
  }
  const norm = normalizeText(s).replace(/ё/g, 'е')
  if (SITE_NAME_ALIASES[norm]) return SITE_NAME_ALIASES[norm]
  for (const opt of all) {
    const optNorm = normalizeText(opt.name)
    const siteNorm = normalizeText(opt.siteName)
    if (norm === optNorm || norm === siteNorm) return opt.id
  }
  return ''
}

export function resolveJoblyEmploymentCompositeFromSources(input: {
  sourceIds: string[]
  sourceNames: string[]
}): string {
  for (const id of input.sourceIds) {
    const empId = resolveJoblyEmploymentId(id)
    if (empId) {
      const et = inferJoblyEmployeeTypeFromEmploymentId(empId)
      return buildEmploymentCompositeKey(et, empId)
    }
  }
  for (const name of input.sourceNames) {
    const empId = resolveJoblyEmploymentId(name)
    if (empId) {
      const et = inferJoblyEmployeeTypeFromEmploymentText(name) || inferJoblyEmployeeTypeFromEmploymentId(empId)
      return buildEmploymentCompositeKey(et, empId)
    }
  }
  return ''
}

export function resolveAvitoEmploymentFromJobly(input: {
  sourceIds: string[]
  sourceNames: string[]
  mappingsRaw: unknown
}): string {
  const joblyKey = resolveJoblyEmploymentCompositeFromSources({
    sourceIds: input.sourceIds,
    sourceNames: input.sourceNames,
  })
  if (!joblyKey) return ''

  const mappings = unwrapAvitoMappingsPayload(input.mappingsRaw)
  const mapped = mappings[joblyKey] ?? DEFAULT_JOBLY_TO_AVITO_EMPLOYMENT[joblyKey]
  return mapped ? String(mapped).trim() : ''
}

export function findEmploymentRowByCompositeKey(key: string, rows: EmploymentRow[] = AVITO_EMPLOYMENT_UI_OPTIONS): EmploymentRow | null {
  const id = String(key ?? '').trim()
  if (!id) return null
  return rows.find((r) => r.id === id) ?? null
}
