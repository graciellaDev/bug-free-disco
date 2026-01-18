export const createVacancy = async (vacancyData: any) => {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    const bodyData = new FormData();
    
    // Логируем platform_id и base_id для отладки
    if (vacancyData.platform_id !== undefined) {
        console.log('createVacancy: platform_id =', vacancyData.platform_id, typeof vacancyData.platform_id);
    }
    if (vacancyData.base_id !== undefined) {
        console.log('createVacancy: base_id =', vacancyData.base_id, typeof vacancyData.base_id);
    }
    
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
    
    // Проверяем, что platform_id добавлен в FormData
    if (bodyData.has('platform_id')) {
        console.log('createVacancy: platform_id успешно добавлен в FormData');
    } else {
        console.warn('createVacancy: platform_id НЕ найден в FormData!');
    }

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
