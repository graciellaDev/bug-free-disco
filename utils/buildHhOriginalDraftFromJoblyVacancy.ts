/**
 * Черновик полей hh.ru для HhOriginalVacancyPopup из вакансии Jobly
 * с учётом флагов «подключено» (GET /vacancies/hh-export-map, как admin/job-sites/vacancy-export).
 */

import {
  HH_WORK_FORMAT,
  HH_WORK_SCHEDULE_BY_DAYS,
  HH_WORKING_HOURS,
} from '@/src/constants';
import { HH_OFORMLENIE_MULTISELECT_OPTIONS } from '@/utils/hhVacancyPayloadConstants';
import { applyJoblyVacancyToHhPublicationFormData } from '@/utils/mapJoblyVacancyToHhPublicationForm';
import { findHhRoleInFullCatalog, normalizeOformlenieFieldsForPopupDraft } from '@/utils/hhPublicationPopupHelpers';

export type HhVacancyExportMapRow = {
  row_key: string;
  connected?: boolean;
  connected_default?: boolean;
  label?: string;
  jobly?: string;
  hh?: string;
  hh_note?: string;
};

/** Опции справочников для маппинга drivers / languages (строки из getVacancyFields / hh/languages). */
export type HhDraftBuildOptions = {
  driverDbIdToName?: Map<number, string>;
  languageList?: Array<{ id: string | number; name: string; value?: string | number; is_popular?: boolean }>;
  languageLevelList?: Array<{ id: string | number; name: string; value?: string | number }>;
};

type VacancyLike = Record<string, unknown>;
type FormStub = Record<string, unknown>;

type LangLevelOpt = { id: string | number; name: string; value?: string | number };

function driverDbNameToHhLetter(name: string): string | null {
  if (!name || typeof name !== 'string') return null;
  const s = name.trim().toUpperCase();
  if (/^[A-E]$/.test(s)) return s;
  const m = s.match(/\b([A-E])\b/);
  return m ? m[1]! : null;
}

function resolveLangOrLevelMeta(v: unknown, list: LangLevelOpt[]): { id: string; name: string } | null {
  if (v == null || v === '') return null;
  if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
    const o = v as { id?: unknown; name?: unknown; value?: unknown };
    const oid = o.id ?? o.value;
    if (oid != null && oid !== '') {
      const hit = list.find(
        x => String(x.id) === String(oid) || (x.value != null && String(x.value) === String(oid)),
      );
      if (hit) return { id: String(hit.id ?? hit.value ?? ''), name: hit.name };
    }
    if (typeof o.name === 'string' && o.name.trim()) {
      const nm = o.name.trim();
      const byName = list.find(x => x.name === nm);
      if (byName) return { id: String(byName.id ?? byName.value ?? ''), name: byName.name };
      return { id: nm, name: nm };
    }
    return null;
  }
  const key = String(v).trim();
  if (!key) return null;
  const found = list.find(
    (x: LangLevelOpt) =>
      String(x.id) === key ||
      (x.value != null && String(x.value) === key) ||
      x.name === key,
  );
  return found
    ? { id: String(found.id ?? found.value ?? ''), name: found.name }
    : { id: key, name: key };
}

/** languages из колонки вакансии Jobly [{ name, level }] → полезная нагрузка полей HH. */
function mapJoblyLanguagesArrayToHh(
  raw: unknown,
  languageList: LangLevelOpt[],
  levelList: LangLevelOpt[],
): unknown[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: unknown[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as { name?: unknown; level?: unknown };
    const langLm = resolveLangOrLevelMeta(o.name, languageList);
    if (!langLm) continue;
    const entry: Record<string, unknown> = { id: langLm.id, name: langLm.name };
    if (o.level != null && o.level !== '') {
      const levLm = resolveLangOrLevelMeta(o.level, levelList);
      if (levLm) entry.level = { id: levLm.id, name: levLm.name };
    }
    out.push(entry);
  }
  return out;
}

