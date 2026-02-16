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
        return {data: null, error: true, message: err.response._data.message};
    }
};

