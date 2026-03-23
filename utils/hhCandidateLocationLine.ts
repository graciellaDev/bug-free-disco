/**
 * Строка локации в карточке кандидата (HH): Город, м. Станция, …
 * id — из api.hh.ru/dictionaries: relocation_type, business_trip_readiness.
 */

const RELOCATION_BY_ID: Record<string, string> = {
  no_relocation: 'не готов к переезду',
  relocation_possible: 'готов к переезду',
  relocation_desirable: 'хочу переехать',
};

const BUSINESS_TRIP_BY_ID: Record<string, string> = {
  ready: 'готов к командировкам',
  sometimes: 'готов к редким командировкам',
  never: 'не готов к командировкам',
};

function lowerFirstRu(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleLowerCase('ru-RU') + s.slice(1);
}

export function relocationLinePart(
  id: string | null | undefined,
  nameFallback: string | null | undefined
): string {
  if (id && RELOCATION_BY_ID[id]) return RELOCATION_BY_ID[id];
  const n = nameFallback?.trim();
  if (!n) return '';
  const key = n.toLowerCase();
  if (key.includes('не могу переехать') || key.includes('не готов к переезд'))
    return 'не готов к переезду';
  if (key.includes('хочу переехать')) return 'хочу переехать';
  if (key.includes('могу переехать')) return 'готов к переезду';
  return lowerFirstRu(n);
}

export function businessTripLinePart(
  id: string | null | undefined,
  nameFallback: string | null | undefined
): string {
  if (id && BUSINESS_TRIP_BY_ID[id]) return BUSINESS_TRIP_BY_ID[id];
  const n = nameFallback?.trim();
  if (!n) return '';
  return lowerFirstRu(n);
}

export function metroLinePart(metroName: string | null | undefined): string {
  const t = metroName?.trim();
  if (!t) return '';
  return `м. ${t}`;
}

export type CandidateLocationLineInput = {
  location?: string | null;
  metro_name?: string | null;
  relocation_type_id?: string | null;
  relocation_readiness?: string | null;
  business_trip_readiness_id?: string | null;
  business_trip_readiness?: string | null;
  address?: string | null;
  /** HH `gender.id` */
  gender_id?: 'male' | 'female' | null;
  /** Текст пола с API (напр. «Женский») */
  gender?: string | null;
};

/** Женский род для согласования «готов» / «готова» в строке локации. */
export function isFemaleForLocationLine(
  candidate: Pick<CandidateLocationLineInput, 'gender_id' | 'gender'>
): boolean {
  if (candidate.gender_id === 'female') return true;
  if (candidate.gender_id === 'male') return false;
  const g = candidate.gender?.trim();
  if (g && /женск/i.test(g)) return true;
  return false;
}

/**
 * Согласование кратких форм из справочников HH («готов к …») для женского рода.
 * Порядок замен: сначала фразы с «не готов», затем более длинные «редким», затем общие.
 */
export function applyFeminineReadyPhrases(line: string): string {
  if (!line) return line;
  return line
    .replace(/не готов к переезду/giu, 'не готова к переезду')
    .replace(/не готов к командировкам/giu, 'не готова к командировкам')
    .replace(/готов к редким командировкам/giu, 'готова к редким командировкам')
    .replace(/готов к переезду/giu, 'готова к переезду')
    .replace(/готов к командировкам/giu, 'готова к командировкам');
}

export function buildCandidateLocationLine(
  candidate: CandidateLocationLineInput
): string {
  const parts: string[] = [];
  const loc = candidate.location?.trim();
  if (loc) parts.push(loc);
  const metro = metroLinePart(candidate.metro_name);
  if (metro) parts.push(metro);
  const rel = relocationLinePart(
    candidate.relocation_type_id,
    candidate.relocation_readiness
  );
  if (rel) parts.push(rel);
  const trip = businessTripLinePart(
    candidate.business_trip_readiness_id,
    candidate.business_trip_readiness
  );
  if (trip) parts.push(trip);
  let main = parts.join(', ');
  const addr = candidate.address?.trim();
  if (addr) main = main ? `${main} · ${addr}` : addr;
  if (!main) return 'Город и адрес не указаны';
  if (isFemaleForLocationLine(candidate)) {
    main = applyFeminineReadyPhrases(main);
  }
  return main;
}
