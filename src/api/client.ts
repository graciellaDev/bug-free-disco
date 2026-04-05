import type { ApiSuccessResponse, ApiErrorResponse } from '~/types/clients';

// Тип для опций запроса
type ApiRequestOptions<T> = Omit<
  Parameters<typeof $fetch<T>>[1],
  'headers' | 'baseURL'
> & {
  skipAuth?: boolean; // Если надо пропустить авторизацию
  customHeaders?: Record<string, string>;
  /** Отмена запроса (совместимо с $fetch). */
  signal?: AbortSignal;
  /**
   * По умолчанию true: не дергать глобальный лоадер из plugins/loader.ts на каждый запрос
   * (иначе при открытии карточки кандидата десятки параллельных вызовов блокируют UI).
   */
  skipLoader?: boolean;
};

type RuntimePublicConfig = {
  apiBase?: string;
};

let isAuthRedirecting = false;
let lastAuthNotifyAt = 0;

const getCookieValue = (name: string): string | null => {
  try {
    const value = useCookie<string | null>(name).value;
    if (value != null && value !== '') return value;
  } catch {
    // useCookie может быть недоступен вне setup/composable контекста
  }

  if (import.meta.client) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  return null;
};

const getApiBase = (): string => {
  try {
    const config = useRuntimeConfig();
    if (config?.public?.apiBase) {
      return config.public.apiBase;
    }
  } catch {
    // useRuntimeConfig может быть недоступен вне setup/composable контекста
  }

  if (import.meta.client) {
    const runtime = (window as unknown as { __NUXT__?: { config?: { public?: RuntimePublicConfig } } })
      .__NUXT__;
    if (runtime?.config?.public?.apiBase) {
      return runtime.config.public.apiBase;
    }
  }

  return '/api';
};

const redirectToAuth = () => {
  if (isAuthRedirecting) return;
  isAuthRedirecting = true;
  try {
    const router = useRouter();
    void router.replace('/auth');
    return;
  } catch {
    // useRouter может быть недоступен вне setup/composable контекста
  }

  if (import.meta.client) {
    window.location.href = '/auth';
  }
};

const notifyAuthError = (message: string) => {
  if (!import.meta.client) return;
  const now = Date.now();
  if (now - lastAuthNotifyAt < 5000) return;
  lastAuthNotifyAt = now;
  alert(message);
};

// Универсальная обработка ошибок API
async function handleApiError(error: unknown): Promise<void> {
  if (error && typeof error === 'object' && 'response' in error) {
    const fetchError = error as {
      response?: {
        status?: number;
        _data?:
          | ApiErrorResponse
          | { message?: string; errors?: Record<string, string[]> };
      };
    };

    const status = fetchError.response?.status;
    const errorData = fetchError.response?._data;

    // Если пользователь неавторизован
    if (status === 401) {
      const message =
        (errorData && typeof errorData === 'object' && 'message' in errorData
          ? (errorData as ApiErrorResponse).message
          : null) || 'Ваша сессия истекла! Пожалуйста, авторизуйтесь снова.';

      notifyAuthError(message);
      redirectToAuth();
      return;
    }

    // Логирование других ошибок
    if (errorData && typeof errorData === 'object' && 'message' in errorData) {
      const apiError = errorData as ApiErrorResponse;
      console.error('Ошибка API:', apiError.message);
    } else {
      console.error('Ошибка API:', error);
    }
  } else {
    console.error('Неизвестная ошибка:', error);
  }
}

// Универсальная функция для API запросов (GET, POST, PUT, DELETE)
export async function apiFetch<T>(
  endpoint: string,
  options: ApiRequestOptions<ApiSuccessResponse<T>> = {}
): Promise<ApiSuccessResponse<T>> {
  const apiBase = getApiBase();
  const authToken = getCookieValue('auth_token');
  const authUser = getCookieValue('auth_user');

  const {
    skipAuth,
    customHeaders,
    skipLoader = true,
    ...fetchOptions
  } = options as ApiRequestOptions<ApiSuccessResponse<T>>;

  // Формирование заголовков запроса
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  // Добавление авторизации, если не пропущена
  if (!skipAuth) {
    if (!authToken || !authUser) {
      notifyAuthError('Ваша сессия истекла! Пожалуйста, авторизуйтесь снова.');
      redirectToAuth();
      throw createError({
        statusCode: 401,
        statusMessage: 'Токены авторизации отсутствуют',
      });
    }
    headers.Authorization = `Bearer ${authToken}`;
    headers['X-Auth-User'] = authUser;
  }

  try {
    const response = await $fetch<ApiSuccessResponse<T>>(
      `${apiBase}${endpoint}`,
      {
        ...fetchOptions,
        headers,
        skipLoader,
      }
    );
    const parsedResponse =
      typeof response === 'string' ? JSON.parse(response) : response;

    return parsedResponse as ApiSuccessResponse<T>;
  } catch (error: unknown) {
    await handleApiError(error);
    throw error;
  }
}

// Вспомогательная функция для GET запросов (получение данных)
export async function apiGet<T>(
  endpoint: string,
  query?: Record<string, any>,
  options?: Partial<ApiRequestOptions<ApiSuccessResponse<T>>>
): Promise<ApiSuccessResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'GET',
    query,
  } as ApiRequestOptions<ApiSuccessResponse<T>>);
}

// Вспомогательная функция для POST запросов (создание данных)
export async function apiPost<T, B = any>(
  endpoint: string,
  body?: B,
  options?: Partial<ApiRequestOptions<ApiSuccessResponse<T>>>
): Promise<ApiSuccessResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'POST',
    body,
  } as ApiRequestOptions<ApiSuccessResponse<T>>);
}

// Вспомогательная функция для PUT запросов (обновление данных)
export async function apiPut<T, B = any>(
  endpoint: string,
  body?: B,
  options?: Partial<ApiRequestOptions<ApiSuccessResponse<T>>>
): Promise<ApiSuccessResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PUT',
    body,
  } as ApiRequestOptions<ApiSuccessResponse<T>>);
}

// Вспомогательная функция для PATCH запросов
export async function apiPatch<T, B = any>(
  endpoint: string,
  body?: B,
  options?: Partial<ApiRequestOptions<ApiSuccessResponse<T>>>
): Promise<ApiSuccessResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body,
  } as ApiRequestOptions<ApiSuccessResponse<T>>);
}

// Вспомогательная функция для DELETE запросов (удаление данных)
export async function apiDelete<T>(
  endpoint: string,
  options?: Partial<ApiRequestOptions<ApiSuccessResponse<T>>>
): Promise<ApiSuccessResponse<T>> {
  return apiFetch<T>(endpoint, {
    ...options,
    method: 'DELETE',
  } as ApiRequestOptions<ApiSuccessResponse<T>>);
}
