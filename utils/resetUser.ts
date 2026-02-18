// resetUser.ts
import { getServerToken } from "./getServerToken";

export const resetUser = async (email: string) => {
    const result = await getServerToken();
    if (!result.token) {
        console.error('Token server not found', result.error);
        return { data: null, error: { message: result.error || 'Token server not found' } };
    }
    const serverToken = result.token;

    const config = useRuntimeConfig();

    const { data, error } = await useFetch('/restore-access', {
        method: 'POST',
        baseURL: config.public.apiBase as string,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serverToken}`,
        },
        body: { email },
    });

    console.log('Server response:', data.value);
    console.log('Server error:', error.value);

    if (error.value) {
        console.error('Login error:', error.value);
        return { data: null, error: error.value }; // Возвращаем ошибку
    }

    return { data: data.value, error: null }; // Возвращаем данные
};