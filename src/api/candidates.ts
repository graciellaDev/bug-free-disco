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
  CandidateConsideration,
  CandidateEvent,
} from '~/types/candidates';
import { apiGet, apiPost, apiPut, apiDelete } from './client';

export async function getCandidates(page = 1, filters?: Record<string, any>) {
  try {
    const queryParams: Record<string, any> = { page };

    if (filters) {
      Object.assign(queryParams, filters);
    }

    const response = await apiGet<ApiCandidatesResponse['data']>(
      '/candidates',
      { ...queryParams }
    );

    return {
      candidates: response.data.data || [],
      pagination: {
        total: response.data.total,
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
      },
    };
  } catch (error) {
    console.error('Ошибка при получении кандидатов:', error);
    return {
      candidates: [],
      pagination: { total: 0, current_page: 1, last_page: 1, per_page: 15 },
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
  candidate: CandidateUpdateRequest
): Promise<CandidateUpdateResponse> {
  return await apiPut<CandidateUpdateResponse['data']>(
    `/candidates/${candidate.id}`,
    candidate
  );
}

export async function deleteCandidate(id: number): Promise<void> {
  await apiDelete(`/candidates/${id}`);
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

export async function getCandidateConsiderations(
  candidateId: number
): Promise<CandidateConsideration[]> {
  const response = await apiGet<CandidateConsideration[]>(
    `/candidates/${candidateId}/considerations`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/** События по кандидату (лог: создание резюме, смена этапа, изменение полей и т.д.). При указании vacancyId — события в контексте вакансии. */
export async function getCandidateEvents(
  candidateId: number,
  vacancyId?: number | null
): Promise<CandidateEvent[]> {
  const url =
    vacancyId != null
      ? `/candidates/${candidateId}/vacancies/${vacancyId}/events`
      : `/candidates/${candidateId}/events`;
  const response = await apiGet<CandidateEvent[]>(url);
  return Array.isArray(response.data) ? response.data : [];
}

/** Отправить письмо кандидату и создать событие в ленте. */
export async function sendCandidateEmail(
  candidateId: number,
  payload: { subject: string; body: string; to: string; from_email?: string }
): Promise<{ event_id: number }> {
  const response = await apiPost<{ event_id: number }>(
    `/candidates/${candidateId}/emails`,
    {
      subject: payload.subject.trim(),
      body: payload.body,
      to: payload.to.trim(),
      from_email: payload.from_email || undefined,
    }
  );
  const raw = response as { data?: { event_id?: number }; event_id?: number };
  return { event_id: raw.data?.event_id ?? raw.event_id ?? 0 };
}

/** Создать комментарий (заметку) по кандидату. */
export async function createCandidateComment(
  candidateId: number,
  content: string
): Promise<{ event_id: number }> {
  const response = await apiPost<{ message: string; event_id: number }>(
    `/candidates/${candidateId}/comments`,
    { content: content.trim() }
  );
  return { event_id: response.data?.event_id ?? 0 };
}

/** Удалить комментарий по кандидату (eventId — id события типа comment). */
export async function deleteCandidateComment(
  candidateId: number,
  eventId: number
): Promise<void> {
  await apiDelete(`/candidates/${candidateId}/comments/${eventId}`);
}

/** Обновить текст комментария. */
export async function updateCandidateComment(
  candidateId: number,
  eventId: number,
  content: string
): Promise<void> {
  await apiPut<{ message: string; event_id: number }>(
    `/candidates/${candidateId}/comments/${eventId}`,
    { content: content.trim() }
  );
}

/** Создать задачу по кандидату (отображается в ленте событий). */
export async function createCandidateTask(
  candidateId: number,
  payload: { content: string; assignee_name?: string | null; scheduled_at?: string | null }
): Promise<{ event_id: number }> {
  const body: Record<string, string> = { content: payload.content.trim() };
  if (payload.assignee_name != null && payload.assignee_name !== '') {
    body.assignee_name = payload.assignee_name;
  }
  if (payload.scheduled_at != null && payload.scheduled_at !== '') {
    body.scheduled_at = payload.scheduled_at;
  }
  const response = await apiPost<{ message: string; event_id: number }>(
    `/candidates/${candidateId}/tasks`,
    body
  );
  return { event_id: response.data?.event_id ?? 0 };
}

/** Удалить задачу (событие типа task) по кандидату. */
export async function deleteCandidateTask(
  candidateId: number,
  eventId: number
): Promise<void> {
  await apiDelete(`/candidates/${candidateId}/tasks/${eventId}`);
}

/** Обновить задачу по кандидату. */
export async function updateCandidateTask(
  candidateId: number,
  eventId: number,
  payload: { content: string; assignee_name?: string | null; scheduled_at?: string | null }
): Promise<void> {
  const body: Record<string, string> = { content: payload.content.trim() };
  if (payload.assignee_name != null && payload.assignee_name !== '') {
    body.assignee_name = payload.assignee_name;
  }
  if (payload.scheduled_at != null && payload.scheduled_at !== '') {
    body.scheduled_at = payload.scheduled_at;
  }
  await apiPut<{ message: string; event_id: number }>(
    `/candidates/${candidateId}/tasks/${eventId}`,
    body
  );
}

/** Отметить задачу как выполненную. */
export async function completeCandidateTask(
  candidateId: number,
  eventId: number
): Promise<void> {
  await apiPost<{ message: string; event_id: number }>(
    `/candidates/${candidateId}/tasks/${eventId}/complete`,
    {}
  );
}

/** Прикрепить кандидата к ещё одной вакансии (кандидат остаётся в текущей). */
export async function attachCandidateToVacancy(
  candidateId: number,
  vacancyId: number
): Promise<void> {
  await apiPost<null>(`/candidates/${candidateId}/attach-vacancy`, {
    vacancy_id: vacancyId,
  });
}

export async function getCandidatesByVacancy(vacancyId: number, page = 1) {
  try {
    const response = await apiGet<ApiCandidatesResponse['data']>(
      '/candidates',
      {
        page,
        vacancy: vacancyId, // или filters[vacancy]=vacancyId
      }
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
    console.error('Ошибка при получении кандидатов по вакансии:', error);
    return {
      candidates: [],
      pagination: { total: 0, currentPage: 1, lastPage: 1, perPage: 15 },
    };
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