function pickNonEmptyString(v: VacancyLike, keys: string[]): string {
  for (const k of keys) {
    const x = v[k];
    if (x != null && String(x).trim() !== '') {
      return String(x).trim();
    }
  }
  return '';
}

/**
 * Поле для сопоставления с каталогом hh.ru professional_roles (полное дерево на бекенде).
 * Приоритет: specializations → professional_role → role (если приходят с API/формы).
 */
function joblySpecializationSourceForHh(v: VacancyLike): unknown {
  const s = v.specializations;
  if (s != null && s !== '') return s;
  const pr = (v as { professional_role?: unknown }).professional_role;
  if (pr != null && pr !== '') return pr;
  const role = (v as { role?: unknown }).role;
  if (role != null && role !== '') return role;
  return null;
}

/** Формат как в HhOriginalVacancyPopup: VacancyContacts для PUT hh. */
function buildHhContactsPayloadFromStrings(
  name: string,
  phone: string,
  email: string
): Record<string, unknown> | null {
  const n = name.trim();
  const p = phone.trim();
  const e = email.trim();
  if (!n && !p && !e) return null;
  const out: Record<string, unknown> = {};
  if (n) out.name = n;
  if (e) out.email = e;
  if (p) out.phones = [{ formatted: p }];
  return out;
}

/** place InfoTab → work_format HH (как AddPublication.vue). */
function mapJoblyPlaceToHhWorkFormat(placeVal: unknown): Array<Record<string, unknown>> {
  const idByJobly: Record<string, string> = {
    '1': 'ON_SITE',
    '2': 'REMOTE',
    '3': 'HYBRID',
    '4': 'FIELD_WORK',
  };
  const raw = Array.isArray(placeVal)
    ? placeVal
    : placeVal != null && placeVal !== ''
      ? [placeVal]
      : [];
  const out: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  for (const p of raw) {
    const key = String(typeof p === 'object' && p != null ? (p as { id?: unknown }).id ?? (p as { value?: unknown }).value ?? '' : p).trim();
    const hhId = idByJobly[key];
    if (!hhId || seen.has(hhId)) continue;
    const fmt = HH_WORK_FORMAT.find(f => f.id === hhId);
    if (fmt) {
      seen.add(hhId);
      out.push({ ...fmt, value: fmt.id });
    }
  }
  return out;
}

const SCHEDULE_NAME_TO_HH: Record<string, string> = {
  Полный: 'FIVE_ON_TWO_OFF',
  /** В HH_WORK_SCHEDULE_BY_DAYS нет отдельного id «смена» — ближе «Другое». */
  Сменный: 'OTHER',
  Свободный: 'FLEXIBLE',
  'Удаленная работа': 'FLEXIBLE',
  'Вахтовый метод': 'OTHER',
};

