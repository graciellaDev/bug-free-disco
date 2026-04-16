import { apiGet } from './client';
import type { ApiResponseVacanciesData } from '@/types/vacancy';

import type { Vacancy } from '@/types/vacancy';

type VacanciesByBaseResponse = {
  current_page: number;
  data: Array<{
    id: number;
    title?: string;
    name?: string;
    city?: string;
    status?: string;
    customer_id?: number;
    created_at?: string;
    dateEnd?: string | null;
    views?: number | null;
    responses?: number | null;
    platforms_data?: Array<{
      id?: number;
      name?: string;
      platform_id?: string | number;
      base_vacancy_id?: number;
      cached_views?: number | null;
      cached_imported_responses?: number | null;
      stats_cached_at?: string | null;
      [key: string]: unknown;
    }> | null;
    [key: string]: unknown;
  }>;
  per_page?: number;
  total?: number;
  [key: string]: unknown;
};

export const getVacancyName = async (id: number): Promise<string> => {
  try {
    const response = await apiGet<Vacancy>(`/vacancies/${id}`);
    return response.data.name || 'Неизвестная вакансия';
  } catch (err) {
    console.error('Ошибка при получении названия вакансии:', err);
    return 'Неизвестная вакансия';
  }
};

export const getVacancyById = async (id: string): Promise<Vacancy | null> => {
  try {
    const response = await apiGet<Vacancy>(`/vacancies/${id}`);
    return response.data;
  } catch (err) {
    console.error('Ошибка при получении вакансии:', err);
    return null;
  }
};

export const getVacancies = async (
  queryParams?: Record<string, any>
): Promise<Vacancy[] | null> => {
  try {
    const response = await apiGet<ApiResponseVacanciesData>(
      '/vacancies',
      queryParams
    );
    return response.data.data || null;
  } catch (err) {
    console.error('Ошибка при получении списка вакансий:', err);
    return null;
  }
};

export const getVacanciesByBaseVacancyId = async (
  baseVacancyId: number,
  options?: { signal?: AbortSignal }
): Promise<VacanciesByBaseResponse['data'] | null> => {
  try {
    const response = await apiGet<VacanciesByBaseResponse>(
      '/vacancies',
      {
        'filters[baseVacancyId]': baseVacancyId,
        per_page: 'all',
      },
      { signal: options?.signal }
    );
    return response.data?.data ?? null;
  } catch (err) {
    console.error('Ошибка при получении вакансий по baseVacancyId:', err);
    return null;
  }
};
