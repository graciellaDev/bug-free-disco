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
  phone?: string | null;
  location?: string;
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
  /** Уровень образования */
  educationLevel?: string | null;
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
  link?: string | null;
  /** Общий опыт (строка, напр. "28 лет 4 месяца") для заголовка блока */
  experience?: string | null;
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
  /** Дополнительно: желательное время в пути до работы */
  commuteTime?: string | null;
  /** Дополнительно: командировки */
  businessTrips?: string | null;
  /** Дополнительно: гражданство */
  citizenship?: string | null;
  /** Дополнительно: разрешение на работу */
  workPermit?: string | null;
  /** Дополнительно: наличие машины */
  hasCar?: string | null;
  /** Дополнительно: наличие прав */
  hasDriverLicense?: string | null;
  tags?: TagCandidate[] | number[] | null;
  customFields?: CustomFieldCandidate[] | null;
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
