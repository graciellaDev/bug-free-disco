/**
 * Метаданные полей публикации вакансии на hh.ru в терминах API (что принимает наш бэкенд → HH).
 * Попап «Публикация вакансии» для hh.ru ориентируется на эти ключи, а не на внутренние названия полей Jobly.
 *
 * Whitelist валидации на бэкенде: HeadHunterController::addPublication / addDraft (jobly-back).
 */

export type HhPublicationGroupId = 'basic' | 'conditions';

export type JoblyVacancyKey =
  | 'name'
  | 'description'
  | 'code'
  | 'industry'
  | 'specializations'
  | 'employment'
  | 'experience'
  | 'education'
  | 'salary_from'
  | 'salary_to'
  | 'currency'
  | 'skills'
  | 'phrases'
  | 'schedule'
  | 'work_schedule'
  | 'work_hours_per_day'
  | 'workHoursPerDay'
  | 'location'
  | 'publication_city'
  | 'publicationCity'
  | 'work_address'
  | 'workAddress'
  | 'hide_work_address'
  | 'hideWorkAddress'
  | 'place'
  | 'drivers'
  | 'driving_licence';

export interface HhPublicationFieldMeta {
  hhApiKey: string;
  labelRu: string;
  joblyVacancyKeys: JoblyVacancyKey[];
  group: HhPublicationGroupId;
}

/** Заголовки секций попапа для hh.ru */
export const HH_PUBLICATION_SECTIONS: Record<
  HhPublicationGroupId,
  { titleRu: string; subtitleRu: string }
> = {
  basic: {
    titleRu: 'Текст и профессиональная роль',
    subtitleRu:
      'Параметры API hh.ru: name, description, code, professional_roles.',
  },
  conditions: {
    titleRu: 'Условия работы и размещение',
    subtitleRu:
      'employment_form, work_format, schedule, work_schedule_by_days, address, area, experience, education_level, salary_range, driver_license_types, vacancy_properties и др.',
  },
};

export const HH_PUBLICATION_FIELD_REGISTRY: HhPublicationFieldMeta[] = [
  {
    hhApiKey: 'name',
    labelRu: 'Название',
    joblyVacancyKeys: ['name'],
    group: 'basic',
  },
  {
    hhApiKey: 'description',
    labelRu: 'Описание',
    joblyVacancyKeys: ['description'],
    group: 'basic',
  },
  {
    hhApiKey: 'code',
    labelRu: 'Код вакансии',
    joblyVacancyKeys: ['code'],
    group: 'basic',
  },
  {
    hhApiKey: 'professional_roles',
    labelRu: 'Специализация (профессиональная роль)',
    joblyVacancyKeys: ['industry', 'specializations'],
    group: 'basic',
  },
  {
    hhApiKey: 'employment_form',
    labelRu: 'Тип занятости',
    joblyVacancyKeys: ['employment'],
    group: 'conditions',
  },
  {
    hhApiKey: 'experience',
    labelRu: 'Опыт',
    joblyVacancyKeys: ['experience'],
    group: 'conditions',
  },
  {
    hhApiKey: 'education_level',
    labelRu: 'Образование',
    joblyVacancyKeys: ['education'],
    group: 'conditions',
  },
  {
    hhApiKey: 'salary_range',
    labelRu: 'Зарплата',
    joblyVacancyKeys: ['salary_from', 'salary_to', 'currency'],
    group: 'conditions',
  },
  {
    hhApiKey: 'key_skills',
    labelRu: 'Ключевые навыки',
    joblyVacancyKeys: ['skills', 'phrases'],
    group: 'conditions',
  },
  {
    hhApiKey: 'work_schedule_by_days',
    labelRu: 'График работы',
    joblyVacancyKeys: ['schedule', 'work_schedule'],
    group: 'conditions',
  },
];

/** UI попапа «текст с hh.ru» (только просмотр снимка API). */
export type HhOriginalPopupFieldUiKind =
  | 'text'
  | 'textarea'
  | 'json'
  | 'key_skills_chips'
  | 'professional_roles_brief';

export interface HhOriginalPopupFieldMeta {
  hhApiKey: string;
  labelRu: string;
  group: HhPublicationGroupId;
  uiKind: HhOriginalPopupFieldUiKind;
}

export const HH_ORIGINAL_POPUP_FIELDS: HhOriginalPopupFieldMeta[] = [
  {
    hhApiKey: 'name',
    labelRu: 'Название',
    group: 'basic',
    uiKind: 'text',
  },
  {
    hhApiKey: 'description',
    labelRu: 'Описание',
    group: 'basic',
    uiKind: 'textarea',
  },
  {
    hhApiKey: 'code',
    labelRu: 'Код вакансии',
    group: 'basic',
    uiKind: 'text',
  },
  {
    hhApiKey: 'professional_roles',
    labelRu: 'Профессиональные роли',
    group: 'basic',
    uiKind: 'professional_roles_brief',
  },
  {
    hhApiKey: 'employment_form',
    labelRu: 'Тип занятости',
    group: 'conditions',
    uiKind: 'json',
  },
  {
    hhApiKey: 'experience',
    labelRu: 'Опыт',
    group: 'conditions',
    uiKind: 'json',
  },
  {
    hhApiKey: 'education_level',
    labelRu: 'Образование',
    group: 'conditions',
    uiKind: 'json',
  },
  {
    hhApiKey: 'salary_range',
    labelRu: 'Зарплата',
    group: 'conditions',
    uiKind: 'json',
  },
  {
    hhApiKey: 'key_skills',
    labelRu: 'Ключевые навыки',
    group: 'conditions',
    uiKind: 'key_skills_chips',
  },
  {
    hhApiKey: 'work_schedule_by_days',
    labelRu: 'График работы',
    group: 'conditions',
    uiKind: 'json',
  },
];
