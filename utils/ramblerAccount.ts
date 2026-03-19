import { createAuthHeaders, getAuthTokens, handle401Error } from '@/helpers/authToken';

/**
 * Подключить Rambler по логину и паролю (SMTP).
 */
export async function connectRambler(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { ok: false, message: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    await $fetch<{ message: string }>('/rambler/connect', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        ...createAuthHeaders(serverToken, userToken),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: { email: email.trim(), password },
    });
    return { ok: true, message: 'Почта Rambler подключена.' };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
      return { ok: false, message: 'Требуется повторная авторизация' };
    }
    const msg =
      err.response?._data?.message ||
      err.data?.message ||
      err.message ||
      'Не удалось подключить почту';
    return { ok: false, message: typeof msg === 'string' ? msg : 'Ошибка подключения' };
  }
}
