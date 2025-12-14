import type { ApiSuccessResponse, ApiErrorResponse } from '~/types/clients';

// Тип для опций запроса
type ApiRequestOptions<T> = Omit<
  Parameters<typeof $fetch<T>>[1],
  'headers' | 'baseURL'
> & {
  skipAuth?: boolean; // Если надо пропустить авторизацию
  customHeaders?: Record<string, string>;
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

      alert(message);
      useRouter().replace('/auth');
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
  const config = useRuntimeConfig();
  const authToken = useCookie('auth_token').value;
  const authUser = useCookie('auth_user').value;

  // Формирование заголовков запроса
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.customHeaders,
  };

  // Добавление авторизации, если не пропущена
  if (!options.skipAuth) {
    if (!authToken || !authUser) {
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
      `${config.public.apiBase}${endpoint}`,
      {
        ...options,
        headers,
      }
    );

    return response;
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
