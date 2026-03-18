import { createAuthHeaders, getAuthTokens, handle401Error } from '@/helpers/authToken';

/**
 * Получить URL для перенаправления на авторизацию Yandex.
 * После вызова: window.location.href = response.url
 */
export async function getYandexAuthUrl(email?: string): Promise<{ url: string | null; error: string | null }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { url: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    const params = new URLSearchParams();
    if (email?.trim()) params.set('email', email.trim());
    const query = params.toString();
    const path = `/yandex/auth${query ? `?${query}` : ''}`;
    const response = await $fetch<{ message: string; url_auth: string | null }>(path, {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });
    if (response?.url_auth) {
      return { url: response.url_auth, error: null };
    }
    return { url: null, error: response?.message || 'Не получен URL авторизации' };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
      return { url: null, error: 'Требуется повторная авторизация' };
    }
    const msg = err.response?._data?.message || err.message || 'Ошибка при получении ссылки на авторизацию';
    return { url: null, error: msg };
  }
}
