export const updateVacancy = async (id: number, vacancyData: any) => {
    const config = useRuntimeConfig();

    try {
        const data = await $fetch(`/vacancies/${id}`, {
            method: 'PUT',
            baseURL: config.public.apiBase,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${useCookie('auth_token').value}`,
                'X-Auth-User': `${useCookie('auth_user').value}`,
            },
            body: vacancyData,
        });

        console.log('Server response: ', data);
        return { data, error: null };
    } catch (error: any) {
        const msg = error?.data?.error ?? error?.data?.message ?? error?.message;
        console.error('Vacancy update error: ', msg || error);
        if (error?.data) console.error('Response body: ', error.data);
        return { data: null, error };
    }
};