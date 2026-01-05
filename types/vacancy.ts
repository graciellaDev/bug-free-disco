export type Option<T = string> = {
  id: number;
  name: T;
};
export type Phrase = string | Option[];

export interface Vacancy {
  id?: number;
  name: string;
  title?: string;
  code?: number;
  description: string;
  dateEnd?: string;
  specializations?: string;
  industry?: string;
  employment?: string;
  schedule?: string;
  experience?: string;
  education?: string;
  salary_from?: Number;
  salary_to?: Number;
  salary_type?: string;
  currency?: string;
  place?: Number;
  location?: string;
  city?: string;
  customer_id?: number;
  executor_name?: string;
  executor_id?: number;
  executor_email?: string;
  executor_phone?: string;
  status?: string;
  show_executor?: boolean;
  phrases?: Phrase;
  conditions?: Option[];
  drivers?: Option[];
  additions?: Option[];
  customer_phone?: string;
  customer_email?: string;
  created_at?: string;
  updated_at?: string;
}

export type ApiResponseVacanciesData = {
  data: Vacancy[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  firstName?: string;
};

export interface ApiResponseVacancies {
  data: ApiResponseVacanciesData;
}

export interface ResponseVacancy {
  name: string;
  code?: string;
  description: string;
  industry: string;
  specializations?: string;
  employment?: string;
  schedule?: string;
  experience?: string;
  education?: string;
  phrases?: string;
  conditions: Option[] | [];
  drivers: Option[] | [];
  additions: Option[] | [];
  salary_from?: number;
  salary_to?: number;
  currency?: string;
  place?: number;
  location?: string;
  customer_id?: number;
  customer_phone?: string;
  customer_email?: string;
  status: string;
}

export interface ApiResponseVacancy {
  message: string;
  data: Vacancy;
}
