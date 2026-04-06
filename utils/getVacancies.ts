import { useUserStore } from '@/stores/user';

interface VacancyResponse {
  data: {
    data: any[];
  };
}

interface UpdateVacancyData {
    name?: string | null;
    description?: string | null;
    code?: string | null;
    specializations?: string | null;
    industry?: string | null;
    employment?: string | null;
    schedule?: string | null;
    experience?: string | null;
    education?: string | null;
    drivers?: any;
    salary_from?: string | null;
    salary_to?: string | null;
    salary_type?: string | null;
    currency?: string | null;
    place?: string | null;
    location?: string | null;
    status?: 'active' | 'draft' | 'closed' | 'archive' | null;
    executor_id?: number | null;
    executor_name?: string | null;
    executor_phone?: string | null;
    executor_email?: string | null;
    show_executor?: boolean | null;
    role_id?: number | null;
    customer_role?: number | null;
}

export const getVacancies = async (params: any = '') => {
  const config = useRuntimeConfig();

  // Токен сервера из cookie
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  if (!serverToken) {
    console.error('Токен сервера не найден в cookie');
    return null;
  }

  // Токен пользователя из cookie
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!userToken) {
    console.error('Токен пользователя не найден в cookie');
    return null;
  }

  try {
    const response = await $fetch<VacancyResponse>(
      '/vacancies' + `?${params}`,
      {
        method: 'GET',
        baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken, // Новый заголовок
        },
      }
    );

    return response?.data?.data || null;
  } catch (err: any) {
    console.error('Ошибка при запросе:', err);
    if (err.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();

      serverTokenCookie.value = null; // Удаляем просроченный токен сервера
      userTokenCookie.value = null; // Удаляем просроченный токен пользователя
      // Middleware сработает автоматически при следующем роутинге
      alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
      navigateTo('/auth');
    }
    return null;
  }
};

/** Список уникальных городов по вакансиям аккаунта (для фильтра на странице вакансий). */
export const getVacancyCities = async (): Promise<string[] | null> => {
  const config = useRuntimeConfig();
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!serverToken || !userToken) return null;
  try {
    const response = await $fetch<{ data?: string[] }>('/vacancies/cities', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });
    return Array.isArray(response?.data) ? response.data : null;
  } catch (err: any) {
    console.error('Ошибка при получении списка городов вакансий:', err);
    return null;
  }
};

export const getVacancy = async (id: String) => {
  const config = useRuntimeConfig();


  // Токен сервера из cookie
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  if (!serverToken) {
    console.error('Токен сервера не найден в cookie');
    return null;
  }

  // Токен пользователя из cookie
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!userToken) {
    console.error('Токен пользователя не найден в cookie');
    return null;
  }

  try {
    const response: any = await $fetch<VacancyResponse>(`/vacancies/${id}`, {
      method: 'GET',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken, // Новый заголовок
      },
    });

    return response ? response.data : null;
    // return response ? JSON.parse(response).data : null;
  } catch (err: any) {
    console.error('Ошибка при запросе:', err);
    if (err.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();

      serverTokenCookie.value = null; // Удаляем просроченный токен сервера
      userTokenCookie.value = null; // Удаляем просроченный токен пользователя
      // Middleware сработает автоматически при следующем роутинге
      alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
      navigateTo('/auth');
    }
    return null;
  }
};

export interface HhPublicationOriginalApiData {
  hh_vacancy_id: string;
  synced_at: string | null;
  original: Record<string, unknown>;
  payload_original?: Record<string, unknown> | null;
}

/**
 * Снимок полей публикации hh.ru (hh_vacancy_originals + hh_vacancy_original_fields), ключи в `original` с суффиксом _original.
 * @param refresh — query refresh=1, повторный запрос к api.hh.ru
 */
export const getHhPublicationOriginal = async (
  vacancyId: string | number,
  refresh = false
): Promise<{ data: HhPublicationOriginalApiData | null; error: string | null }> => {
  const config = useRuntimeConfig();
  const serverTokenCookie = useCookie('auth_token');
  const userTokenCookie = useCookie('auth_user');
  const serverToken = serverTokenCookie.value;
  const userToken = userTokenCookie.value;
  if (!serverToken || !userToken) {
    return { data: null, error: 'Нет токена авторизации' };
  }
  const q = refresh ? '?refresh=1' : '';
  try {
    const response = await $fetch<{
      message?: string;
      data?: HhPublicationOriginalApiData;
    }>(`/vacancies/${vacancyId}/hh-publication-original${q}`, {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });
    return { data: response?.data ?? null, error: null };
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; response?: { status?: number; _data?: { message?: string } } };
    const msg =
      e?.data?.message ||
      e?.response?._data?.message ||
      (err instanceof Error ? err.message : 'Ошибка загрузки данных hh.ru');
    if (e?.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();
      serverTokenCookie.value = null;
      userTokenCookie.value = null;
      navigateTo('/auth');
    }
    return { data: null, error: typeof msg === 'string' ? msg : 'Ошибка загрузки данных hh.ru' };
  }
};

