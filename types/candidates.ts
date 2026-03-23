import type { ApiSuccessResponse } from './clients';

export type SkillCandidate = {
  id: number;
  name: string;
};

export type TagCandidate = {
  id: number;
  name: string;
};

export type CustomFieldCandidate = {
  id: number;
  value: string;
  type_id: number;
  require: boolean;
  pivot?: {
    value?: string;
    name?: string;
  };
};

export type AttachmentCandidate = {
  id: number;
  link: string;
};

/** Одна запись основного образования из HH (education.primary) */
export type HhEducationPrimaryEntry = {
  name: string;
  organization?: string;
  result?: string;
  year?: string;
  city?: string;
  level?: string;
};

/** Одна запись курса / доп. образования из HH (education.additional) */
export type HhEducationAdditionalEntry = {
  id?: string;
  name: string;
  organization?: string;
  result?: string;
  year?: string;
};

/** Сертификат из HH (`certificate` в резюме) для отображения в карточке */
export type HhCertificateDisplayItem = {
  title: string;
  year?: string;
  url?: string;
};

/** Одна запись опыта работы (компания, период, должность, описание) */
export type ExperienceEntryCandidate = {
  id?: number | string;
  start_date?: string;
  end_date?: string;
  dates?: string;
  duration?: string;
  company?: string;
  location?: string;
  industry?: string;
  job_title?: string;
  role_dates?: string;
  description?: string;
};

