import { getServerToken } from './getServerToken';

export const registerUser = async (userData: any) => {
    const result = await getServerToken();
    if (!result.token) {
        console.error('Token not found', result.error);
        return null;
    }
    const token = result.token;

    const config = useRuntimeConfig();

    try {
        console.log('Отправляемые данные для регистрации:', userData);

        const response = await $fetch('/register', {
            method: 'POST',
            baseURL: config.public.apiBase as string,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: userData,
        });

        console.log('Ответ сервера при регистрации:', response);
        return response;
    } catch (err: any) {
        console.error('Ошибка при регистрации:', err.message || err);
        if (err.response?.status === 422) {
            console.warn('422: Валидация не пройдена или пользователь уже существует.');
        }
        console.error('Детали ошибки:', err.response);
        return null;
    }
};

export const registerClient = async (path: string, userData: any) => {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    let error: boolean = false;

    try {
        let response = await $fetch(`/customer-with-roles/${path}`, {
            method: 'POST',
            baseURL: config.public.apiBase as string,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`
            },
            body: userData,
        });

    console.log('response', response.user);
        return {data: response.user, error: error, message: response.message};
    } catch (err: any) {
        const data = err?.data ?? err.response?._data ?? err.response?.data
        let message =
            typeof data?.message === 'string'
                ? data.message
                : null
        if (!message && data?.errors && typeof data.errors === 'object') {
            const firstKey = Object.keys(data.errors)[0]
            const firstMsg = firstKey ? data.errors[firstKey] : null
            message = Array.isArray(firstMsg) ? firstMsg[0] : (typeof firstMsg === 'string' ? firstMsg : null)
        }
        if (!message && err?.message) {
            message = err.message
        }
        if (process.dev && err) {
            console.warn('registerClient error:', err?.statusCode ?? err?.status, data, err?.message)
        }
        return {
            data: null,
            error: true,
            message: message || undefined,
        }
    }
};

/** Обновление данных сотрудника (телефон, роль, должность, отдел, город). */
export async function updateEmployee(id: number, payload: Record<string, unknown>) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    const body: Record<string, unknown> = {};
    const keys = ['name', 'email', 'phone', 'role_id', 'position', 'city', 'department'];
    for (const key of keys) {
        if (key !== 'id' && key in payload) {
            body[key] = payload[key];
        }
    }
    try {
        const response = await $fetch<{ message?: string; user?: unknown }>(
            `/customer-with-roles/employees/${id}`,
            {
                method: 'PUT',
                baseURL: config.public.apiBase as string,
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                    'X-Auth-User': `${authUser}`,
                },
                body,
            }
        );
        return { data: response?.user, error: false, message: response?.message };
    } catch (err: unknown) {
        const data = (err as { data?: { message?: string; errors?: unknown } })?.data;
        const message =
            typeof data?.message === 'string'
                ? data.message
                : (data?.errors && typeof data.errors === 'object'
                    ? String(Object.values(data.errors)[0]?.[0] ?? 'Ошибка обновления')
                    : 'Ошибка обновления');
        return { data: null, error: true, message };
    }
}

/** Удалить сотрудника из списка (убирает связь с текущим админом). */
export async function deleteEmployee(id: number) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    if (!authToken || !authUser) {
        return { error: true, message: 'Нет авторизации' };
    }
    try {
        await $fetch(`/customer-with-roles/employees/${id}`, {
            method: 'DELETE',
            baseURL: config.public.apiBase as string,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`,
            },
        });
        return { error: false };
    } catch (err: unknown) {
        const data = (err as { data?: { message?: string }; statusCode?: number })?.data;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        const message = typeof data?.message === 'string' ? data.message : 'Ошибка удаления';
        if (process.dev && (statusCode === 401 || statusCode === 404 || statusCode === 403)) {
            console.warn('deleteEmployee:', statusCode, message);
        }
        return { error: true, message };
    }
}

/** Смена пароля сотрудника (админ или свой админ). */
export async function changeEmployeePassword(
    id: number,
    payload: { password: string; password_confirmation: string }
) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    if (!authToken || !authUser) {
        return { error: true, message: 'Нет авторизации' };
    }
    try {
        await $fetch(`/customer-with-roles/employees/${id}/password`, {
            method: 'PUT',
            baseURL: config.public.apiBase as string,
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`,
            },
            body: payload,
        });
        return { error: false };
    } catch (err: unknown) {
        const data = (err as { data?: { message?: string; errors?: unknown } })?.data;
        const message =
            typeof data?.message === 'string'
                ? data.message
                : (data?.errors && typeof data.errors === 'object'
                    ? String(Object.values(data.errors)[0]?.[0] ?? 'Ошибка смены пароля')
                    : 'Ошибка смены пароля');
        return { error: true, message };
    }
}