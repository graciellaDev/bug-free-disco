import type {
  ApiCandidatesResponse,
  Candidate,
  CandidateCreateRequest,
  CandidateCreateResponse,
  ApiCandidateByIdResponse,
  ApiResponseById,
  AttachmentCandidate,
  SkillCandidate,
  TagCandidate,
  CustomFieldCandidate,
  CandidateUpdateRequest,
  CandidateUpdateResponse,
} from '~/types/candidates';
import { apiGet, apiPost, apiPut, apiDelete } from './client';

export async function getCandidates(page = 1) {
  try {
    const response = await apiGet<ApiCandidatesResponse['data']>(
      '/candidates',
      { page }
    );

    return {
      candidates: response.data.data || [],
      pagination: {
        total: response.data.total,
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        perPage: response.data.per_page,
      },
    };
  } catch (error) {
    console.error('Ошибка при получении кандидатов:', error);
    return {
      candidates: [],
      pagination: { total: 0, currentPage: 1, lastPage: 1, perPage: 15 },
    };
  }
}

export async function getCandidateById(id: number): Promise<ApiResponseById> {
  try {
    const response = await apiGet<ApiCandidateByIdResponse['data']>(
      `/candidates/${id}`
    );
    return {
      candidateData: response.data as Candidate,
      candidateExtra: {
        attachments: response.data?.attachments as AttachmentCandidate[],
        skills: response.data?.skills as SkillCandidate[],
        tags: response.data?.tags as TagCandidate[],
        customFields: response.data?.customFields as CustomFieldCandidate[],
      },
    };
  } catch (error: unknown) {
    // Специфичная обработка для 404
    if (error && typeof error === 'object' && 'response' in error) {
      const fetchError = error as {
        response?: {
          status?: number;
        };
      };

      if (
        fetchError.response?.status === 404 ||
        fetchError.response?.status === 400
      ) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Кандидат не найден',
        });
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении кандидата',
    });
  }
}

export async function createCandidate(
  candidate: CandidateCreateRequest
): Promise<CandidateCreateResponse> {
  // Ошибки пробрасываются автоматически для обработки в компоненте
  return await apiPost<CandidateCreateResponse['data']>(
    '/candidates',
    candidate
  );
}

export async function updateCandidate(
  id: number,
  data: CandidateUpdateRequest
): Promise<CandidateUpdateResponse> {
  return await apiPut<CandidateUpdateResponse['data']>(
    `/candidates/${id}`,
    data
  );
}

export async function deleteCandidate(id: number): Promise<void> {
  await apiDelete(`/candidates/${id}`);
}

export async function moveCandidateToVacancy(
  candidateId: number,
  vacancyId: number
): Promise<void> {
  await apiPut(`/candidates/${candidateId}`, {
    vacancy: vacancyId,
  });
}

/**
 * Загружает фотографию кандидата на фронтенд-сервер (Nuxt API route)
 * ВАЖНО: Это запрос к локальному серверному API Nuxt, а не к бэкенду!
 *
 * @param candidateId - ID кандидата
 * @param file - Файл изображения
 * @returns Путь к загруженному файлу
 */
export async function uploadCandidatePhoto(
  candidateId: number,
  file: File
): Promise<{ imagePath: string }> {
  const formData = new FormData();
  formData.append('photo', file);

  // ВАЖНО: Используем $fetch БЕЗ baseURL - это запрос к серверному API route Nuxt
  // Путь /api/candidates/... обрабатывается серверным route в server/api/
  // Это НЕ запрос к бэкенду (который идет через config.public.apiBase)
  try {
    const response = await $fetch<{ success: boolean; imagePath: string }>(
      `/api/candidates/${candidateId}/photo`,
      {
        method: 'POST',
        body: formData,
        baseURL: 'http://localhost:3000',
        // НЕ указываем baseURL - запрос идет к локальному серверу Nuxt
        // НЕ указываем Content-Type - браузер установит автоматически с boundary
      }
    );

    if (!response || !response.success) {
      throw new Error('Ошибка при загрузке фото');
    }

    return { imagePath: response.imagePath };
  } catch (error: any) {
    console.error('[uploadCandidatePhoto] Ошибка при загрузке фото:', error);

    if (error.statusMessage) {
      throw new Error(error.statusMessage);
    }

    if (error.response?._data?.message) {
      throw new Error(error.response._data.message);
    }

    throw new Error(error.message || 'Ошибка при загрузке фото');
  }
}

// export async function fetchCandidatesMin(page = 1) {
//   const { candidates, pagination } = await fetchCandidatesFull(page);

//   const minified: Candidate[] = candidates.map((item: any) => ({
//     id: item.id,
//     firstName: item.firstname,
//     surname: item.surname,
//     tags: item.tags || [],
//     icon: item.icon,
//     isPng: false, // temporary before backend integration boolean values
//     imagePath: item.imagePath,
//     resume: item.resume,
//     vacancy: item.vacancy,
//     stage: item.stage
//   }));

//   console.log("Response min data", minified);
//   return { candidates: minified, pagination };
// }
