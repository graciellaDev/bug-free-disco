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
    CandidatePlatformMessage,
    CandidateChatPlatform,
    ActivityFeedApiFilters,
    ActivityFeedItem,
    ActivityFeedMeta,
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

export async function detachCandidateTag(
    candidateId: number,
    tagId: number
): Promise<void> {
    await apiDelete(`/candidates/${candidateId}/tags/${tagId}`);
}

export async function deleteCandidate(id: number): Promise<void> {
    await apiDelete(`/candidates/${id}`);
}

/**
 * Скачать PDF резюме через бэкенд (HH с токеном сервера).
 */
export async function downloadCandidateResume(candidateId: number): Promise<void> {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    if (!authToken || !authUser) {
        throw new Error('Не авторизован');
    }
    const url = `${config.public.apiBase}/candidates/${candidateId}/download-resume`;
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${authToken}`,
            'X-Auth-User': authUser,
            Accept: 'application/pdf, application/json',
        },
    });
    if (!res.ok) {
        let msg = 'Не удалось скачать резюме';
        try {
            const j = (await res.json()) as { message?: string };
            if (j?.message) msg = j.message;
        } catch {
            /* тело не JSON */
        }
        throw new Error(msg);
    }
    const blob = await res.blob();
    let filename = `resume-${candidateId}.pdf`;
    const cd = res.headers.get('Content-Disposition');
    if (cd) {
        const utf = /filename\*=UTF-8''([^;]+)/i.exec(cd);
        const quoted = /filename="([^"]+)"/i.exec(cd);
        const plain = /filename=([^;\s]+)/i.exec(cd);
        const raw = utf?.[1] ?? quoted?.[1] ?? plain?.[1];
        if (raw) {
            try {
                filename = decodeURIComponent(raw.replace(/^"|"$/g, ''));
            } catch {
                filename = raw.replace(/^"|"$/g, '');
            }
        }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60_000);
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
    candidateId: number,
    opts?: { signal?: AbortSignal }
): Promise<CandidateConsideration[]> {
    const response = await apiGet<CandidateConsideration[]>(
        `/candidates/${candidateId}/considerations`,
        undefined,
        { signal: opts?.signal }
    );
    return Array.isArray(response.data) ? response.data : [];
}

/** События по кандидату (лог: создание резюме, смена этапа, изменение полей и т.д.). При указании vacancyId — события в контексте вакансии. */
export async function getCandidateEvents(
    candidateId: number,
    vacancyId?: number | null,
    opts?: { signal?: AbortSignal }
): Promise<CandidateEvent[]> {
    const url =
        vacancyId != null
            ? `/candidates/${candidateId}/vacancies/${vacancyId}/events`
            : `/candidates/${candidateId}/events`;
    const response = await apiGet<CandidateEvent[]>(url, undefined, {
        signal: opts?.signal,
    });
    return Array.isArray(response.data) ? response.data : [];
}

function normalizePlatformMessage(raw: Record<string, unknown>): CandidatePlatformMessage {
    const text =
        typeof raw.body === 'string'
            ? raw.body
            : typeof raw.content === 'string'
                ? raw.content
                : typeof raw.text === 'string'
                    ? raw.text
                    : '';
    const createdAt =
        typeof raw.created_at === 'string'
            ? raw.created_at
            : typeof raw.createdAt === 'string'
                ? raw.createdAt
                : new Date().toISOString();
    return {
        id: raw.id ?? createdAt,
        body: text,
        created_at: createdAt,
        direction: typeof raw.direction === 'string' ? raw.direction : (raw.direction as string | null) ?? null,
        author_name:
            typeof raw.author_name === 'string'
                ? raw.author_name
                : typeof raw.authorName === 'string'
                    ? raw.authorName
                    : null,
        platform: typeof raw.platform === 'string' ? raw.platform : null,
    };
}

function candidateMessagesPath(platform: CandidateChatPlatform, candidateId: number): string {
    const prefixMap: Record<CandidateChatPlatform, string> = {
        hh: 'hh',
        superjob: 'superjob',
        avito: 'avito',
        rabota: 'rabota',
    };
    return `/${prefixMap[platform]}/candidates/${candidateId}/messages`;
}

/** Сообщения чата hh.ru / SuperJob: GET /{hh|superjob}/candidates/{id}/messages */
export async function getCandidateMessages(
    candidateId: number,
    opts?: { signal?: AbortSignal; platform?: CandidateChatPlatform }
): Promise<CandidatePlatformMessage[]> {
    const platform = opts?.platform ?? 'hh';
    const response = await apiGet<unknown | CandidatePlatformMessage[]>(
        candidateMessagesPath(platform, candidateId),
        undefined,
        { signal: opts?.signal }
    );
    const d = response.data as unknown;
    if (Array.isArray(d)) {
        return d.map((item) =>
            normalizePlatformMessage(
                item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
            )
        );
    }
    if (d && typeof d === 'object') {
        const o = d as Record<string, unknown>;
        const arr = o.messages ?? o.items ?? o.data;
        if (Array.isArray(arr)) {
            return arr.map((item) =>
                normalizePlatformMessage(
                    item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
                )
            );
        }
    }
    return [];
}

/**
 * Отправить сообщение кандидату в чат (hh.ru или SuperJob).
 * POST /{hh|superjob}/candidates/{id}/messages
 */
export async function sendCandidateChatMessage(
    candidateId: number,
    payload: {
        content: string;
        vacancy_id?: number | null;
        platform?: CandidateChatPlatform;
    }
): Promise<void> {
    const text = payload.content.trim();
    if (!text) return;
    const platform = payload.platform ?? 'hh';
    const body: Record<string, unknown> = { content: text };
    if (payload.vacancy_id != null) {
        body.vacancy_id = payload.vacancy_id;
    }
    await apiPost<unknown>(candidateMessagesPath(platform, candidateId), body);
}

/** Общая лента событий по всем кандидатам заказчика (страница «Лента активности»). */
export async function getActivityFeed(opts?: {
    page?: number;
    per_page?: number;
    filters?: Partial<ActivityFeedApiFilters>;
    signal?: AbortSignal;
}): Promise<{ items: ActivityFeedItem[]; meta: ActivityFeedMeta }> {
    const query: Record<string, string | number> = {
        page: opts?.page ?? 1,
        per_page: opts?.per_page ?? 100,
    };
    const f = opts?.filters;
    if (f?.occurred_from) query.occurred_from = f.occurred_from;
    if (f?.occurred_to) query.occurred_to = f.occurred_to;
    if (f?.author) query.author = f.author;
    if (f?.entity) query.entity = f.entity;
    if (f?.kinds) query.kinds = f.kinds;
    if (f?.value_before) query.value_before = f.value_before;
    if (f?.value_after) query.value_after = f.value_after;
    if (f?.vacancy_ids && f.vacancy_ids.length > 0) {
        query.vacancy_ids = f.vacancy_ids;
    } else if (f?.vacancy_id != null && f.vacancy_id > 0) {
        query.vacancy_id = f.vacancy_id;
    }

    const response = await apiGet<{ items: ActivityFeedItem[]; meta: ActivityFeedMeta }>(
        '/activity/events',
        query,
        { signal: opts?.signal }
    );
    const raw = response.data;
    return {
        items: Array.isArray(raw?.items) ? raw.items : [],
        meta: raw?.meta ?? {
            current_page: 1,
            last_page: 1,
            per_page: 100,
            total: 0,
        },
    };
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

/** Число кандидатов по вакансии и (опционально) внешнему id публикации на площадке */
export async function getPublicationResponsesCount(
    vacancyId: number,
    platformPublicationId?: string | null
): Promise<number> {
    try {
        const query: Record<string, string | number> = { vacancy_id: vacancyId };
        if (platformPublicationId != null && String(platformPublicationId).trim() !== '') {
            query.platform_publication_id = String(platformPublicationId).trim();
        }
        const response = await apiGet<{ count: number }>(
            '/candidates/publication-responses-count',
            query,
            { skipLoader: true }
        );
        return Number(response.data?.count) || 0;
    } catch (error) {
        console.error('Ошибка при подсчёте откликов по публикации:', error);
        return 0;
    }
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