/**
 * Сохранить черновик полей вакансии на hh.ru (PUT api.hh.ru/vacancies/{id}) и обновить снимок в БД.
 */
export const putHhPublicationOriginal = async (
  vacancyId: string | number,
  payload: Record<string, unknown>
): Promise<{
  data: HhPublicationOriginalApiData | null;
  error: string | null;
  errors?: unknown;
}> => {
  const config = useRuntimeConfig();
  const serverTokenCookie = useCookie('auth_token');
  const userTokenCookie = useCookie('auth_user');
  const serverToken = serverTokenCookie.value;
  const userToken = userTokenCookie.value;
  if (!serverToken || !userToken) {
    return { data: null, error: 'Нет токена авторизации' };
  }
  try {
    const response = await $fetch<{
      message?: string;
      data?: HhPublicationOriginalApiData;
      errors?: unknown;
    }>(`/vacancies/${vacancyId}/hh-publication-original`, {
      method: 'PUT',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { payload },
    });
    return { data: response?.data ?? null, error: null };
  } catch (err: unknown) {
    const e = err as {
      data?: { message?: string; errors?: unknown };
      response?: { status?: number; _data?: { message?: string; errors?: unknown } };
    };
    const body = e?.data ?? e?.response?._data;
    const msg =
      body?.message ||
      (err instanceof Error ? err.message : 'Ошибка сохранения на hh.ru');
    if (e?.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();
      serverTokenCookie.value = null;
      userTokenCookie.value = null;
      navigateTo('/auth');
    }
    return {
      data: null,
      error: typeof msg === 'string' ? msg : 'Ошибка сохранения на hh.ru',
      errors: body?.errors,
    };
  }
};

export const getVacanciesNames = async () => {
  const vacancies: any = await getVacancies();
  return (
    vacancies?.map((vacancy: string | number, key: keyof any) => {
      (vacancy as any)['name'] = (vacancy as any)['title'];

      return vacancy;
    }) || []
  );
};

