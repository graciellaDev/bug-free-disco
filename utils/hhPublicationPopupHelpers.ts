/**
 * Поиск роли и категории в каталоге professional_roles (как в AddPublication.vue).
 */

import { HH_OFORMLENIE_MULTISELECT_OPTIONS } from '@/utils/hhVacancyPayloadConstants';

/** Значения id в `civil_law_contracts` из GET /dictionaries (hh.ru), не путать с labor/internship/gph в форме. */
export const HH_CIVIL_LAW_CONTRACT_API_IDS = new Set([
  'SELF_EMPLOYED',
  'INDIVIDUAL_ENTREPRENEUR',
  'INDIVIDUAL_PERSON',
]);

function matchOformlenieMultiSelectOption(raw: string): (typeof HH_OFORMLENIE_MULTISELECT_OPTIONS)[number] | null {
  const t = String(raw).trim().toLowerCase();
  for (const opt of HH_OFORMLENIE_MULTISELECT_OPTIONS) {
    if (String(opt.value).toLowerCase() === t || String(opt.id).toLowerCase() === t) {
      return opt;
    }
  }
  return null;
}

/**
 * После GET /vacancies/{id} hh.ru держит «трудовой договор» в accept_labor_contract, стажировку в internship,
 * а ГПХ — в civil_law_contracts с id из справочника. Форма ожидает один MultiSelect с labor | internship | gph.
 */
export function normalizeOformlenieFieldsForPopupDraft(draft: Record<string, unknown>): void {
  const seen = new Set<string>();
  const items: Array<{ id: string; name?: string }> = [];

  const pushToken = (token: string) => {
    if (seen.has(token)) return;
    seen.add(token);
    const opt = HH_OFORMLENIE_MULTISELECT_OPTIONS.find(o => o.value === token);
    items.push(opt ? { id: opt.value, name: opt.name } : { id: token });
  };

  if (draft.accept_labor_contract === true) pushToken('labor');
  if (draft.internship === true) pushToken('internship');

  const raw = draft.civil_law_contracts;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item == null || typeof item !== 'object') continue;
      const idRaw = (item as { id?: unknown }).id;
      if (idRaw == null || idRaw === '') continue;
      const idStr = String(idRaw).trim();
      const matched = matchOformlenieMultiSelectOption(idStr);
      if (matched) {
        pushToken(String(matched.value));
        continue;
      }
      if (HH_CIVIL_LAW_CONTRACT_API_IDS.has(idStr.toUpperCase())) {
        pushToken('gph');
      }
    }
  }

  draft.civil_law_contracts = items;
}

export function normalizeSpecLabel(s: unknown): string {
  return String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function findHhRoleInFullCatalog(
  specializations: unknown,
  categories: Array<{ roles?: Array<Record<string, unknown>> }>
): { role: Record<string, unknown>; category: Record<string, unknown> } | null {
  if (specializations == null || specializations === '' || !categories?.length) {
    return null;
  }

  const matchByPredicate = (predicate: (r: Record<string, unknown>) => boolean) => {
    for (const cat of categories) {
      const roles = cat?.roles && Array.isArray(cat.roles) ? cat.roles : [];
      for (const r of roles) {
        if (predicate(r as Record<string, unknown>)) {
          return { role: r as Record<string, unknown>, category: cat as Record<string, unknown> };
        }
      }
    }
    return null;
  };

  if (typeof specializations === 'object' && specializations !== null) {
    const o = specializations as Record<string, unknown>;
    if (o.id != null && String(o.id).trim() !== '') {
      const idStr = String(o.id).trim();
      const byId = matchByPredicate((r) => r.id != null && String(r.id) === idStr);
      if (byId) return byId;
    }
    if (o.name) {
      const target = normalizeSpecLabel(o.name);
      const byName = matchByPredicate((r) => r?.name && normalizeSpecLabel(r.name) === target);
      if (byName) return byName;
    }
    return null;
  }

  if (typeof specializations !== 'string') return null;

  const raw = specializations.trim();
  if (!raw) return null;

  if (/^\d+$/.test(raw)) {
    const byId = matchByPredicate((r) => r.id != null && String(r.id) === raw);
    if (byId) return byId;
  }

  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  const candidates = parts.length > 0 ? parts : [raw];

  for (const part of candidates) {
    const n = normalizeSpecLabel(part);
    if (!n) continue;
    const hit = matchByPredicate((r) => r?.name && normalizeSpecLabel(r.name) === n);
    if (hit) return hit;
  }
  for (const part of candidates) {
    const n = normalizeSpecLabel(part);
    if (!n || n.length < 4) continue;
    const hit = matchByPredicate((r) => {
      if (!r?.name) return false;
      const rn = normalizeSpecLabel(r.name);
      return rn.includes(n) || n.includes(rn);
    });
    if (hit) return hit;
  }
  return null;
}

export function dedupeAreasByName(arr: Array<{ id: string; name: string }>): Array<{ id: string; name: string }> {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr.filter((c) => {
    const name = c?.name != null ? String(c.name).trim() : '';
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

export function addressLineFromHhPayload(address: unknown): string {
  if (!address || typeof address !== 'object') return '';
  const o = address as Record<string, unknown>;
  for (const k of ['raw', 'building', 'street', 'text', 'value']) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}