/** Унификация пробелов (в т.ч. NBSP в подписях HH) для сопоставления с формой Jobly. */
function normScheduleToken(s: string): string {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const JOBLY_HOURS_NUM_TO_HH_ID: Record<string, string> = {
  '2': 'HOURS_2',
  '3': 'HOURS_3',
  '4': 'HOURS_4',
  '5': 'HOURS_5',
  '6': 'HOURS_6',
  '7': 'HOURS_7',
  '8': 'HOURS_8',
  '9': 'HOURS_9',
  '10': 'HOURS_10',
  '11': 'HOURS_11',
  '12': 'HOURS_12',
  '24': 'HOURS_24',
};

function findInSchedules(part: string): { id: string; name: string } | null {
  const v = normScheduleToken(part);
  if (!v) return null;
  const hhId = SCHEDULE_NAME_TO_HH[v];
  if (hhId) {
    const row = HH_WORK_SCHEDULE_BY_DAYS.find(s => s.id === hhId);
    if (row) return row;
  }
  const byIdOrExact =
    HH_WORK_SCHEDULE_BY_DAYS.find(s => s.id === v || s.name === v) ||
    HH_WORK_SCHEDULE_BY_DAYS.find(
      s => normScheduleToken(String(s.name)) === normScheduleToken(v)
    ) ||
    HH_WORK_SCHEDULE_BY_DAYS.find(
      s => normScheduleToken(String(s.name)).toLowerCase() === v.toLowerCase()
    );
  if (byIdOrExact) return byIdOrExact;
  return null;
}

/** Сырой schedule из API/формы: строка, массив значений InfoTab или одно значение. */
function scheduleTokensFromVacancy(scheduleVal: unknown): string[] {
  if (scheduleVal == null || scheduleVal === '') return [];
  if (Array.isArray(scheduleVal)) {
    const out: string[] = [];
    for (const item of scheduleVal) {
      if (item == null) continue;
      const raw =
        typeof item === 'object' && item !== null
          ? String(
              (item as { value?: unknown; name?: unknown }).value ??
                (item as { name?: unknown }).name ??
                ''
            )
          : String(item);
      for (const p of raw.split(',')) {
        const t = normScheduleToken(p);
        if (t) out.push(t);
      }
    }
    return out;
  }
  if (typeof scheduleVal === 'string') {
    return scheduleVal.split(',').map(s => normScheduleToken(s)).filter(Boolean);
  }
  return [normScheduleToken(String(scheduleVal))].filter(Boolean);
}

function mapScheduleToHhArray(scheduleVal: unknown): Array<{ id: string; name?: string }> {
  const parts = scheduleTokensFromVacancy(scheduleVal);
  const ids: Array<{ id: string; name?: string }> = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const row = findInSchedules(part);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      ids.push({ id: row.id, name: row.name });
    }
  }
  return ids;
}

function workHoursTokensFromVacancy(v: VacancyLike): string[] {
  const hoursFromApi = v.work_hours_per_day ?? v.workHoursPerDay ?? v.working_hours;
  if (hoursFromApi == null || hoursFromApi === '') return [];
  if (Array.isArray(hoursFromApi)) {
    const out: string[] = [];
    for (const item of hoursFromApi) {
      if (item == null) continue;
      if (typeof item === 'object' && item !== null) {
        const val =
          (item as { value?: unknown; name?: unknown; id?: unknown }).value ??
          (item as { name?: unknown }).name ??
          (item as { id?: unknown }).id;
        if (val != null && String(val).trim() !== '') {
          out.push(String(val).trim());
        }
      } else {
        out.push(String(item).trim());
      }
    }
    return out.filter(Boolean);
  }
  if (typeof hoursFromApi === 'string') {
    return hoursFromApi.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [String(hoursFromApi).trim()].filter(Boolean);
}

function matchHhWorkingHoursRow(token: string): (typeof HH_WORKING_HOURS)[number] | null {
  const raw = normScheduleToken(token);
  if (!raw) return null;

  const numOnly = /^(\d+)$/.exec(raw);
  if (numOnly) {
    const hhId = JOBLY_HOURS_NUM_TO_HH_ID[numOnly[1]];
    if (hhId) {
      const row = HH_WORKING_HOURS.find(h => h.id === hhId);
      if (row) return row;
    }
  }

  const flexNorm = raw.replace(/ё/g, 'е').toLowerCase();
  if (flexNorm.includes('договор')) {
    return HH_WORKING_HOURS.find(h => h.id === 'FLEXIBLE') ?? null;
  }
  if (raw === 'Другое') {
    return HH_WORKING_HOURS.find(h => h.id === 'OTHER') ?? null;
  }

  const stripped = raw.replace(/\s*(часа|часов|час)\s*$/i, '').trim();
  if (stripped !== raw && /^\d+$/.test(stripped)) {
    const hhId = JOBLY_HOURS_NUM_TO_HH_ID[stripped];
    if (hhId) {
      const row = HH_WORKING_HOURS.find(h => h.id === hhId);
      if (row) return row;
    }
  }

  return (
    HH_WORKING_HOURS.find(
      h =>
        h.id === raw ||
        normScheduleToken(String(h.name)) === normScheduleToken(raw) ||
        String(h.name).replace(/ё/g, 'е').toLowerCase() === flexNorm
    ) ?? null
  );
}

function mapWorkingHoursFromVacancy(v: VacancyLike): Array<{ id: string; name?: string }> {
  const parts = workHoursTokensFromVacancy(v);
  const ids: Array<{ id: string; name?: string }> = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const row = matchHhWorkingHoursRow(part);
    if (row && !seen.has(row.id)) {
      seen.add(row.id);
      ids.push({ id: row.id, name: row.name });
    }
  }
  return ids;
}

