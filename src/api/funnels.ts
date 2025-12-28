import { BASE_FUNNEL_ID } from '../constants';
import { apiGet } from './client';

export type Stage = {
  id: number;
  name: string;
  fixed: 0 | 1;
};

export async function getFunnelStages(funnelId: 0 | 1 = BASE_FUNNEL_ID) {
  try {
    const response = await apiGet<Stage[]>(`/funnels/stages/${funnelId}`);

    return response.data || [];
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const fetchError = error as {
        response?: {
          status?: number;
        };
      };

      if (fetchError.response?.status === 404) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Воронка не найдена',
        });
      }
    }
    console.error('Ошибка при получении этапов воронки:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении этапов воронки',
    });
  }
}