export const updateVacancy = async (id: string | number, data: UpdateVacancyData) => {
    const config = useRuntimeConfig();

    // Токен сервера из cookie
    const serverTokenCookie = useCookie('auth_token');
    const serverToken = serverTokenCookie.value;
    if (!serverToken) {
        console.error('Токен сервера не найден в cookie');
        return { data: null, error: 'Токен сервера не найден' };
    }

    // Токен пользователя из cookie
    const userTokenCookie = useCookie('auth_user');
    const userToken = userTokenCookie.value;
    if (!userToken) {
        console.error('Токен пользователя не найден в cookie');
        return { data: null, error: 'Токен пользователя не найден' };
    }

    const params = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            params.append(key, String(value));
        }
    });
    // POST нужен, чтобы PHP разбирал тело запроса; Laravel воспринимает как PUT по _method
    params.append('_method', 'PUT');

    try {
        const response = await $fetch(`/vacancies/${id}`, {
            method: 'POST',
            baseURL: config.public.apiBase as string,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${serverToken}`,
                'X-Auth-User': userToken,
            },
            body: params.toString(),
        });

        return { data: response || null, error: null };
    } catch (err: any) {
        console.error('Ошибка при обновлении вакансии:', err);

        const status = err.response?.status ?? err.statusCode ?? err.status;
        const body = err.data ?? err.response?.data ?? err.response?._data;

        if (status === 401) {
            const userStore = useUserStore();
            userStore.clearUserData();

            serverTokenCookie.value = null;
            userTokenCookie.value = null;
            alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
            navigateTo('/auth');
            return { data: null, error: 'Срок сессии истек. Пожалуйста, авторизуйтесь снова.' };
        }

        if (status === 422) {
            const validationErrors = body?.errors || body?.message;
            return { data: null, error: validationErrors || 'Ошибка валидации данных' };
        }

        const msg = body?.message ?? body?.error ?? 'Ошибка при обновлении вакансии';
        return { data: null, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
    }
};

export const getPhrases = async () => {
  const config = useRuntimeConfig();

  // Токен сервера из cookie
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  if (!serverToken) {
    console.error('Токен сервера не найден в cookie');
    return null;
  }

  // Токен пользователя из cookie
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!userToken) {
    console.error('Токен пользователя не найден в cookie');
    return null;
  }

  try {
    const response = await $fetch<VacancyResponse>('/phrases', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    return { data: response?.data || null, error: null };
  } catch (err: any) {
    console.error('Ошибка при запросе:', err);
    if (err.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();

      serverTokenCookie.value = null;
      userTokenCookie.value = null;
      // Middleware сработает автоматически при следующем роутинге
      alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
      navigateTo('/auth');
    }
    return {
      data: null,
      error: 'Срок сессии истек. Пожалуйста, авторизуйтесь снова.',
    };
  }
};

/**
 * Создание фразы через API (POST /api/phrases/s). Body: name (3–50 символов).
 */
export const createPhrase = async (name: string): Promise<{ data: { id: number; name: string } | null; error: string | null }> => {
  const config = useRuntimeConfig();
  const serverToken = useCookie('auth_token').value;
  const userToken = useCookie('auth_user').value;
  if (!serverToken || !userToken) {
    return { data: null, error: 'Токен не найден' };
  }
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed.length < 3 || trimmed.length > 50) {
    return { data: null, error: 'Имя фразы должно быть от 3 до 50 символов' };
  }
  try {
    const response = await $fetch<{ data?: { id: number; name: string }; message?: string }>('/phrases/s', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { name: trimmed },
    });
    const data = response?.data ?? (response as any)?.data;
    return { data: data ?? null, error: null };
  } catch (err: any) {
    if (err?.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();
      useCookie('auth_token').value = null;
      useCookie('auth_user').value = null;
    }
    const msg = err?.response?.data?.message ?? err?.message ?? 'Ошибка создания фразы';
    return { data: null, error: msg };
  }
};

/**
 * Преобразует строку с названиями фраз (через запятую) в массив id фраз нашей БД:
 * GET /api/phrases — поиск по имени; при отсутствии — POST /api/phrases/s (name 3–50 символов).
 * Используется при импорте вакансий (например с SuperJob), чтобы навыки сохранялись как сущности phrases.
 */
export const resolvePhraseNamesToIds = async (phraseNamesStr: string): Promise<number[]> => {
  if (!phraseNamesStr || typeof phraseNamesStr !== 'string') return [];
  const names = phraseNamesStr
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && s.length <= 50);
  if (names.length === 0) return [];

  const { data: phrasesList } = await getPhrases();
  const list = Array.isArray(phrasesList) ? phrasesList : (phrasesList && (phrasesList as any).data) ? (phrasesList as any).data : [];
  const byName = new Map<string, { id: number }>();
  (list || []).forEach((p: any) => {
    const n = (p?.name ?? p?.title ?? '').trim();
    if (n && p?.id != null) byName.set(n.toLowerCase(), { id: Number(p.id) });
  });

  const ids: number[] = [];
  for (const name of names) {
    const existing = byName.get(name.toLowerCase());
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const { data: created, error } = await createPhrase(name);
    if (created?.id != null) {
      ids.push(Number(created.id));
      byName.set(name.toLowerCase(), { id: created.id });
    }
  }
  return ids;
};

/**
 * Справочники для формы вакансии (GET /api/vacancy-fields). data.drivers — id => name или массив { id, name }.
 */
export const getVacancyFields = async (): Promise<{ data?: { drivers?: Record<number, string> | Array<{ id: number; name?: string }> }; error?: string } | null> => {
  const config = useRuntimeConfig();
  const serverToken = useCookie('auth_token').value;
  const userToken = useCookie('auth_user').value;
  if (!serverToken || !userToken) return null;
  try {
    const response = await $fetch<{ data?: any }>('/vacancy-fields', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });
    const data = response?.data ?? response;
    return { data: data ?? undefined };
  } catch (err: any) {
    if (err?.response?.status === 401) {
      useUserStore().clearUserData();
      useCookie('auth_token').value = null;
      useCookie('auth_user').value = null;
    }
    return { data: undefined, error: err?.message ?? 'Ошибка загрузки справочников' };
  }
};

/**
 * Строит мапу название категории прав (A, B, C, D, E и т.д.) → id в нашей БД (число).
 * drivers из vacancy-fields: объект { 1: "A", 2: "B" } или массив [{ id: 1, name: "A" }].
 * Для совместимости с SuperJob (только A, B, C, D, E) добавляется маппинг по одной букве:
 * если в справочнике name = "Категория A" или "A", то по запросу "A" будет найден id.
 */
export function buildDriverNameToDbIdMap(drivers: Record<number, string> | Array<{ id: number; name?: string }> | undefined): Map<string, number> {
  const map = new Map<string, number>();
  if (!drivers) return map;
  const addEntry = (nameNorm: string, id: number) => {
    if (!nameNorm || isNaN(id)) return;
    map.set(nameNorm, id);
    // Чтобы SuperJob-категории A, B, C, D, E всегда находились: из "Категория A" извлекаем букву A
    const singleLetter = nameNorm.length === 1 && /^[A-E]$/.test(nameNorm)
      ? nameNorm
      : (nameNorm.match(/\b([A-E])\b/) ?? [null, null])[1];
    if (singleLetter) map.set(singleLetter, id);
  };
  if (Array.isArray(drivers)) {
    drivers.forEach((item) => {
      const name = (item.name ?? String(item.id ?? '')).trim().toUpperCase();
      if (name && item.id != null) addEntry(name, Number(item.id));
    });
  } else if (typeof drivers === 'object') {
    Object.entries(drivers).forEach(([idStr, name]) => {
      const nameNorm = String(name ?? '').trim().toUpperCase();
      const id = Number(idStr);
      if (nameNorm && !isNaN(id)) addEntry(nameNorm, id);
    });
  }
  return map;
}

/**
 * Строит мапу id категории прав в нашей БД (число) → название (A, B, BE…).
 * Нужна для отправки на SuperJob (driving_licence: ['A','B']), когда в форме хранятся числовые id.
 */
export function buildDriverDbIdToNameMap(drivers: Record<number, string> | Array<{ id: number; name?: string }> | undefined): Map<number, string> {
  const map = new Map<number, string>();
  if (!drivers) return map;
  if (Array.isArray(drivers)) {
    drivers.forEach((item) => {
      const name = (item.name ?? String(item.id ?? '')).trim().toUpperCase();
      if (name && item.id != null) map.set(Number(item.id), name);
    });
  } else if (typeof drivers === 'object') {
    Object.entries(drivers).forEach(([idStr, name]) => {
      const nameNorm = String(name ?? '').trim().toUpperCase();
      const id = Number(idStr);
      if (nameNorm && !isNaN(id)) map.set(id, nameNorm);
    });
  }
  return map;
}

/**
 * Преобразует drivers с названиями категорий (из импорта SuperJob) в массив { id: number } для нашей БД.
 * Если справочник не загружен или категория не найдена, элемент пропускается.
 */
export async function resolveDriverNamesToDbIds(
  driversWithNames: Array<{ id: string }>
): Promise<Array<{ id: number }>> {
  if (!driversWithNames?.length) return [];
  const fields = await getVacancyFields();
  const drivers = fields?.data?.drivers;
  const nameToId = buildDriverNameToDbIdMap(drivers);
  const result: Array<{ id: number }> = [];
  for (const d of driversWithNames) {
    const name = String(d.id ?? '').trim().toUpperCase();
    const dbId = nameToId.get(name);
    if (dbId != null) result.push({ id: dbId });
  }
  return result;
}

/** Сохранить просмотры и число импортированных откликов в vacancy_platform (быстрый показ после перезагрузки). */
export type PublicationStatsCacheItem = {
  vacancy_id: number;
  platform_id: number;
  views?: number | null;
  imported_responses?: number | null;
};

export async function postPublicationPlatformStatsCache(
  items: PublicationStatsCacheItem[]
): Promise<void> {
  if (!items.length) {
    return;
  }
  const config = useRuntimeConfig();
  const serverTokenCookie = useCookie('auth_token');
  const userTokenCookie = useCookie('auth_user');
  const serverToken = serverTokenCookie.value;
  const userToken = userTokenCookie.value;
  if (!serverToken || !userToken) {
    return;
  }
  await $fetch<{ message: string }>('/vacancies/publication-stats-cache', {
    method: 'POST',
    baseURL: config.public.apiBase as string,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serverToken}`,
      'X-Auth-User': userToken as string,
    },
    body: { items },
  });
}