function mapOformlenieToCivilLaw(v: VacancyLike): Array<{ id: string; name?: string }> {
  const rawOf = v.oformlenie;
  if (!Array.isArray(rawOf) || rawOf.length === 0) return [];
  const mapped: Array<{ id: string; name?: string }> = [];
  for (const o of rawOf) {
    const val = typeof o === 'object' && o != null ? (o as { value?: unknown }).value ?? (o as { id?: unknown }).id ?? '' : o;
    const found = HH_OFORMLENIE_MULTISELECT_OPTIONS.find(x => x.value === val || x.id === val);
    if (found) {
      mapped.push({ id: String(found.value), name: found.name });
    }
  }
  return mapped;
}

function mapDriversToHh(
  v: VacancyLike,
  driverDbIdToName?: Map<number, string>,
): Array<{ id: string }> {
  const dl = v.driving_licence;
  if (Array.isArray(dl) && dl.length > 0) {
    const cats: Array<{ id: string }> = [];
    for (const cat of dl) {
      const name =
        typeof cat === 'object' && cat != null
          ? String((cat as { title?: unknown; name?: unknown; id?: unknown }).title ??
              (cat as { name?: unknown }).name ??
              (cat as { id?: unknown }).id ??
              '')
          : String(cat ?? '');
      const id = name.trim().toUpperCase();
      if (/^[A-E]$/.test(id)) cats.push({ id });
    }
    return cats;
  }
  const drivers = v.drivers;
  if (!Array.isArray(drivers) || drivers.length === 0) return [];
  return drivers
    .map(d => {
      if (!d || typeof d !== 'object') return null;
      const o = d as { id?: unknown; value?: unknown };
      const valRaw = o.value;
      if (valRaw != null && valRaw !== '') {
        const letterFromVal = driverDbNameToHhLetter(String(valRaw));
        if (letterFromVal) return { id: letterFromVal };
      }
      const idRaw = o.id;
      if (idRaw == null) return null;
      const s = String(idRaw).trim().toUpperCase();
      if (/^[A-E]$/.test(s)) return { id: s };
      const num = Number(idRaw);
      if (Number.isFinite(num) && driverDbIdToName) {
        const nm = driverDbIdToName.get(num);
        const letter = nm != null ? driverDbNameToHhLetter(nm) : null;
        if (letter) return { id: letter };
      }
      return null;
    })
    .filter(Boolean) as Array<{ id: string }>;
}

/**
 * Полный черновик без фильтра «подключено» (для отладки).
 */
