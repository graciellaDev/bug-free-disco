export interface Platform {
  platform: string;
  domain: string;
  svg: string;
  isAuthenticated: boolean;
  data: any;
}

export type Resume = {
  first_name?: string;
  last_name?: string;
  title?: string;
};

// export interface PlatformResponse {
//   data: {
//     message: string
//     url_auth: string
//   }
// }

export interface PlatformHhResponse {
  data: {
    items?: any[];
    resources?: any[];
    meta?: {
      page?: number;
      per_page?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// Базовый тип для значений, которые могут быть в FormData
type FormDataValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<{ id: string | number; [key: string]: any } | null>
  | Array<number>
  | Record<string, any>;

// Тип для данных черновика для HH
export interface DraftDataHh extends Record<string, FormDataValue> {
  days?: string;
  workSpace?: string;
  areas?: Array<{ id: string | number; [key: string]: any }>;
  professional_roles?: Array<{
    id: string | number;
    [key: string]: any;
  } | null>;
  salary_range?: Record<string, any>;
  platform?: Record<string, any> | null;
  industry?: Record<string, any>;
  employment_form?: { id: string; name: string; [key: string]: any } | null;
  work_schedule_by_days?: {
    id: string;
    name: string;
    [key: string]: any;
  } | null;
  education_level?: { id: string; name: string; [key: string]: any } | null;
  experience?: { id: string; name: string; [key: string]: any } | null;
  phrases?: number[];
  billing_types?: any;
  driver_license_types?: any;
  name?: string;
  code?: string;
  description?: string;
}
