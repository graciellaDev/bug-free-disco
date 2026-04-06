export type HhOformlenieMultiSelectOption = {
  /** HH API id or internal token (case-insensitive match) */
  id: string;
  /** Token used in popup multi-select model */
  value: 'labor' | 'internship' | 'gph';
  /** Display label */
  name: string;
};

/**
 * Опции для единого мультиселекта «Оформление» в попапе.
 *
 * В HH API civil_law_contracts приходит массив объектов с `id` из справочника
 * (например, SELF_EMPLOYED). Чтобы уверенно нормализовать в единый токен `gph`,
 * держим несколько записей с одинаковым `value: 'gph'`.
 */
export const HH_OFORMLENIE_MULTISELECT_OPTIONS: HhOformlenieMultiSelectOption[] = [
  { id: 'labor', value: 'labor', name: 'Трудовой договор' },
  { id: 'internship', value: 'internship', name: 'Стажировка' },
  { id: 'gph', value: 'gph', name: 'ГПХ' },
  { id: 'SELF_EMPLOYED', value: 'gph', name: 'ГПХ' },
  { id: 'INDIVIDUAL_ENTREPRENEUR', value: 'gph', name: 'ГПХ' },
  { id: 'INDIVIDUAL_PERSON', value: 'gph', name: 'ГПХ' },
];

/**
 * Ключи payload, которые показываются в попапе в фиксированном порядке.
 * Служебные «разделители» начинаются с `__...__`.
 */
export const HH_VACANCY_POPUP_STATIC_DISPLAY_KEYS: string[] = [
  'name',
  'professional_roles',
  'experience',
  'employment_form',
  'fly_in_fly_out_duration',
  'work_format',
  'civil_law_contracts',
  'work_schedule_by_days',
  'working_hours',
  'night_shifts',
  'area',
  'address',
  'salary_range',
  'education_level',
  'description',
  'key_skills',
  'languages',
  'driver_license_types',
  '__contact_information__',
  '__additional_popup__',
];

const HH_VACANCY_FIELD_LABELS_RU: Record<string, string> = {
  name: 'Название вакансии',
  professional_roles: 'Профессия',
  experience: 'Опыт работы',
  employment_form: 'Тип занятости',
  fly_in_fly_out_duration: 'Вахта',
  work_format: 'Формат работы',
  civil_law_contracts: 'Оформление',
  work_schedule_by_days: 'График',
  working_hours: 'Занятость',
  night_shifts: 'Возможны вечерние/ночные смены',
  area: 'Город',
  address: 'Адрес',
  salary_range: 'Зарплата',
  education_level: 'Образование',
  description: 'Описание вакансии',
  key_skills: 'Ключевые навыки',
  languages: 'Знание языков',
  driver_license_types: 'Категории прав',
  allow_messages: 'Разрешить сообщения от соискателей',
  response_letter_required: 'Требовать сопроводительное письмо',
};

/**
 * Русский лейбл поля payload hh.ru (fallback: исходный key).
 */
export function hhVacancyFieldLabelRu(key: string): string {
  return HH_VACANCY_FIELD_LABELS_RU[key] ?? key;
}

/**
 * «Служебные» поля: показываем как read-only JSON (без редактирования).
 * Список намеренно консервативный — можно расширять по мере необходимости.
 */
const HH_VACANCY_PAYLOAD_SERVICE_KEYS = new Set<string>([
  'id',
  'created_at',
  'published_at',
  'archived',
  'state',
  'type',
  'billing_type',
  'employer',
  'department',
  'manager',
  'branded_template',
  'insider_interview',
  'alternate_url',
  'apply_alternate_url',
  'response_url',
]);

export function isHhVacancyPayloadServiceKey(key: string): boolean {
  return HH_VACANCY_PAYLOAD_SERVICE_KEYS.has(key);
}
