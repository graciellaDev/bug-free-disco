/**
 * Сопоставление специализации Jobly (строка / hh_id) → id профессии Avito.
 * Ключи таблицы в админке: professional_roles.hh_id (локальная БД), не id из live HH API.
 */

export type HhRoleCategory = {
  id?: string | number
  name?: string
  roles?: Array<{ id?: string | number; name?: string }>
}

export type AvitoProfessionRow = {
  id?: string | number
  key?: string | number
  profession_id?: string | number
  name?: string
  title?: string
}

export type MappingLookupDebug = {
  mappingFormat: string
  matchedKey: string
  hhIdsTried: string[]
  localHhIds: string[]
  liveHhIds: string[]
  hhDerivedId?: string
  lookupBy: 'id' | 'name' | 'catalog-fallback' | ''
}

export type ResolveAvitoProfessionResult = {
  avitoProfessionId: string
  debug: MappingLookupDebug
}

const HH_SOURCE_ID_KEYS = [
  'hh_id',
  'hh_specialization_id',
  'specialization_id',
  'source_id',
  'from_id',
  'id',
] as const

const HH_SOURCE_NAME_KEYS = [
  'hh_name',
  'hh_specialization_name',
  'specialization_name',
  'source_name',
  'name',
  'title',
] as const

const TARGET_ID_KEYS = [
  'avito_profession_id',
  'profession_id',
  'avito_id',
  'target_id',
  'to_id',
] as const

const ROW_SOURCE_OBJECTS = ['source', 'from', 'hh', 'specialization', 'hh_specialization', 'left', 'left_value'] as const
const ROW_TARGET_OBJECTS = ['target', 'to', 'avito', 'profession', 'avito_profession', 'right', 'right_value'] as const

export function normalizeScalar(v: unknown): string {
  return String(v ?? '').trim()
}

export function normalizeText(v: unknown): string {
  return normalizeScalar(v).toLowerCase()
}

export function normalizeMatchText(v: unknown): string {
  return normalizeText(v)
    .replace(/ё/g, 'е')
    .replace(/[.,;:/|\\()[\]{}"'«»–—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitSpecializationNames(v: unknown): string[] {
  return String(v ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
}

function asScalar(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    return normalizeScalar(o.id ?? o.value ?? o.key ?? o.code ?? o.name ?? o.title ?? '')
  }
  return normalizeScalar(v)
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === 'object' && !Array.isArray(v))
}

function extractTargetId(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>
    return asScalar(
      o.avito_profession_id ??
        o.profession_id ??
        o.avito_id ??
        o.target_id ??
        o.to_id ??
        o.id ??
        o.value,
    )
  }
  return asScalar(value)
}

/** Ответ API / настройки: плоский словарь hh_id → avito_id или обёртка { items }. */
export function unwrapAvitoMappingsPayload(raw: unknown): Record<string, string> {
  if (raw == null) return {}

  if (Array.isArray(raw)) {
    if (raw.length === 0) return {}
    const fromRows = mappingRowsToDictionary(raw)
    if (Object.keys(fromRows).length > 0) return fromRows
    return {}
  }

  if (!isPlainObject(raw)) return {}

  if (isPlainObject(raw.items)) {
    return unwrapAvitoMappingsPayload(raw.items)
  }

  const keys = Object.keys(raw)
  if (keys.length === 0) return {}

  const digitKeyRatio = keys.filter((k) => /^\d+$/.test(k.trim())).length / keys.length
  const hasCommaKey = keys.some((k) => k.includes(','))
  if (digitKeyRatio >= 0.45 || hasCommaKey) {
    const dict: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw)) {
      const target = extractTargetId(v)
      if (target !== '') dict[normalizeScalar(k)] = target
    }
    return dict
  }

  if (rowLooksLikeMapping(raw)) {
    const fromRow = mappingRowsToDictionary([raw])
    if (Object.keys(fromRow).length > 0) return fromRow
  }

  for (const key of ['data', 'rows', 'result', 'mappings', 'list', 'payload']) {
    if (raw[key] != null) {
      const nested = unwrapAvitoMappingsPayload(raw[key])
      if (Object.keys(nested).length > 0) return nested
    }
  }

  // Плоский словарь jobly_id → avito_id (таблицы оформления / занятости / договора в админке).
  const flat = flatMappingDictionaryFromObject(raw)
  if (Object.keys(flat).length > 0) return flat

  return {}
}

const FLAT_MAPPING_SKIP_KEYS = new Set([
  'data',
  'rows',
  'result',
  'mappings',
  'list',
  'payload',
  'items',
  'message',
  'status',
  'error',
  'meta',
])

