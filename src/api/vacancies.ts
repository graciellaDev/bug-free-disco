import { apiGet } from './client';
import type { ApiResponseVacanciesData } from '@/types/vacancy';

import type { Vacancy } from '@/types/vacancy';

export const getVacancyName = async (id: string): Promise<string> => {
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
