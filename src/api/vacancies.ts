import { apiGet } from './client';

import type { Vacancy } from '@/types/vacancy';

export const getVacancyName = async (id: string): Promise<string> => {
  try {
    const response = await apiGet<Vacancy>(`/vacancies/${id}`);
    return response.data.name || 'Неизвестная вакансия';
  } catch (error) {
    console.error('Ошибка при получении названия вакансии:', error);
    return 'Неизвестная вакансия';
  }
};