function flatMappingDictionaryFromObject(raw: Record<string, unknown>): Record<string, string> {
  const dict: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (FLAT_MAPPING_SKIP_KEYS.has(k)) continue
    const source = normalizeScalar(k)
    if (!source) continue
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      const target = extractTargetId(v)
      if (target) dict[source] = target
      continue
    }
    if (v == null) continue
    const target = normalizeScalar(v)
    if (target) dict[source] = target
  }
  return dict
}

function rowLooksLikeMapping(row: unknown): boolean {
  if (!isPlainObject(row) && !Array.isArray(row)) return false
  return (
    collectRowSourceIdsAny(row).length > 0 ||
    collectRowSourceNamesAny(row).length > 0 ||
    extractRowTargetId(row, new Set()) !== ''
  )
}

function flattenScalars(input: unknown, depth = 0, acc: string[] = []): string[] {
  if (depth > 3 || input == null) return acc
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    acc.push(String(input).trim())
    return acc
  }
  if (Array.isArray(input)) {
    input.forEach((item) => flattenScalars(item, depth + 1, acc))
    return acc
  }
  if (isPlainObject(input)) {
    Object.values(input).forEach((item) => flattenScalars(item, depth + 1, acc))
  }
  return acc
}

function collectRowSourceIds(row: Record<string, unknown>): string[] {
  const direct = HH_SOURCE_ID_KEYS.map((k) => asScalar(row[k])).filter(Boolean)
  const nested = ROW_SOURCE_OBJECTS.flatMap((k) => {
    const o = row[k]
    if (!isPlainObject(o)) return []
    return HH_SOURCE_ID_KEYS.map((rk) => asScalar(o[rk])).filter(Boolean)
  })
  return Array.from(new Set([...direct, ...nested]))
}

function collectRowSourceNames(row: Record<string, unknown>): string[] {
  const direct = HH_SOURCE_NAME_KEYS.map((k) => asScalar(row[k])).filter(Boolean)
  const nested = ROW_SOURCE_OBJECTS.flatMap((k) => {
    const o = row[k]
    if (!isPlainObject(o)) return []
    return HH_SOURCE_NAME_KEYS.map((rk) => asScalar(o[rk])).filter(Boolean)
  })
  return Array.from(new Set([...direct, ...nested]))
}

function collectRowSourceIdsAny(row: unknown): string[] {
  if (isPlainObject(row)) return collectRowSourceIds(row)
  if (!Array.isArray(row)) return []
  return Array.from(
    new Set(
      flattenScalars(row)
        .map((t) => asScalar(t))
        .filter((t) => /^\d+$/.test(t)),
    ),
  )
}

function collectRowSourceNamesAny(row: unknown): string[] {
  if (isPlainObject(row)) return collectRowSourceNames(row)
  if (!Array.isArray(row)) return []
  return Array.from(
    new Set(
      flattenScalars(row)
        .map((t) => asScalar(t))
        .filter((t) => t !== '' && !/^\d+$/.test(t)),
    ),
  )
}

function extractRowTargetId(row: unknown, avitoCatalogIds: Set<string>): string {
  if (!isPlainObject(row)) {
    if (!Array.isArray(row)) return ''
    const hit = flattenScalars(row)
      .map((t) => asScalar(t))
      .find((token) => avitoCatalogIds.has(token))
    return hit ?? ''
  }
  const direct = TARGET_ID_KEYS.map((k) => asScalar(row[k])).find(Boolean)
  if (direct) return direct
  for (const key of ROW_TARGET_OBJECTS) {
    const obj = row[key]
    if (!isPlainObject(obj)) continue
    const nested = extractTargetId(obj)
    if (nested) return nested
  }
  return extractTargetId(row)
}

function mappingRowsToDictionary(rows: unknown[]): Record<string, string> {
  const dict: Record<string, string> = {}
  for (const row of rows) {
    if (!row || (typeof row !== 'object' && !Array.isArray(row))) continue
    const sourceIds = collectRowSourceIdsAny(row)
    const target = extractRowTargetId(row, new Set())
    if (!target) continue
    for (const id of sourceIds) {
      dict[id] = target
    }
    if (isPlainObject(row)) {
      for (const name of collectRowSourceNames(row)) {
        dict[normalizeMatchText(name)] = target
      }
    }
  }
  return dict
}

