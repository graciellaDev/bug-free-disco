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

// Основной интерфейс кандидата (как возвращается из API)
export interface Candidate {
  id: number;
  firstname?: string;
  surname: string;
  patronymic?: string | null;
  email: string;
  age?: number | null;
  phone?: string | null;
  location?: string;
  quickInfo?: string;
  education?: string;
  link?: string | null;
  experience?: string | null;
  telegram?: string | null;
  messengerMax?: string | null;
  skype?: string | null;
  icon?: string | null;
  imagePath?: string | null;
  isPng?: boolean | null;
  resume?: string | null;
  resumePath?: string | null;
  coverPath?: string | null;
  source?: string | null;
  isReserve?: boolean | null;
  customer?: number | null;
  vacancy?: number | null;
  stage?: number | null;
  attachments?: AttachmentCandidate[] | null;
  skills?: SkillCandidate[] | null;
  tags?: TagCandidate[] | null;
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
export type CandidateUpdateResponse = ApiSuccessResponse<{
  data: Candidate & {
    attachments?: AttachmentCandidate[];
    skills?: SkillCandidate[];
    tags?: TagCandidate[];
    customFields?: CustomFieldCandidate[];
  };
}>;

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
  vacancy?: string;
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
