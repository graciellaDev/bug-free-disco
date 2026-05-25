/**
 * Сфера деятельности компании (business_area) — int id из словаря Avito Job API.
 * Устаревшие id (deprecated: true) API не принимает при публикации.
 */

export type AvitoBusinessAreaCatalogRow = {
  id?: string | number
  name?: string
  title?: string
  deprecated?: boolean
}

/** Старые id → актуальные (словарь business_area v2, 2024+). */
export const AVITO_DEPRECATED_BUSINESS_AREA_TO_ACTIVE: Record<string, string> = {
  '10106': '3278320',
  '10120': '3278322',
  '10132': '3278323',
  '10123': '3278324',
  '16845': '3278326',
  '10124': '3278328',
  '10125': '3278329',
  '10126': '3278331',
  '2804249': '3278332',
  '10127': '3278333',
  '10107': '3278334',
  '10111': '3278335',
  '10128': '3278336',
  '10108': '3278337',
  '10133': '3278338',
  '10109': '3278987',
  '10112': '3278354',
  '2804093': '3278358',
  '10110': '3278332',
  '10113': '3278362',
  '10129': '3278988',
  '10114': '3278363',
  '10130': '3278989',
}

const ACTIVE_SET = new Set(Object.values(AVITO_DEPRECATED_BUSINESS_AREA_TO_ACTIVE))

/** Deprecated в API Avito, для которых нет однозначной замены — поле не отправляем. */
const OBSOLETE_BUSINESS_AREA_IDS = new Set(['10131', '10115', '10121', '10122'])

export function isAvitoBusinessAreaCatalogRowDeprecated(row: AvitoBusinessAreaCatalogRow | null | undefined): boolean {
  if (!row || typeof row !== 'object') return false
  if (row.deprecated === true) return true
  const id = String(row.id ?? '').trim()
  if (id === '') return false
  return AVITO_DEPRECATED_BUSINESS_AREA_TO_ACTIVE[id] != null || OBSOLETE_BUSINESS_AREA_IDS.has(id)
}

export function filterActiveAvitoBusinessAreaCatalog(
  rows: AvitoBusinessAreaCatalogRow[] | null | undefined,
): AvitoBusinessAreaCatalogRow[] {
  if (!Array.isArray(rows)) return []
  return rows.filter((row) => !isAvitoBusinessAreaCatalogRowDeprecated(row))
}

/**
 * ID для поля business_area в POST /job/v1/vacancies.
 * Возвращает null, если значение устарело и не удалось сопоставить.
 */
export function resolveBusinessAreaIdForAvitoApi(
  rawId: unknown,
  catalog?: AvitoBusinessAreaCatalogRow[] | null,
): number | null {
  const id = String(rawId ?? '').trim()
  if (!id) return null

  const fromCatalog = Array.isArray(catalog)
    ? catalog.find((row) => String(row?.id ?? '').trim() === id)
    : null

  if (fromCatalog && !isAvitoBusinessAreaCatalogRowDeprecated(fromCatalog)) {
    const n = Number(id)
    return Number.isFinite(n) ? Math.floor(n) : null
  }

  if (OBSOLETE_BUSINESS_AREA_IDS.has(id)) {
    return null
  }

  const remapped = AVITO_DEPRECATED_BUSINESS_AREA_TO_ACTIVE[id]
  if (remapped) {
    const n = Number(remapped)
    return Number.isFinite(n) ? Math.floor(n) : null
  }

  if (ACTIVE_SET.has(id)) {
    const n = Number(id)
    return Number.isFinite(n) ? Math.floor(n) : null
  }

  if (fromCatalog && isAvitoBusinessAreaCatalogRowDeprecated(fromCatalog)) {
    return null
  }

  const n = Number(id)
  if (!Number.isFinite(n)) return null
  return Math.floor(n)
}