export function buildFullHhOriginalDraftFromJoblyVacancy(
  vacancy: VacancyLike | null | undefined,
  roleCategories: Array<Record<string, unknown>>,
  opts?: HhDraftBuildOptions,
): Record<string, unknown> {
  if (!vacancy || typeof vacancy !== 'object') {
    return {};
  }
  const form: FormStub = {
    salary_range: { from: null, to: null, currency: null, mode: null, frequency: null },
  };
  applyJoblyVacancyToHhPublicationFormData(form, vacancy);

  const draft: Record<string, unknown> = {};

  if (typeof form.name === 'string' && form.name.trim()) {
    draft.name = form.name;
  }
  if (typeof form.description === 'string') {
    draft.description = form.description;
  }

  if (form.employment_form && typeof form.employment_form === 'object') {
    const ef = form.employment_form as { id?: string; name?: string; siteName?: string };
    draft.employment_form = {
      id: ef.id,
      name: ef.name ?? ef.siteName ?? '',
      ...(typeof ef.siteName === 'string' && ef.siteName ? { siteName: ef.siteName } : {}),
    };
  }

  if (form.experience && typeof form.experience === 'object') {
    draft.experience = form.experience;
  }

  if (form.education_level && typeof form.education_level === 'object') {
    draft.education_level = form.education_level;
  }

  /** Специализация из формы Jobly: строка/объект в specializations или объект professional_role (как в InfoTab). */
  const specHit = findHhRoleInFullCatalog(
    joblySpecializationSourceForHh(vacancy),
    roleCategories as Array<{ roles?: Array<Record<string, unknown>> }>
  );
  if (specHit?.role) {
    draft.professional_roles = [specHit.role];
  }

  const wf = mapJoblyPlaceToHhWorkFormat(vacancy.place);
  if (wf.length > 0) {
    draft.work_format = wf;
  }

  const sched = mapScheduleToHhArray(vacancy.schedule ?? vacancy.work_schedule);
  if (sched.length > 0) {
    draft.work_schedule_by_days = sched;
  }

  const wh = mapWorkingHoursFromVacancy(vacancy);
  if (wh.length > 0) {
    draft.working_hours = wh;
  }

  const night = vacancy.has_evening_night_shifts ?? vacancy.hasEveningNightShifts;
  if (typeof night === 'boolean') {
    draft.night_shifts = night;
  }

  const loc = vacancy.location;
  if (typeof loc === 'string' && loc.trim()) {
    draft.area = { name: loc.trim() };
  }

  const workAddr = vacancy.work_address ?? vacancy.workAddress;
  if (typeof workAddr === 'string' && workAddr.trim()) {
    const hide = !!(vacancy.hide_work_address ?? vacancy.hideWorkAddress);
    draft.address = { raw: workAddr.trim(), show_metro_only: hide };
  }

  const sr = form.salary_range as Record<string, unknown> | undefined;
  if (sr && typeof sr === 'object') {
    draft.salary_range = { ...sr };
  }

  if (Array.isArray(form.key_skills) && form.key_skills.length > 0) {
    draft.key_skills = form.key_skills;
  }

  const rawLangs = vacancy.languages;
  if (Array.isArray(rawLangs) && rawLangs.length > 0) {
    const hhLangs = mapJoblyLanguagesArrayToHh(
      rawLangs,
      opts?.languageList ?? [],
      opts?.languageLevelList ?? [],
    );
    if (hhLangs.length > 0) {
      draft.languages = hhLangs;
    }
  }

  const civil = mapOformlenieToCivilLaw(vacancy);
  if (civil.length > 0) {
    draft.civil_law_contracts = civil;
  }

  const dlt = mapDriversToHh(vacancy, opts?.driverDbIdToName);
  if (dlt.length > 0) {
    draft.driver_license_types = dlt;
  }

  const execName = pickNonEmptyString(vacancy, ['executor_name', 'executorName']);
  const execPhone = pickNonEmptyString(vacancy, ['executor_phone', 'executorPhone']);
  const execEmail = pickNonEmptyString(vacancy, ['executor_email', 'executorEmail']);
  const contactsPayload = buildHhContactsPayloadFromStrings(execName, execPhone, execEmail);
  if (contactsPayload != null) {
    draft.contacts = contactsPayload;
  }

  const showExec = vacancy.show_executor;
  if (showExec === false) {
    draft.show_contacts = false;
  } else {
    draft.show_contacts = true;
  }

  normalizeOformlenieFieldsForPopupDraft(draft);
  return draft;
}

