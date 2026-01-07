import { apiGet, apiPost } from './client';
import type { ApiSuccessResponse } from '@/types/clients';
import type { TagCandidate } from '@/types/candidates';

type TagSuccessResponse = ApiSuccessResponse<TagCandidate>;

type TagCreateRequest = {
  name: string;
};

export async function createTag(name: string): Promise<TagSuccessResponse> {
  return await apiPost<TagSuccessResponse['data']>('/tags', {
    name,
  } as TagCreateRequest);
}

export async function findTag(name: string) {
  try {
    const response = await apiGet<TagCandidate>(`/tags/find/${name}`);

    if (!response.data) {
      throw createError({
        statusCode: 404,
        statusMessage: response.message ? response.message : 'Тэг не найден',
      });
    }

    console.log('data', response.data);
    return response.data;
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
          statusMessage: 'Тэг не найден',
        });
      }
    }
    console.error('Ошибка при получении тега:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении тега',
    });
  }
}
