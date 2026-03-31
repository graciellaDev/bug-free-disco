/**
 * Пользовательские поля (в браузере; без API): схема полей общая для кандидатов,
 * значения хранятся отдельно на кандидата — см. `utils/accountCustomFieldsStorage.ts`.
 */

export type CandidateCustomFieldEditorKind =
  | 'text'
  | 'number'
  | 'flag'
  | 'list'
  | 'multilist'
  | 'date'
  | 'link'
  | 'switch'
  | 'address'
  | 'datetime';

export interface LocalCandidateCustomField {
  localId: string;
  name: string;
  fieldKind: CandidateCustomFieldEditorKind;
  /** Подписи вариантов для списка / мультисписка */
  options: string[];
  textValue: string;
  numberValue: string;
  boolValue: boolean;
  listValue: string;
  multiIds: number[];
  dateValue: string;
  timeValue: string;
}

/** Схема поля, общая для всех кандидатов (в рамках браузера / до синхронизации с API). */
export type LocalCustomFieldDefinition = Pick<
  LocalCandidateCustomField,
  'localId' | 'name' | 'fieldKind' | 'options'
>;

/** Значения одного пользовательского поля у одного кандидата. */
export type LocalCustomFieldValuesRow = Pick<
  LocalCandidateCustomField,
  | 'textValue'
  | 'numberValue'
  | 'boolValue'
  | 'listValue'
  | 'multiIds'
  | 'dateValue'
  | 'timeValue'
>;

