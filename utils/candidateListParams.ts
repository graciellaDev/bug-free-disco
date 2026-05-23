export type CandidateListSort = 'newest' | 'oldest';

export type CandidateSearchMode = 'all' | 'any' | 'exact' | 'exclude';

export type CandidateSearchField =
  | 'all'
  | 'resume_title'
  | 'education'
  | 'skills'
  | 'experience'
  | 'experience_companies'
  | 'experience_positions'
  | 'experience_duties'
  /** @deprecated — для старых сохранённых фильтров */
  | 'name'
  | 'quickInfo'
  | 'email'
  | 'phone'
  | 'tags';

export type CandidateSearchRow = {
  text: string;
  mode: CandidateSearchMode;
  fields: CandidateSearchField[];
  /** @deprecated — для старого формата строки поиска */
  field?: CandidateSearchField;
};

export type CandidateListFilters = {
  vacancy_id?: number;
  vacancy_ids?: number[];
  stage_id?: number;
  gender?: string;
  source?: string;
  age_from?: number;
  age_to?: number;
  salary_from?: number;
  salary_to?: number;
  citizenship?: string;
  location?: string;
  quick_info?: string;
  response_type?: string;
  tags?: string;
  client_id?: number;
  created_at_from?: string;
  created_at_to?: string;
  search_rows?: CandidateSearchRow[];
};

export const CANDIDATE_SEARCH_MODE_LABELS: Record<CandidateSearchMode, string> = {
  all: 'По всем словам',
  any: 'Любое из слов',
  exact: 'Точная фраза',
  exclude: 'Не встречается',
};

export const CANDIDATE_SEARCH_FIELD_LABELS: Record<CandidateSearchField, string> = {
  all: 'Везде',
  resume_title: 'В названии резюме',
  education: 'В образовании',
  skills: 'В ключевых навыках',
  experience: 'В опыте работы',
  experience_companies: 'В компаниях и отраслях',
  experience_positions: 'В должностях',
  experience_duties: 'В обязанностях',
  name: 'ФИО',
  quickInfo: 'В должностях',
  email: 'Email',
  phone: 'Телефон',
  tags: 'Теги',
};

const LEGACY_SEARCH_FIELD_MAP: Record<string, CandidateSearchField> = {
  name: 'all',
  quickInfo: 'experience_positions',
  email: 'all',
  phone: 'all',
  tags: 'all',
};

const CURRENT_SEARCH_FIELDS: CandidateSearchField[] = [
  'all',
  'resume_title',
  'education',
  'skills',
  'experience',
  'experience_companies',
  'experience_positions',
  'experience_duties',
];

export function normalizeCandidateSearchField(
  field: string | undefined | null
): CandidateSearchField {
  const raw = (field ?? 'all').trim();
  if (raw in LEGACY_SEARCH_FIELD_MAP) {
    return LEGACY_SEARCH_FIELD_MAP[raw];
  }
  if (CURRENT_SEARCH_FIELDS.includes(raw as CandidateSearchField)) {
    return raw as CandidateSearchField;
  }
  return 'all';
}

export function normalizeCandidateSearchFields(
  fields: Array<string | CandidateSearchField> | undefined | null
): CandidateSearchField[] {
  const normalized = Array.from(
    new Set((fields ?? []).map(v => normalizeCandidateSearchField(String(v))))
  );
  const withoutAll = normalized.filter(v => v !== 'all');
  if (withoutAll.length > 0) {
    return withoutAll;
  }
  return ['all'];
}

export const CANDIDATE_RESPONSE_TYPE_OPTIONS = [
  { value: '', label: 'Любой тип отклика' },
  { value: 'Прямой отклик', label: 'Прямой отклик' },
  { value: 'Холодный поиск', label: 'Холодный поиск' },
];

export function createEmptyCandidateSearchRow(): CandidateSearchRow {
  return { text: '', mode: 'all', fields: ['all'] };
}