// Основной интерфейс кандидата (как возвращается из API)
export interface Candidate {
  id: number;
  firstname?: string;
  surname?: string;
  patronymic?: string | null;
  email: string;
  age?: number | null;
  /** Пол (в карточке после имени, серым через точку с возрастом) */
  gender?: string | null;
  /** HH `gender.id`: male | female — приоритетнее строки `gender` для отображения */
  gender_id?: 'male' | 'female' | null;
  phone?: string | null;
  location?: string;
  /** Станция метро (HH `metro.name`) */
  metro_name?: string | null;
  /** HH `relocation.type.id` (справочник relocation_type) */
  relocation_type_id?: string | null;
  /** Текст готовности к переезду из HH (если id нет) */
  relocation_readiness?: string | null;
  /** HH `business_trip_readiness.id` (справочник business_trip_readiness) */
  business_trip_readiness_id?: string | null;
  /** Текст готовности к командировкам из HH (если id нет) */
  business_trip_readiness?: string | null;
  /** Адрес (в карточке кандидата после города) */
  address?: string | null;
  /** Желаемая зарплата (от) */
  salaryFrom?: number | null;
  /** Желаемая зарплата (до) */
  salaryTo?: number | null;
  /** Валюта зарплаты */
  currency?: string | null;
  quickInfo?: string;
  /** Специализации (желаемая сфера) */
  specializations?: string | null;
  /** Тип занятости */
  employment?: string | null;
  /** Формат работы (удалённо, офис и т.д.); API может вернуть work_format */
  workFormat?: string | null;
  work_format?: string | null;
  education?: string;
  /** Уровень образования (в API Laravel: education_level_id — часто текст уровня из HH) */
  education_level_id?: string | null;
  /** @deprecated используйте education_level_id */
  educationLevel?: string | null;
  /** Основное образование из HH (массив вузов) */
  education_primary?: HhEducationPrimaryEntry[] | null;
  /** Название заведения */
  educationInstitution?: string | null;
  /** Факультет */
  educationFaculty?: string | null;
  /** Специализация */
  educationSpecialization?: string | null;
  /** Год окончания */
  educationYear?: string | null;
  /** Курсы повышения квалификации: название */
  courseName?: string | null;
  /** Курсы повышения квалификации: проводившая организация */
  courseOrganization?: string | null;
  /** Курсы повышения квалификации: специализация */
  courseSpecialization?: string | null;
  /** Курсы повышения квалификации: год окончания */
  courseYear?: string | null;
  /** Все курсы из HH (education.additional); поля course* — дубль первой записи для совместимости */
  education_additional?: HhEducationAdditionalEntry[] | null;
  link?: string | null;
  /** Общий опыт (строка, напр. "28 лет 4 месяца") для заголовка блока */
  experience?: string | null;
  /** Навыки из HH (может прийти строкой или массивом строк) */
  skill_set?: string | string[] | null;
  /** Языки из HH (может прийти строкой JSON/текстом или массивом объектов) */
  language?: unknown;
  /** Рекомендации из HH */
  recommendation?: unknown;
  /** Список записей опыта работы (компании, периоды, описания) */
  experiences?: ExperienceEntryCandidate[] | null;
  telegram?: string | null;
  messengerMax?: string | null;
  skype?: string | null;
  icon?: string | null;
  imagePath?: string | null;
  isPng?: boolean | null;
  resume?: string | null;
  resumePath?: string | null;
  coverPath?: string | null;
  /** Текст сопроводительного письма */
  coverLetter?: string | null;
  /** Сертификаты из HH (массив объектов в ответе API) */
  certificate?: unknown;
  source?: string | null;
  isReserve?: boolean | null;
  customer?: number | null;
  vacancy_id?: number | null;
  stage?: number | null;
  attachments?: AttachmentCandidate[] | null;
  skills?: SkillCandidate[] | null;
  /** Родной язык */
  nativeLanguage?: string | null;
  /** Другие языки */
  otherLanguages?: string | null;
  /** Обо мне (текст) */
  aboutMe?: string | null;
  /** Дополнительно: желательное время в пути (HH `travel_time`, в API Laravel: `commute_time`) */
  commute_time?: string | null;
  commuteTime?: string | null;
  /** Командировки (HH `business_trip_readiness`, API: `business_trip_readiness`) */
  business_trip_readiness?: string | null;
  businessTrips?: string | null;
  citizenship?: string | null;
  /** Разрешение на работу (HH `work_ticket`, API: `work_ticket`) */
  work_ticket?: string | null;
  workPermit?: string | null;
  /** Наличие автомобиля (HH `has_vehicle`, API: `has_vehicle`) */
  has_vehicle?: string | null;
  hasCar?: string | null;
  /** Категории прав (HH `driver_license_types`, API: JSON-массив) */
  driver_license_types?: string[] | null;
  hasDriverLicense?: string | null;
  tags?: TagCandidate[] | number[] | null;
  customFields?: CustomFieldCandidate[] | null;
  /** Дата обновления резюме на HH */
  resume_updated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Успешный ответ запроса списка кандидатов
export type ApiCandidatesResponse = ApiSuccessResponse<{
  data: Candidate[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  path: string;
  first_page_url: string;
  last_page_url: string;
  prev_page_url: string | null;
  next_page_url: string | null;
}>;

// Успешный ответ запроса по id кандидата
export type ApiCandidateByIdResponse = ApiSuccessResponse<
  Candidate & {
    attachments?: AttachmentCandidate[];
    skills?: SkillCandidate[];
    tags?: TagCandidate[];
    customFields?: CustomFieldCandidate[];
  }
>;

// Успешный ответ создания кандидата
export type CandidateCreateResponse = ApiSuccessResponse<
  Candidate & {
    customer: number;
    skills?: SkillCandidate[];
    tags?: TagCandidate[];
    customFields?: CustomFieldCandidate[];
    attachments?: AttachmentCandidate[];
  }
>;

// Успешный ответ обновления данных кандидата
export type CandidateUpdateResponse = ApiSuccessResponse<
  Candidate & {
    attachments?: AttachmentCandidate[];
    skills?: SkillCandidate[];
    tags?: TagCandidate[];
    customFields?: CustomFieldCandidate[];
  }
>;

// Успешный ответ удаления кандидата
export type CandidateDeleteResponse = ApiSuccessResponse<{
  data: null;
}>;

// Для создания кандидата
export interface CandidateCreateRequest {
  firstname: string;
  surname?: string;
  patronymic?: string;
  email: string;
  vacancy_id?: number | null;
  age?: number | null;
  phone?: string; // формат: +7XXXXXXXXXX
  stage_id?: number | null;
  location?: string;
  quickInfo?: string;
  education?: string;
  link?: string | null;
  experience?: string;
  telegram?: string | null;
  skype?: string | null;
  icon?: string | null;
  imagePath?: string | null;
  isPng?: boolean | null;
  resume?: string | null;
  resumePath?: string | null;
  coverPath?: string | null;
  source?: string | null;
  customFields?: number | null;
  skills?: number[];
  tags?: number[];
  attachments?: string[];
}

// Для запроса на обновление данных кандидата
export interface CandidateUpdateRequest extends Partial<Candidate> {}

export type ApiResponseCandidatesData = {
  data: Candidate[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  firstName?: string;
};

export interface ApiResponseCandidates {
  data: ApiResponseCandidatesData;
}

// Успешный ответ запроса по id кандидата
export interface ApiResponseById {
  candidateData: Candidate;
  candidateExtra: {
    attachments?: AttachmentCandidate[];
    skills?: SkillCandidate[];
    tags?: TagCandidate[];
    customFields?: CustomFieldCandidate[];
  };
}

/** Одно рассмотрение кандидата по вакансии (для вкладки «Рассмотрения»). */
export interface CandidateConsideration {
  vacancy_id: number;
  vacancy_name: string;
  stage_id?: number;
  stage_name: string;
  updated_at: string;
  recruiters: string[];
  customers: string[];
}

/** Событие в логе кандидата (создание резюме, смена этапа, изменение полей и т.д.). */
export interface CandidateEvent {
  id: number;
  type: string;
  occurred_at: string;
  author_name?: string | null;
  direction?: string | null;
  channel?: string | null;
  payload?: {
    content?: string;
    [key: string]: unknown;
  };
}
