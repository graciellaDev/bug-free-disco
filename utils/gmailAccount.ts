import { createAuthHeaders, getAuthTokens, handle401Error } from '@/helpers/authToken';

export interface GmailAuthResponse {
  message: string;
  url_auth: string | null;
}

export interface ConnectedEmailItem {
  id: number;
  provider: string;
  provider_name: string;
  email: string | null;
  status: 'connected' | 'expired';
  status_label: string;
  allowed_customer_ids?: number[];
  allowed_employee_names?: string[];
  connected_at: string | null;
  updated_at: string | null;
}

/**
 * Список подключённых почтовых аккаунтов.
 * @param forSender — если true, возвращаются только ящики, в которых текущий пользователь назначен ответственным
 */
export async function getConnectedEmails(forSender = false): Promise<{ data: ConnectedEmailItem[]; error: string | null }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: [], error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    const query = forSender ? '?for_sender=1' : '';
    const response = await $fetch<{ data: ConnectedEmailItem[] }>(`/gmail/connected${query}`, {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });
    return { data: response?.data ?? [], error: null };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
      return { data: [], error: 'Требуется повторная авторизация' };
    }
    return { data: [], error: err.response?._data?.message || err.message || 'Ошибка загрузки' };
  }
}

/**
 * Список подключённых ящиков, доступных текущему пользователю для отправки (только назначенные).
 */
export async function getConnectedEmailsForSender(): Promise<{ data: ConnectedEmailItem[]; error: string | null }> {
  return getConnectedEmails(true);
}

/**
 * Обновить настройки подключённого ящика (ответственные, пароль для Yandex).
 */
export async function updateConnectedEmail(id: number, payload: { allowed_customer_ids: number[]; smtp_password?: string | null }): Promise<{ error: string | null }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    await $fetch(`/gmail/connected/${id}`, {
      method: 'PUT',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
      body: payload,
    });
    return { error: null };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
      return { error: 'Требуется повторная авторизация' };
    }
    return { error: err.response?._data?.message || err.message || 'Ошибка сохранения' };
  }
}

/**
 * Отключить почтовый аккаунт.
 */
export async function disconnectConnectedEmail(id: number): Promise<{ error: string | null }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    await $fetch(`/gmail/connected/${id}`, {
      method: 'DELETE',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });
    return { error: null };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
      return { error: 'Требуется повторная авторизация' };
    }
    return { error: err.response?._data?.message || err.message || 'Ошибка отключения' };
  }
}

/**
 * Получить URL для перенаправления на авторизацию Google (Gmail).
 * После вызова нужно выполнить: window.location.href = response.url_auth
 */
export async function getGmailAuthUrl(email?: string): Promise<{ url: string | null; error: string | null }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { url: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    const params = new URLSearchParams();
    if (email?.trim()) params.set('email', email.trim());
    const query = params.toString();
    const path = `/gmail/auth${query ? `?${query}` : ''}`;
    const response = await $fetch<GmailAuthResponse>(path, {
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