export function createDefaultCandidateListState(): {
  searchRows: CandidateSearchRow[];
  filters: CandidateListFilters;
  sort: CandidateListSort;
} {
  return {
    searchRows: [createEmptyCandidateSearchRow()],
    filters: {},
    sort: 'newest',
  };
}

function appendFilterParam(
  params: Record<string, string | number>,
  key: string,
  value: string | number | undefined | null
) {
  if (value === undefined || value === null || value === '') {
    return;
  }
  params[`filters[${key}]`] = value;
}

export function buildCandidateListQueryParams(
  searchRows: CandidateSearchRow[],
  filters: CandidateListFilters,
  sort: CandidateListSort
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  const rows = (searchRows ?? []).filter(r => r.text.trim() !== '');

  if (rows.length > 0) {
    const normalizedRows = rows.map(r => {
      const fields = normalizeCandidateSearchFields(
        Array.isArray(r.fields) ? r.fields : [r.field ?? 'all']
      );
      return {
        text: r.text.trim(),
        mode: r.mode,
        fields,
        field: fields[0],
      };
    });
    const first = normalizedRows[0];
    params.q = first.text.trim();
    params.q_mode = first.mode;
    params.q_field = first.fields[0];
    params['filters[search_rows]'] = JSON.stringify(normalizedRows);
  }

  if (filters.vacancy_id != null && filters.vacancy_id > 0) {
    params.vacancy_id = filters.vacancy_id;
  }
  if (Array.isArray(filters.vacancy_ids) && filters.vacancy_ids.length > 0) {
    params['filters[vacancy_ids]'] = JSON.stringify(filters.vacancy_ids);
    if (params.vacancy_id == null) {
      params.vacancy_id = filters.vacancy_ids[0];
    }
  }
  if (filters.stage_id != null && filters.stage_id > 0) {
    params['filters[stage_id]'] = filters.stage_id;
  }

  appendFilterParam(params, 'source', filters.source?.trim());
  appendFilterParam(params, 'gender', filters.gender?.trim());
  appendFilterParam(params, 'age_from', filters.age_from);
  appendFilterParam(params, 'age_to', filters.age_to);
  appendFilterParam(params, 'salary_from', filters.salary_from);
  appendFilterParam(params, 'salary_to', filters.salary_to);
  appendFilterParam(params, 'citizenship', filters.citizenship?.trim());
  appendFilterParam(params, 'location', filters.location?.trim());
  appendFilterParam(params, 'quick_info', filters.quick_info?.trim());
  appendFilterParam(params, 'response_type', filters.response_type?.trim());
  appendFilterParam(params, 'tags', filters.tags?.trim());
  appendFilterParam(params, 'client_id', filters.client_id);
  appendFilterParam(params, 'created_at_from', filters.created_at_from?.trim());
  appendFilterParam(params, 'created_at_to', filters.created_at_to?.trim());

  if (sort === 'oldest') {
    params.sort = 'dateCreate';
  } else if (sort === 'newest') {
    params.sort = 'dateCreate';
    params.asc = '0';
  }

  return params;
}

export function candidateListStateHasActiveFilters(
  searchRows: CandidateSearchRow[],
  filters: CandidateListFilters
): boolean {
  if ((searchRows ?? []).some(r => r.text.trim() !== '')) {
    return true;
  }
  const f = filters ?? {};
  return !!(
    (f.vacancy_id != null && f.vacancy_id > 0)
    || (Array.isArray(f.vacancy_ids) && f.vacancy_ids.length > 0)
    || (f.stage_id != null && f.stage_id > 0)
    || f.source?.trim()
    || f.gender?.trim()
    || f.age_from != null
    || f.age_to != null
    || f.salary_from != null
    || f.salary_to != null
    || f.citizenship?.trim()
    || f.location?.trim()
    || f.quick_info?.trim()
    || f.response_type?.trim()
    || f.tags?.trim()
    || (f.client_id != null && f.client_id > 0)
    || f.created_at_from?.trim()
    || f.created_at_to?.trim()
  );
}
