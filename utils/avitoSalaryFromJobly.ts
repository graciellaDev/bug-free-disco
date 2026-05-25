export type JoblySalaryRange = {
  from: number | null
  to: number | null
  currency?: unknown
  /** true — до вычета налогов; false — на руки */
  gross?: boolean
}

function parseJoblySalaryGrossLabel(raw: unknown): boolean | undefined {
  if (raw == null) return undefined
  const s = (typeof raw === 'object' && raw != null
    ? String((raw as { id?: unknown; name?: unknown }).id ?? (raw as { name?: unknown }).name ?? '')
    : String(raw)
  ).trim().toLowerCase()
  if (!s) return undefined

  if (
    s === 'full-cash'
    || s.includes('до вычета')
    || s === 'gross'
    || s === 'true'
    || s === '1'
  ) {
    return true
  }
  if (
    s === 'past-cash'
    || s.includes('на руки')
    || s.includes('после вычета')
    || s === 'net'
    || s === 'false'
    || s === '0'
  ) {
    return false
  }

  return undefined
}

/** true — «До вычета налогов», false — «На руки». */
export function resolveJoblySalaryGrossFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): boolean | undefined {
  if (!vacancy || typeof vacancy !== 'object') return undefined

  const fromSalaryType = parseJoblySalaryGrossLabel(vacancy.salary_type ?? vacancy.salaryType)
  if (typeof fromSalaryType === 'boolean') return fromSalaryType

  if (typeof vacancy.salary_gross === 'boolean') return vacancy.salary_gross

  const sr = vacancy.salary_range
  if (sr && typeof sr === 'object' && !Array.isArray(sr)) {
    const obj = sr as Record<string, unknown>
    if (typeof obj.gross === 'boolean') return obj.gross
  }

  return undefined
}

/** Поля вакансии Jobly для gross без дефолта формы публикации (salary_range.gross). */
export function pickJoblySalaryGrossFields(
  vacancy: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!vacancy || typeof vacancy !== 'object') return null
  return {
    salary_type: vacancy.salary_type,
    salaryType: vacancy.salaryType,
    salary_gross: vacancy.salary_gross,
  }
}

export function resolveJoblySalaryGrossWithPriority(input: {
  injected?: Record<string, unknown> | null
  glob?: Record<string, unknown> | null
  preferInjectedOnly?: boolean
}): boolean | undefined {
  const sources = input.preferInjectedOnly
    ? [input.injected]
    : [input.injected, input.glob]
  for (const vac of sources) {
    const gross = resolveJoblySalaryGrossFromVacancy(pickJoblySalaryGrossFields(vac))
    if (typeof gross === 'boolean') return gross
  }
  return undefined
}

export { mapJoblySalaryGrossToAvitoTaxes } from '@/utils/avitoSalaryTaxMapping'

export function parseJoblySalaryAmount(raw: unknown): number | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const n = Number(s.replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

/** Извлекает «от/до» из объекта вакансии Jobly (поля salary_from/salary_to или salary_range). */
export function resolveJoblySalaryRangeFromVacancy(
  vacancy: Record<string, unknown> | null | undefined,
): JoblySalaryRange | null {
  if (!vacancy || typeof vacancy !== 'object') return null

  const sr = vacancy.salary_range
  if (sr && typeof sr === 'object' && !Array.isArray(sr)) {
    const obj = sr as Record<string, unknown>
    const from = parseJoblySalaryAmount(obj.from ?? obj.min ?? obj.salary_from)
    const to = parseJoblySalaryAmount(obj.to ?? obj.max ?? obj.salary_to)
    if (from != null || to != null) {
      return {
        from,
        to,
        currency: obj.currency,
        gross: typeof obj.gross === 'boolean' ? obj.gross : undefined,
      }
    }
  }

  const from = parseJoblySalaryAmount(vacancy.salary_from ?? vacancy.salaryFrom)
  const to = parseJoblySalaryAmount(vacancy.salary_to ?? vacancy.salaryTo)
  if (from == null && to == null) return null

  return {
    from,
    to,
    currency: vacancy.currency,
    gross: resolveJoblySalaryGrossFromVacancy(vacancy),
  }
}

export function resolveJoblySalaryRangeFromSources(
  sources: Array<Record<string, unknown> | null | undefined>,
): JoblySalaryRange | null {
  for (const source of sources) {
    const hit = resolveJoblySalaryRangeFromVacancy(source)
    if (hit && (hit.from != null || hit.to != null)) return hit
  }
  return null
}
