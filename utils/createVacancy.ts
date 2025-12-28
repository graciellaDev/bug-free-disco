export const createVacancy = async (vacancyData: any) => {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    const bodyData = new FormData();
    Object.entries(vacancyData).forEach(([key, value]) => {
        if (key == 'application') {
            if (value) bodyData.append(key, value);
        } else {
            bodyData.append(key, value);
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