export function normalizeSpecLabel(s: unknown): string {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Поиск роли HH в каталоге (id в каталоге = hh_id для локальной БД). */
export function findHhRoleInCatalog(
  specializations: unknown,
  categories: HhRoleCategory[],
): { role: { id?: string | number; name?: string }; category: HhRoleCategory } | null {
  if (specializations == null || specializations === '' || !categories?.length) {
    return null
  }

  const matchByPredicate = (predicate: (r: { id?: string | number; name?: string }) => boolean) => {
    for (const cat of categories) {
      const roles = cat?.roles && Array.isArray(cat.roles) ? cat.roles : []
      for (const r of roles) {
        if (predicate(r)) return { role: r, category: cat }
      }
    }
    return null
  }

  if (typeof specializations === 'object' && specializations !== null) {
    const o = specializations as Record<string, unknown>
    if (o.id != null && String(o.id).trim() !== '') {
      const idStr = String(o.id).trim()
      const byId = matchByPredicate((r) => r.id != null && String(r.id) === idStr)
      if (byId) return byId
    }
    if (o.name) {
      const target = normalizeSpecLabel(o.name)
      const byName = matchByPredicate((r) => r?.name && normalizeSpecLabel(r.name) === target)
      if (byName) return byName
    }
    return null
  }

  if (typeof specializations !== 'string') return null

  const raw = specializations.trim()
  if (!raw) return null

  if (/^\d+$/.test(raw)) {
    const byId = matchByPredicate((r) => r.id != null && String(r.id) === raw)
    if (byId) return byId
  }

  const parts = splitSpecializationNames(raw)
  const candidates = parts.length > 0 ? [raw, ...parts] : [raw]

  for (const part of candidates) {
    const n = normalizeSpecLabel(part)
    if (!n) continue
    const hit = matchByPredicate((r) => r?.name && normalizeSpecLabel(r.name) === n)
    if (hit) return hit
  }
  for (const part of candidates) {
    const n = normalizeSpecLabel(part)
    if (!n || n.length < 4) continue
    const hit = matchByPredicate((r) => {
      if (!r?.name) return false
      const rn = normalizeSpecLabel(r.name)
      return rn.includes(n) || n.includes(rn)
    })
    if (hit) return hit
  }
  return null
}

export function collectHhIdsFromCatalog(names: string[], categories: HhRoleCategory[]): string[] {
  const ids = new Set<string>()
  const candidates = Array.from(
    new Set(
      names.flatMap((n) => {
        const full = normalizeScalar(n)
        const parts = splitSpecializationNames(full)
        return [full, ...parts].filter(Boolean)
      }),
    ),
  )
  for (const candidate of candidates) {
    const hit = findHhRoleInCatalog(candidate, categories)
    const roleId = hit?.role?.id != null ? normalizeScalar(hit.role.id) : ''
    if (roleId) ids.add(roleId)
  }
  return Array.from(ids)
}

export function collectNameVariants(names: string[]): {
  raw: string[]
  normalized: string[]
  relaxed: string[]
} {
  const raw = Array.from(new Set(names.map((n) => normalizeScalar(n)).filter(Boolean)))
  const normalized = Array.from(
    new Set(
      raw.flatMap((n) => {
        const full = normalizeText(n)
        const parts = splitSpecializationNames(n).map((x) => normalizeText(x))
        return [full, ...parts].filter(Boolean)
      }),
    ),
  )
  const relaxed = Array.from(new Set(normalized.map((n) => normalizeMatchText(n)).filter(Boolean)))
  return { raw, normalized, relaxed }
}

function lookupByIds(
  dict: Record<string, string>,
  ids: string[],
): { target: string; matchedKey: string } | null {
  for (const id of ids) {
    const key = normalizeScalar(id)
    if (!key) continue
    const target = extractTargetId(dict[key])
    if (target !== '') return { target, matchedKey: `id:${key}` }
  }
  return null
}

function lookupByNames(
  dict: Record<string, string>,
  names: { normalized: string[]; relaxed: string[] },
): { target: string; matchedKey: string } | null {
  for (const name of names.normalized) {
    const target = extractTargetId(dict[name] ?? dict[name.toLowerCase()] ?? dict[name.toUpperCase()])
    if (target !== '') return { target, matchedKey: `name:${name}` }
  }
  for (const [k, v] of Object.entries(dict)) {
    const keyNorm = normalizeText(k)
    const keyRelaxed = normalizeMatchText(k)
    if (names.normalized.includes(keyNorm) || names.relaxed.includes(keyRelaxed)) {
      const target = extractTargetId(v)
      if (target !== '') return { target, matchedKey: `text-key:${k}` }
    }
  }
  return null
}

function lookupInMappingDictionary(
  dict: Record<string, string>,
  hhIds: string[],
  names: { normalized: string[]; relaxed: string[] },
): { target: string; matchedKey: string; lookupBy: 'id' | 'name' } | null {
  const byId = lookupByIds(dict, hhIds)
  if (byId) return { ...byId, lookupBy: 'id' }
  const byName = lookupByNames(dict, names)
  if (byName) return { ...byName, lookupBy: 'name' }
  return null
}

function tokenizeRu(text: string): string[] {
  return normalizeMatchText(text)
    .split(' ')
    .filter((t) => t.length > 1)
}

function scoreCatalogNameMatch(specLabel: string, avitoName: string): number {
  const specNorm = normalizeMatchText(specLabel)
  const avitoNorm = normalizeMatchText(avitoName)
  if (!specNorm || !avitoNorm) return 0
  if (specNorm === avitoNorm) return 10000
  if (avitoNorm.includes(specNorm) || specNorm.includes(avitoNorm)) return 5000

  const specTokens = tokenizeRu(specLabel)
  const avitoTokens = tokenizeRu(avitoName)
  if (specTokens.length === 0 || avitoTokens.length === 0) return 0

  const specSet = new Set(specTokens)
  const avitoSet = new Set(avitoTokens)
  let intersection = 0
  for (const t of specSet) {
    if (avitoSet.has(t)) intersection++
  }
  if (intersection === 0) return 0

  let score = (intersection / specSet.size) * 3000
  if (intersection === specSet.size && intersection === avitoSet.size) {
    score += 2000
  }
  return score
}

/** Если в таблице нет строки — подбор профессии Avito по названию из каталога. */
export function resolveAvitoProfessionIdFromCatalogByText(
  names: string[],
  avitoProfessions: AvitoProfessionRow[],
): string {
  const variants = collectNameVariants(names)
  const catalog = (Array.isArray(avitoProfessions) ? avitoProfessions : []).map((p) => ({
    id: asScalar(p?.id ?? p?.key ?? p?.profession_id),
    name: asScalar(p?.name ?? p?.title),
    norm: normalizeMatchText(p?.name ?? p?.title),
  }))

  for (const relaxed of variants.relaxed) {
    if (!relaxed) continue
    const exact = catalog.find((c) => c.norm === relaxed)
    if (exact?.id) return exact.id
  }
  for (const relaxed of variants.relaxed) {
    if (!relaxed || relaxed.length < 4) continue
    const partial = catalog.find((c) => c.norm.includes(relaxed) || relaxed.includes(c.norm))
    if (partial?.id) return partial.id
  }

  let bestId = ''
  let bestScore = 0
  const labels = Array.from(new Set(variants.raw))
  for (const label of labels) {
    for (const row of catalog) {
      const score = scoreCatalogNameMatch(label, row.name)
      if (score > bestScore) {
        bestScore = score
        bestId = row.id
      }
    }
  }
  return bestScore >= 1500 ? bestId : ''
}

export function resolveAvitoProfessionFromSpecialization(input: {
  sourceIds: string[]
  sourceNames: string[]
  mappingsRaw: unknown
  localHhCategories: HhRoleCategory[]
  liveHhCategories: HhRoleCategory[]
  avitoProfessions: AvitoProfessionRow[]
  allowCatalogFallback?: boolean
}): ResolveAvitoProfessionResult {
  const debug: MappingLookupDebug = {
    mappingFormat: '',
    matchedKey: '',
    hhIdsTried: [],
    localHhIds: [],
    liveHhIds: [],
    lookupBy: '',
  }

  const names = collectNameVariants(input.sourceNames)
  const explicitIds = Array.from(new Set(input.sourceIds.map((id) => normalizeScalar(id)).filter(Boolean)))

  debug.localHhIds = collectHhIdsFromCatalog(names.raw, input.localHhCategories)
  debug.liveHhIds = collectHhIdsFromCatalog(names.raw, input.liveHhCategories)

  const hhIds = Array.from(new Set([...explicitIds, ...debug.localHhIds, ...debug.liveHhIds]))
  debug.hhIdsTried = hhIds
  if (hhIds.length > 0) {
    debug.hhDerivedId = hhIds[0]
  }

  const dict = unwrapAvitoMappingsPayload(input.mappingsRaw)
  debug.mappingFormat =
    Object.keys(dict).length > 0
      ? `dictionary(${Object.keys(dict).length})`
      : Array.isArray(input.mappingsRaw)
        ? 'array-empty'
        : isPlainObject(input.mappingsRaw)
          ? 'object-empty'
          : 'empty'

  let avitoProfessionId = ''
  const mappingHit = lookupInMappingDictionary(dict, hhIds, names)
  if (mappingHit) {
    avitoProfessionId = mappingHit.target
    debug.matchedKey = mappingHit.matchedKey
    debug.lookupBy = mappingHit.lookupBy
  }

  if (!avitoProfessionId && input.allowCatalogFallback !== false) {
    const fromCatalog = resolveAvitoProfessionIdFromCatalogByText(names.raw, input.avitoProfessions)
    if (fromCatalog) {
      avitoProfessionId = fromCatalog
      debug.matchedKey = 'catalog-by-name'
      debug.lookupBy = 'catalog-fallback'
    }
  }

  return { avitoProfessionId, debug }
}
