/**
 * Пользовательские поля: схема общая (localStorage), значения — по id кандидата.
 * До появления API аккаунта привязка «ко всем кандидатам» = один origin браузера.
 */

import {
  fieldDefinitionFromFull,
  isValidCandidateLinkValue,
  mergeDefinitionWithValues,
  normalizeCustomFieldName,
  valuesRowFromFull,
  type LocalCandidateCustomField,
  type LocalCustomFieldDefinition,
  type LocalCustomFieldValuesRow,
} from '@/types/candidateLocalCustomFields';

const DEFINITIONS_KEY = 'jobly:account-local-custom-field-definitions:v1';
const VALUES_KEY_PREFIX = 'jobly:candidate-local-custom-field-values:v1:';
const LEGACY_KEY_PREFIX = 'jobly:candidate-local-custom-fields:';

function valuesStorageKey(candidateId: number): string {
  return `${VALUES_KEY_PREFIX}${candidateId}`;
}

/** Не хранить и не подмешивать невалидный текст поля «ссылка». */
function sanitizeStoredValuesRow(
  def: LocalCustomFieldDefinition,
  row: Partial<LocalCustomFieldValuesRow> | undefined
): Partial<LocalCustomFieldValuesRow> | undefined {
  if (!row || def.fieldKind !== 'link') return row;
  const t = (row.textValue ?? '').trim();
  if (t && !isValidCandidateLinkValue(row.textValue ?? '')) {
    return { ...row, textValue: '' };
  }
  return row;
}

function valuesRowFromFieldForStorage(
  f: LocalCandidateCustomField
): LocalCustomFieldValuesRow {
  const row = valuesRowFromFull(f);
  if (f.fieldKind !== 'link') return row;
  const t = row.textValue.trim();
  if (t && !isValidCandidateLinkValue(row.textValue)) {
    return { ...row, textValue: '' };
  }
  return row;
}

function legacyKey(candidateId: number): string {
  return `${LEGACY_KEY_PREFIX}${candidateId}`;
}

function readLegacyRaw(candidateId: number): string | null {
  const k = legacyKey(candidateId);
  if (typeof sessionStorage !== 'undefined') {
    const s = sessionStorage.getItem(k);
    if (s) return s;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(k);
  }
  return null;
}

function removeLegacyRaw(candidateId: number): void {
  const k = legacyKey(candidateId);
  try {
    sessionStorage?.removeItem(k);
  } catch {
    /* */
  }
  try {
    localStorage?.removeItem(k);
  } catch {
    /* */
  }
}

export function loadDefinitions(): LocalCustomFieldDefinition[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DEFINITIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalCustomFieldDefinition[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(d => ({
      ...d,
      name: normalizeCustomFieldName(d.name ?? ''),
    }));
  } catch {
    return [];
  }
}

export function saveDefinitions(defs: LocalCustomFieldDefinition[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DEFINITIONS_KEY, JSON.stringify(defs));
  } catch {
    /* quota */
  }
}

export function loadValuesForCandidate(
  candidateId: number
): Record<string, LocalCustomFieldValuesRow> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(valuesStorageKey(candidateId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LocalCustomFieldValuesRow>;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

export function saveValuesForCandidate(
  candidateId: number,
  map: Record<string, LocalCustomFieldValuesRow>
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(valuesStorageKey(candidateId), JSON.stringify(map));
  } catch {
    /* quota */
  }
}

/** Миграция со старого ключа (схема+значения только у одного кандидата). */
export function migrateLegacyForCandidate(candidateId: number): void {
  const raw = readLegacyRaw(candidateId);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as LocalCandidateCustomField[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    let defs = loadDefinitions();
    const seen = new Set(defs.map(d => d.localId));
    const extra: LocalCustomFieldDefinition[] = [];
    for (const row of parsed) {
      const d = fieldDefinitionFromFull(row);
      if (!seen.has(d.localId)) {
        seen.add(d.localId);
        extra.push(d);
      }
    }
    if (defs.length === 0) {
      defs = parsed.map(fieldDefinitionFromFull);
    } else if (extra.length > 0) {
      defs = [...defs, ...extra];
    }
    saveDefinitions(defs);

    const vm = loadValuesForCandidate(candidateId);
    for (const row of parsed) {
      vm[row.localId] = valuesRowFromFull(row);
    }
    saveValuesForCandidate(candidateId, vm);

    removeLegacyRaw(candidateId);
  } catch {
    /* */
  }
}

export function buildMergedFieldsForCandidate(
  candidateId: number
): LocalCandidateCustomField[] {
  migrateLegacyForCandidate(candidateId);
  const defs = loadDefinitions();
  const map = loadValuesForCandidate(candidateId);
  return defs.map(d =>
    mergeDefinitionWithValues(
      d,
      sanitizeStoredValuesRow(d, map[d.localId])
    )
  );
}

export function persistMergedCustomFields(
  candidateId: number,
  fields: LocalCandidateCustomField[]
): void {
  if (typeof localStorage === 'undefined') return;
  try {
    saveDefinitions(fields.map(fieldDefinitionFromFull));
    const map: Record<string, LocalCustomFieldValuesRow> = {};
    for (const f of fields) {
      map[f.localId] = valuesRowFromFieldForStorage(f);
    }
    saveValuesForCandidate(candidateId, map);
  } catch {
    /* quota */
  }
}

/** После удаления поля из схемы — убрать значения во всех кандидатах. */
export function pruneCustomFieldValuesForLocalId(localId: string): void {
  if (typeof localStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(VALUES_KEY_PREFIX)) keys.push(k);
  }
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const o = JSON.parse(raw) as Record<string, LocalCustomFieldValuesRow>;
      if (!(localId in o)) continue;
      delete o[localId];
      localStorage.setItem(k, JSON.stringify(o));
    } catch {
      /* */
    }
  }
}