/** Название поля при сохранении: обрезка пробелов, первая буква — заглавная. */
export function normalizeCustomFieldName(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const CUSTOM_FIELD_TYPE_LABELS: string[] = [
  'Текст',
  'Число',
  'Флаг',
  'Список',
  'Мультисписок',
  'Дата',
  'Ссылка',
  'Адрес',
  'Дата и время',
];

/** Подпись типа для UI (обратно к ключу из CUSTOM_FIELD_KIND_BY_LABEL) */
export const CUSTOM_FIELD_LABEL_BY_KIND: Record<
  CandidateCustomFieldEditorKind,
  string
> = {
  text: 'Текст',
  number: 'Число',
  flag: 'Флаг',
  list: 'Список',
  multilist: 'Мультисписок',
  date: 'Дата',
  link: 'Ссылка',
  switch: 'Переключатель',
  address: 'Адрес',
  datetime: 'Дата и время',
};

/** Разбор подписи типа из селекта (регистр не важен). */
export function fieldKindFromTypeLabel(
  label: string
): CandidateCustomFieldEditorKind | undefined {
  const key = label.trim().toLowerCase();
  return CUSTOM_FIELD_KIND_BY_LABEL[key];
}

export const CUSTOM_FIELD_KIND_BY_LABEL: Record<
  string,
  CandidateCustomFieldEditorKind
> = {
  текст: 'text',
  число: 'number',
  флаг: 'flag',
  список: 'list',
  мультисписок: 'multilist',
  дата: 'date',
  ссылка: 'link',
  переключатель: 'switch',
  адрес: 'address',
  'дата и время': 'datetime',
};

export function createEmptyCustomFieldValues(): LocalCustomFieldValuesRow {
  return {
    textValue: '',
    numberValue: '',
    boolValue: false,
    listValue: '',
    multiIds: [],
    dateValue: '',
    timeValue: '',
  };
}

function timeValueToHm(raw: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec((raw ?? '').trim());
  if (!m) return '00:00';
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return '00:00';
  if (h < 0 || h > 23 || min < 0 || min > 59) return '00:00';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Старый формат (дата ISO в dateValue + time) → `DD.MM.YYYY HH:mm` только в dateValue. */
export function hydrateDatetimeFieldValue(f: LocalCandidateCustomField): void {
  if (f.fieldKind !== 'datetime') return;
  const d = (f.dateValue ?? '').trim();
  const tim = (f.timeValue ?? '').trim();
  if (!d) {
    f.timeValue = '';
    return;
  }
  if (/^\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}$/.test(d)) {
    f.timeValue = '';
    return;
  }
  const hm = timeValueToHm(tim);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (iso) {
    f.dateValue = `${iso[3]}.${iso[2]}.${iso[1]} ${hm}`;
    f.timeValue = '';
    return;
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) {
    f.dateValue = `${d} ${hm}`;
    f.timeValue = '';
  }
}

export function mergeDefinitionWithValues(
  def: LocalCustomFieldDefinition,
  values?: Partial<LocalCustomFieldValuesRow> | null
): LocalCandidateCustomField {
  const v = values ?? {};
  const row: LocalCandidateCustomField = {
    localId: def.localId,
    name: normalizeCustomFieldName(def.name),
    fieldKind: def.fieldKind,
    options: [...def.options],
    ...createEmptyCustomFieldValues(),
    ...v,
    multiIds: Array.isArray(v.multiIds) ? [...v.multiIds] : [],
  };
  if (row.fieldKind === 'datetime') hydrateDatetimeFieldValue(row);
  return row;
}

export function fieldDefinitionFromFull(
  f: LocalCandidateCustomField
): LocalCustomFieldDefinition {
  return {
    localId: f.localId,
    name: normalizeCustomFieldName(f.name),
    fieldKind: f.fieldKind,
    options: [...f.options],
  };
}

export function valuesRowFromFull(
  f: LocalCandidateCustomField
): LocalCustomFieldValuesRow {
  return {
    textValue: f.textValue,
    numberValue: f.numberValue,
    boolValue: f.boolValue,
    listValue: f.listValue,
    multiIds: [...f.multiIds],
    dateValue: f.dateValue,
    timeValue: f.timeValue,
  };
}

export function createLocalCandidateCustomField(
  name: string,
  fieldKind: CandidateCustomFieldEditorKind,
  options: string[]
): LocalCandidateCustomField {
  return mergeDefinitionWithValues({
    localId: crypto.randomUUID(),
    name: normalizeCustomFieldName(name),
    fieldKind,
    options: options.map(o => o.trim()).filter(Boolean),
  });
}

export function parseOptionLines(draft: string): string[] {
  return draft
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
}

/**
 * Хост считаем допустимым для ссылки, если это localhost, IPv4/IPv6 или домен с точкой
 * (отсекаем произвольные слова вроде «Тест», которые URL превращает в односегментный IDN).
 */
function linkHostnameLooksValid(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  if (!h) return false;
  if (h === 'localhost') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  if (h.includes(':')) return true;
  return h.includes('.');
}

/** Разбор http(s)-ссылки для поля «ссылка». Пустая строка — не URL (null). */
export function parseCandidateLinkUrl(raw: string): URL | null {
  const t = (raw ?? '').trim();
  if (!t) return null;
  try {
    const u = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const url = new URL(u);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!linkHostnameLooksValid(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isValidCandidateLinkValue(raw: string): boolean {
  return parseCandidateLinkUrl(raw) !== null;
}

/** Обновить имя и варианты списка; тип и сами значения поля не меняет (список — подчищаются невалидные). */
export function mergeLocalFieldMetadata(
  field: LocalCandidateCustomField,
  name: string,
  optionLinesDraft: string
): LocalCandidateCustomField {
  const opts =
    field.fieldKind === 'list' || field.fieldKind === 'multilist'
      ? parseOptionLines(optionLinesDraft)
      : field.options;
  const next: LocalCandidateCustomField = {
    ...field,
    name: normalizeCustomFieldName(name),
    options:
      field.fieldKind === 'list' || field.fieldKind === 'multilist'
        ? opts
        : field.options,
  };
  if (field.fieldKind === 'list' && opts.length) {
    if (next.listValue && !opts.includes(next.listValue)) {
      next.listValue = '';
    }
  }
  if (field.fieldKind === 'multilist') {
    next.multiIds = next.multiIds.filter(
      id => Number.isInteger(id) && id >= 1 && id <= opts.length
    );
  }
  return next;
}
