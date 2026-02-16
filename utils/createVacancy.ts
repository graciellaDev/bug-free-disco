export const createVacancy = async (vacancyData: any) => {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    const bodyData = new FormData();
    
    Object.entries(vacancyData).forEach(([key, value]) => {
        if (key == 'application') {
            if (value) bodyData.append(key, value as any);
        } else if (value !== undefined && value !== null) {
            // Преобразуем значения в строки для FormData (кроме File/Blob)
            if (value instanceof File || value instanceof Blob) {
                bodyData.append(key, value);
            } else if (typeof value === 'number' || typeof value === 'boolean') {
                bodyData.append(key, String(value));
            } else if (typeof value === 'object') {
                // Для объектов (массивы, объекты) преобразуем в JSON строку
                bodyData.append(key, JSON.stringify(value));
            } else {
                bodyData.append(key, String(value));
            }
        }
    });

    try {
        const response: {data: any, message: string } = await $fetch(`${config.public.apiBase}/vacancies`, {
            method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                    'X-Auth-User': `${authUser}`
                },
            body: bodyData,
        })

        return { data: response, error: null };
    } catch (error) {
        return { data: null, error: error };
    }
}
