export interface AuthTokens {
  config: ReturnType<typeof useRuntimeConfig>;
  serverToken: string;
  userToken: string;
}

// Общий тип для результата API запросов HeadHunter с поддержкой дополнительных свойств
export type ApiHhResult = {
  data: any;
  error: string | null;
  [key: string]: any; // Индексная сигнатура для дополнительных свойств
};

export function getAuthTokens(): AuthTokens | null {
  const config = useRuntimeConfig();
  const serverTokenCookie = useCookie('auth_token');
  const userTokenCookie = useCookie('auth_user');

  const serverToken = serverTokenCookie.value;
  const userToken = userTokenCookie.value;

  if (!serverToken || !userToken) {
    if (!serverToken) console.error('Токен сервера не найден в cookie');
    if (!userToken) console.error('Токен пользователя не найден в cookie');
    return null;
  }

  return { config, serverToken, userToken };
}

export function clearAuthTokens(): void {
  const serverTokenCookie = useCookie('auth_token');
  const userTokenCookie = useCookie('auth_user');
  serverTokenCookie.value = null;
  userTokenCookie.value = null;
}

export function createAuthHeaders(serverToken: string, userToken: string) {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${serverToken}`,
    'X-Auth-User': userToken,
  };
}

/**
 * Ошибки $fetch/ofetch: statusCode + data. Старый код ожидал axios (response.status / _data).
 */
export function getFetchErrorMeta(err: unknown): {
  status: number | undefined;
  body: unknown;
  message: string | undefined;
} {
  if (!err || typeof err !== 'object') {
    return { status: undefined, body: undefined, message: undefined };
  }
  const e = err as Record<string, unknown>;
  let status: number | undefined;
  if (typeof e.statusCode === 'number') {
    status = e.statusCode;
  } else {
    const res = e.response as { status?: number } | undefined;
    if (res && typeof res.status === 'number') status = res.status;
  }
  const body =
    e.data !== undefined
      ? e.data
      : (e.response as { _data?: unknown } | undefined)?._data;
  let message: string | undefined;
  if (body && typeof body === 'object' && body !== null && 'message' in body) {
    const m = (body as Record<string, unknown>).message;
    if (typeof m === 'string') message = m;
  }
  return { status, body, message };
}

export function handle401Error(showAlert = false) {
  clearAuthTokens();

  if (showAlert) {
    alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
  }

  navigateTo('/auth');
}

// export function createApiResult<T>(dataField: string = 'data') {
//   return ref<{ [key: string]: T | string | null }>({
//     [dataField]: null,
//     error: null
//   });
// }