function salaryKeysConnected(connected: Set<string>): { amounts: boolean; currency: boolean; mode: boolean; freq: boolean } {
  return {
    amounts: connected.has('salary_amounts'),
    currency: connected.has('currency'),
    mode: connected.has('salary_mode'),
    freq: connected.has('salary_payment_freq'),
  };
}

/**
 * Итоговый черновик: только поля, отмеченные «подключено» в админке.
 */
export function buildHhOriginalDraftFromJoblyForPublish(
  vacancy: VacancyLike | null | undefined,
  exportRows: HhVacancyExportMapRow[],
  roleCategories: Array<Record<string, unknown>>,
  opts?: HhDraftBuildOptions,
): Record<string, unknown> {
  const full = buildFullHhOriginalDraftFromJoblyVacancy(vacancy, roleCategories, opts);
  /**
   * Пустой ответ GET /vacancies/hh-export-map — не отсекаем все поля (иначе черновик `{}` и тип занятости не попадёт в попап).
   */
  if (!Array.isArray(exportRows) || exportRows.length === 0) {
    const out = { ...full };
    normalizeOformlenieFieldsForPopupDraft(out);
    return out;
  }
  const connected = new Set(exportRows.filter(r => r.connected === true).map(r => r.row_key));
  if (connected.size === 0) {
    return {};
  }

  const out: Record<string, unknown> = {};
  if (connected.has('name') && full.name != null) out.name = full.name;
  if (connected.has('description') && full.description != null) out.description = full.description;
  if (connected.has('specializations') && full.professional_roles != null) {
    out.professional_roles = full.professional_roles;
  }
  if (connected.has('experience') && full.experience != null) out.experience = full.experience;
  if (connected.has('employment') && full.employment_form != null) out.employment_form = full.employment_form;
  if (connected.has('work_format') && full.work_format != null) out.work_format = full.work_format;
  if (connected.has('oformlenie') && full.civil_law_contracts != null) {
    out.civil_law_contracts = full.civil_law_contracts;
    if (typeof full.accept_labor_contract === 'boolean') out.accept_labor_contract = full.accept_labor_contract;
    if (typeof full.internship === 'boolean') out.internship = full.internship;
  }
  if (connected.has('schedule') && full.work_schedule_by_days != null) {
    out.work_schedule_by_days = full.work_schedule_by_days;
  }
  if (connected.has('working_hours') && full.working_hours != null) out.working_hours = full.working_hours;
  if (connected.has('night_shifts') && full.night_shifts != null) out.night_shifts = full.night_shifts;
  if (connected.has('area') && full.area != null) out.area = full.area;
  if (connected.has('address') && full.address != null) out.address = full.address;

  const sk = salaryKeysConnected(connected);
  if (sk.amounts || sk.currency || sk.mode || sk.freq) {
    const base =
      full.salary_range && typeof full.salary_range === 'object'
        ? (full.salary_range as Record<string, unknown>)
        : {};
    const sr: Record<string, unknown> = {};
    if (sk.amounts) {
      if (base.from != null) sr.from = base.from;
      if (base.to != null) sr.to = base.to;
    }
    if (sk.currency && base.currency != null) sr.currency = base.currency;
    if (sk.mode && base.mode != null) sr.mode = base.mode;
    if (sk.freq && base.frequency != null) sr.frequency = base.frequency;
    if (Object.keys(sr).length > 0) out.salary_range = sr;
  }

  if (connected.has('key_skills') && full.key_skills != null) out.key_skills = full.key_skills;
  if (connected.has('languages') && full.languages != null) out.languages = full.languages;
  if (connected.has('drivers') && full.driver_license_types != null) {
    out.driver_license_types = full.driver_license_types;
  }

  /** Контакты/видимость: не завязаны на row_key в админке — переносим из вакансии, если собраны в full. */
  if (full.contacts != null) {
    out.contacts = full.contacts;
  }
  if (typeof full.show_contacts === 'boolean') {
    out.show_contacts = full.show_contacts;
  }

  normalizeOformlenieFieldsForPopupDraft(out);
  return out;
}
